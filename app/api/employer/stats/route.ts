import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';

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

        // Fetch counts using job filters
        const { data: jobs } = await supabaseAdmin.schema('employer').from('jobs').select('id').eq('company_id', uid);
        const jobIds = (jobs || []).map((j: { id: any; }) => j.id);

        const [
            { count: jobsCount },
            { count: appsCount },
            { count: shortlistedCount }
        ] = await Promise.all([
            supabaseAdmin.schema('employer').from('jobs').select('*', { count: 'exact', head: true }).eq('company_id', uid),
            supabaseAdmin.schema('employer').from('applications').select('*', { count: 'exact', head: true }).in('job_id', jobIds),
            supabaseAdmin.schema('employer').from('applications').select('*', { count: 'exact', head: true }).in('job_id', jobIds).eq('status', 'shortlisted')
        ]);

        return NextResponse.json({
            stats: {
                totalJobs: jobsCount || 0,
                totalApplications: appsCount || 0,
                shortlisted: shortlistedCount || 0,
                responseRate: '92%', // Still static until we have response time logic
                avgTime: '14d'       // Still static
            }
        });

    } catch (error) {
        console.error('Stats Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
