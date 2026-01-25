import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);
        const userId = payload.uid;

        if (payload.schema !== 'professional') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // 1. Fetch Manual History
        const { data: manualData, error: manualError } = await supabaseAdmin
            .schema('professional')
            .from('employment_history')
            .select('*')
            .eq('user_id', userId);

        if (manualError) throw manualError;

        const manualHistory = manualData.map((item: any) => ({
            id: item.id,
            source: 'manual',
            company: decryptData(item.enc_company as string),
            title: decryptData(item.enc_title as string),
            location: decryptData(item.enc_location as string),
            type: decryptData(item.enc_type as string),
            startDate: decryptData(item.enc_start_date as string),
            endDate: decryptData(item.enc_end_date as string),
            isCurrent: item.is_current,
            description: decryptData(item.enc_description as string),
            logoUrl: null // Manual entries usually don't have verified logos unless we fetch metadata
        }));

        // 2. Fetch Automatic History (from Applications/Connections)
        const { data: autoData, error: autoError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('*, jobs(id, enc_title, company_id)')
            .eq('user_id', userId)
            .in('status', ['hired', 'employed', 'terminated', 'resigned', 'pending_termination']);

        if (autoError) throw autoError;

        const safeAutoData = autoData || [];

        // Note: Supabase join syntax with nested can be tricky.
        // If the above select fails, we might need a simpler join or manual fetch.
        // Let's rely on Step 1 logic if join is complex, but let's try to map manually if `companies` comes back weird.
        // Actually, the previous Connections API did separate fetches. Let's do that for safety if we want company details.

        // Simpler fetch first
        const appIds = safeAutoData.map((a: any) => a.id);
        // We need company names. 
        // Let's fetch companies separately
        const companyIds = [...new Set(safeAutoData.map((a: any) => a.jobs?.company_id).filter(Boolean))];
        const { data: companies } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('id, enc_company_name, enc_logo_url')
            .in('id', companyIds);

        const autoHistory = safeAutoData.map((app: any) => {
            const job = app.jobs;
            const company = companies?.find((c: any) => c.id === job?.company_id);
            const isCurrent = ['hired', 'employed', 'pending_termination'].includes(app.status);

            return {
                id: app.id,
                source: 'automatic',
                company: company ? decryptData(company.enc_company_name as string) : 'Unknown Company',
                title: job ? decryptData(job.enc_title as string) : 'Unknown Job',
                location: 'Remote', // Default or fetch from job?
                type: 'Full-time', // Default?
                startDate: new Date(app.created_at).toISOString().split('T')[0], // Approximation
                endDate: app.terminated_at ? new Date(app.terminated_at).toISOString().split('T')[0] : null,
                isCurrent: isCurrent,
                description: 'Verified Employment via Profcaria',
                logoUrl: company ? decryptData(company.enc_logo_url as string) : null
            };
        });

        // 3. Merge and Sort
        const allHistory = [...manualHistory, ...autoHistory].sort((a, b) => {
            // Sort by startDate descending (latest first)
            const dateA = new Date(a.startDate || '1900-01-01').getTime();
            const dateB = new Date(b.startDate || '1900-01-01').getTime();
            return dateB - dateA;
        });

        return NextResponse.json({ history: allHistory });

    } catch (error: any) {
        console.error('Fetch Employment Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
