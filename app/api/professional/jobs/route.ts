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
        let payload;
        try {
            const { payload: verifiedPayload } = await jwtVerify(token, secretKey);
            payload = verifiedPayload;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const { schema } = payload;
        if (schema !== 'professional') {
            return NextResponse.json({ error: 'Only professionals can browse jobs' }, { status: 403 });
        }

        // Fetch active jobs with company details
        const { data: jobs, error } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select(`
                *,
                company:companies (
                    id,
                    enc_company_name,
                    enc_logo_url
                )
            `)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Fetch Jobs Error:', error);
            return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
        }

        // Decrypt job and company info
        const decryptedJobs = (jobs || []).map((job: any) => ({
            id: job.id,
            title: decryptData(job.enc_title),
            description: decryptData(job.enc_description),
            company: {
                id: job.company?.id,
                name: decryptData(job.company?.enc_company_name),
                logoUrl: decryptData(job.company?.enc_logo_url)
            },
            createdAt: job.created_at
        }));

        return NextResponse.json({ jobs: decryptedJobs });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
