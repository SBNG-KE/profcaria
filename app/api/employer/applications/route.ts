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
        const { uid, schema } = payload;

        if (schema !== 'employer') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 1. Get all jobs for this company
        const { data: jobs, error: jobsError } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select('id, enc_title')
            .eq('company_id', uid);

        if (jobsError) throw jobsError;
        if (!jobs || jobs.length === 0) return NextResponse.json({ applications: [] });

        const jobIds = jobs.map(j => j.id);

        // 2. Get all applications for these jobs
        const { data: applications, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('*')
            .in('job_id', jobIds)
            .order('created_at', { ascending: false });

        if (appError) throw appError;
        if (!applications || applications.length === 0) return NextResponse.json({ applications: [] });

        // 3. Get Professional Details for these applications
        const professionalIds = [...new Set(applications.map(app => app.user_id))];
        const { data: professionals, error: profError } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('id, enc_first_name, enc_last_name')
            .in('id', professionalIds);

        if (profError) {
            console.error('Fetch Professionals Error:', profError);
        }

        const formattedApps = applications.map((app: any) => {
            const job = jobs.find(j => j.id === app.job_id);
            const prof = professionals?.find(p => p.id === app.user_id);

            return {
                id: app.id,
                status: app.status,
                createdAt: app.created_at,
                job: {
                    id: job?.id,
                    title: decryptData(job?.enc_title) || 'Unknown Job'
                },
                user: {
                    id: app.user_id,
                    name: prof ? `${decryptData(prof.enc_first_name)} ${decryptData(prof.enc_last_name)}` : 'Candidate'
                }
            };
        });

        return NextResponse.json({ applications: formattedApps });

    } catch (error: any) {
        console.error('Fetch Employer Applications Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
