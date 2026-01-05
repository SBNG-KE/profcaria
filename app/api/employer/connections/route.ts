import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData, encryptData } from '@/lib/security';

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
        if (!jobs || jobs.length === 0) return NextResponse.json({ connections: [] });

        const jobIds = jobs.map((j: { id: any; }) => j.id);

        // 2. Get applications (connections)
        // We consider 'accepted', 'hired', 'pending_termination', 'terminated' as connections (active or past)
        const { data: applications, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('*')
            .in('job_id', jobIds)
            .in('status', ['accepted', 'hired', 'employed', 'offered', 'pending_termination', 'terminated'])
            .order('created_at', { ascending: false });

        if (appError) throw appError;
        if (!applications || applications.length === 0) return NextResponse.json({ connections: [] });

        // 3. Get Professional Details (Auth + Profile)
        const connections = await Promise.all(applications.map(async (app: any) => {
            const job = jobs.find((j: { id: any; }) => j.id === app.job_id);

            // Fetch Auth Data (Email/Phone)
            const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.admin.getUserById(app.user_id);

            // Fetch Profile Data (Name, Role, Image)
            const { data: prof, error: profError } = await supabaseAdmin
                .schema('professional')
                .from('users')
                .select('enc_first_name, enc_last_name, enc_current_role, enc_profile_image_url')
                .eq('id', app.user_id)
                .single();

            const firstName = prof ? decryptData(prof.enc_first_name) : '';
            const lastName = prof ? decryptData(prof.enc_last_name) : '';
            const name = firstName && lastName ? `${firstName} ${lastName}` : 'Unknown Professional';
            const role = prof ? decryptData(prof.enc_current_role) : 'Professional';
            const profileImageUrl = prof ? decryptData(prof.enc_profile_image_url) : null;

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
                    name,
                    role,
                    profileImageUrl,
                    email: authUser?.email || null,
                    phone: authUser?.phone || null,
                },
                accessList: []
            };
        }));

        return NextResponse.json({ connections });

    } catch (error: any) {
        console.error('Employer Connections GET Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

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

        if (action === 'terminate') {
            // Update status to terminated
            const { error: updateError } = await supabaseAdmin
                .schema('employer')
                .from('applications')
                .update({ status: 'terminated' })
                .eq('id', applicationId);

            if (updateError) throw updateError;
            return NextResponse.json({ success: true });
        }

        if (action === 'disapprove') {
            // Revert status to employed (or whatever the active state was)
            const { error: updateError } = await supabaseAdmin
                .schema('employer')
                .from('applications')
                .update({ status: 'employed' })
                .eq('id', applicationId);

            if (updateError) throw updateError;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Employer Connections PATCH Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
