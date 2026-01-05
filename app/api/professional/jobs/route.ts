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

        // Fetch jobs and LEFT JOIN applications for this user to check status
        const { data: jobs, error } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select(`
                *,
                company:companies (
                    id,
                    enc_company_name,
                    enc_logo_url
                ),
                applications(
                    id,
                    status,
                    user_id
                )
            `)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Fetch Jobs Error:', error);
            return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
        }

        const { uid: userId } = payload;

        // Decrypt job, company, and attach application status
        const decryptedJobs = (jobs || []).map((job: any) => {
            const myApp = job.applications?.find((app: any) => app.user_id === userId);
            return {
                id: job.id,
                title: decryptData(job.enc_title),
                description: decryptData(job.enc_description),
                location: decryptData(job.enc_location),
                location_type: job.location_type || 'remote',
                company: {
                    id: job.company?.id,
                    name: decryptData(job.company?.enc_company_name),
                    logoUrl: decryptData(job.company?.enc_logo_url)
                },
                createdAt: job.created_at,
                applicationStatus: myApp?.status || null,
                applicationId: myApp?.id || null
            };
        });

        return NextResponse.json({ jobs: decryptedJobs });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
