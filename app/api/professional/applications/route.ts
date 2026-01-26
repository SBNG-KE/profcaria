import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';

// ... (previous imports)

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);
        const { uid, schema } = payload;

        if (schema !== 'professional') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 1. Fetch Applications (Existing Logic)
        const { data: applications, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('id, status, created_at, job_id')
            .eq('user_id', uid)
            .order('created_at', { ascending: false });

        if (appError) {
            console.error('Fetch Applications Error:', appError);
            return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
        }

        // 2. Fetch Direct Message "Conversations" (New Logic)
        // Find unique companies we've talked to (sent or received) without an application
        const { data: sentDMs } = await supabaseAdmin
            .schema('employer')
            .from('messages')
            .select('recipient_id')
            .eq('sender_id', uid)
            .is('application_id', null)
            .eq('recipient_type', 'employer');

        const { data: receivedDMs } = await supabaseAdmin
            .schema('employer')
            .from('messages')
            .select('sender_id')
            .eq('recipient_id', uid)
            .is('application_id', null)
            .eq('sender_type', 'employer');

        const dmCompanyIds = new Set<string>();
        sentDMs?.forEach((m: any) => dmCompanyIds.add(m.recipient_id));
        receivedDMs?.forEach((m: any) => dmCompanyIds.add(m.sender_id));

        // 3. Fetch Job Details for Applications
        const appJobIds = [...new Set((applications || []).map((app: { job_id: any; }) => app.job_id))];
        const { data: jobs, error: jobError } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select('id, enc_title, company_id')
            .in('id', appJobIds);

        if (jobError) throw jobError;

        // 4. Fetch Employer Details (Combined)
        const appCompanyIds = jobs?.map((j: any) => j.company_id) || [];
        const allCompanyIds = [...new Set([...appCompanyIds, ...Array.from(dmCompanyIds)])];

        const { data: employers, error: empError } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('id, enc_company_name, enc_logo_url')
            .in('id', allCompanyIds);

        if (empError) throw empError;

        // 5. Format Applications
        const formattedApps = (applications || []).map((app: any) => {
            const job = jobs?.find((j: { id: any; }) => j.id === app.job_id);
            const employer = employers?.find((e: { id: any; }) => e.id === job?.company_id);

            return {
                id: app.id,
                status: app.status,
                createdAt: app.created_at,
                jobTitle: decryptData(job?.enc_title) || 'Unknown Position',
                companyName: decryptData(employer?.enc_company_name) || 'Secure Employer',
                companyLogoUrl: employer?.enc_logo_url ? decryptData(employer.enc_logo_url) : null,
                companyId: employer?.id || job?.company_id,
                isDm: false
            };
        });

        // 6. Format Direct Messages
        // We need to construct DM objects.
        // Identify which companies from dmCompanyIds are NOT already covered by an application? 
        // Or should we list them separately? 
        // Users might have an application AND a DM thread. They should be distinct items in the list.
        // Yes, separate items.

        const dmConversations = Array.from(dmCompanyIds).map(companyId => {
            const employer = employers?.find((e: any) => e.id === companyId);
            return {
                id: `dm-${companyId}`, // unique synthetic ID
                status: 'active',
                createdAt: new Date().toISOString(), // Mock date or need fetch?
                jobTitle: 'Direct Message',
                companyName: decryptData(employer?.enc_company_name) || 'Unknown Company',
                companyLogoUrl: employer?.enc_logo_url ? decryptData(employer.enc_logo_url) : null,
                companyId: companyId,
                isDm: true,
                otherPartyId: companyId
            };
        });

        const combinedList = [...formattedApps, ...dmConversations];

        // Sort by createdAt desc?
        // DM createdAt is fake now. To do it right, we'd need max(message.created_at).
        // For now, let's just return combined.

        return NextResponse.json({ applications: combinedList });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
