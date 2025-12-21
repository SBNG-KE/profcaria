import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData, encryptData } from '@/lib/security';

export const runtime = 'nodejs';

// GET: Fetch all connections (accepted applications) for this employer
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
        if (!jobs || jobs.length === 0) return NextResponse.json({ connections: [] });

        const jobIds = jobs.map(j => j.id);

        // 2. Get all accepted applications (connections) for these jobs
        const { data: applications, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('*')
            .in('job_id', jobIds)
            .eq('status', 'accepted')
            .order('created_at', { ascending: false });

        if (appError) throw appError;
        if (!applications || applications.length === 0) return NextResponse.json({ connections: [] });

        // 3. Get Professional Details
        const professionalIds = [...new Set(applications.map(app => app.user_id))];
        const { data: professionals, error: profError } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('id, enc_first_name, enc_last_name, enc_current_role, enc_profile_image_url')
            .in('id', professionalIds);

        if (profError) {
            console.error('Fetch Professionals Error:', profError);
        }

        const connections = applications.map((app: any) => {
            const job = jobs.find(j => j.id === app.job_id);
            const prof = professionals?.find(p => p.id === app.user_id);
            const accessList = app.enc_access_list ? JSON.parse(decryptData(app.enc_access_list) || '[]') : [];

            return {
                id: app.id,
                applicationId: app.id,
                userId: app.user_id,
                status: app.status,
                connectedAt: app.created_at,
                job: {
                    id: job?.id,
                    title: decryptData(job?.enc_title) || 'Unknown Job'
                },
                professional: {
                    id: app.user_id,
                    firstName: prof ? decryptData(prof.enc_first_name) : '',
                    lastName: prof ? decryptData(prof.enc_last_name) : '',
                    name: prof ? `${decryptData(prof.enc_first_name)} ${decryptData(prof.enc_last_name)}` : 'Professional',
                    role: prof ? decryptData(prof.enc_current_role) : '',
                    profileImageUrl: prof ? decryptData(prof.enc_profile_image_url) : null
                },
                accessList
            };
        });

        return NextResponse.json({ connections });

    } catch (error: any) {
        console.error('Fetch Connections Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

// PATCH: Terminate a connection
export async function PATCH(req: Request) {
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

        const { applicationId, action } = await req.json();

        if (!applicationId || action !== 'terminate') {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        // Verify ownership
        const { data: app, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('id, user_id, jobs(company_id)')
            .eq('id', applicationId)
            .single();

        if (appError || !app) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        const jobData = app.jobs as any;
        if (jobData?.company_id !== uid) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update status to terminated
        const { error: updateError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .update({ status: 'terminated' })
            .eq('id', applicationId);

        if (updateError) throw updateError;

        // Notify the professional
        await supabaseAdmin
            .schema('professional')
            .from('notifications')
            .insert([{
                user_id: app.user_id,
                enc_message: encryptData('Your employment connection has been terminated by the employer.'),
                type: 'connection'
            }]);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Terminate Connection Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

