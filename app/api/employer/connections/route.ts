import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/security';

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
            .select('*, jobs(enc_title)')
            .in('job_id', jobIds)
            .in('status', ['accepted', 'hired', 'employed', 'offered', 'pending_termination', 'pending_resignation', 'terminated', 'resigned', 'rejected', 'declined'])
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
                .select('enc_first_name, enc_last_name, enc_current_role, enc_profile_image_url, badge_type')
                .eq('id', app.user_id)
                .single();

            const firstName = prof ? decryptData(prof.enc_first_name) : '';
            const lastName = prof ? decryptData(prof.enc_last_name) : '';
            const name = firstName && lastName ? `${firstName} ${lastName} ` : 'Unknown Professional';
            const role = prof ? decryptData(prof.enc_current_role) : 'Professional';
            const profileImageUrl = prof ? decryptData(prof.enc_profile_image_url) : null;

            return {
                id: app.id,
                applicationId: app.id,
                userId: app.user_id,
                status: app.status,
                terminationType: app.termination_type,
                terminationReason: app.enc_termination_reason ? decryptData(app.enc_termination_reason) : null,
                connectedAt: app.created_at,
                terminatedAt: app.terminated_at,
                connectionFileUrl: app.connection_file_url,
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
                    badgeType: prof?.badge_type || 'none'
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

        const { applicationId, action, reason } = await req.json();

        if (action === 'involuntary_terminate') {
            const enc_reason = reason ? encryptData(reason) : null;

            // Create Snapshot
            const snapshotData = await createSnapshot(applicationId);

            const { error: updateError } = await supabaseAdmin
                .schema('employer')
                .from('applications')
                .update({
                    status: 'terminated',
                    termination_type: 'involuntary',
                    termination_initiated_by: 'employer',
                    enc_termination_reason: enc_reason,
                    terminated_at: new Date().toISOString(),
                    snapshot_data: snapshotData // Save snapshot
                })
                .eq('id', applicationId);

            if (updateError) throw updateError;
            return NextResponse.json({ success: true });
        }

        if (action === 'approve_resignation') {
            const snapshotData = await createSnapshot(applicationId);
            const { error: updateError } = await supabaseAdmin
                .schema('employer')
                .from('applications')
                .update({
                    status: 'resigned',
                    termination_type: 'resignation',
                    terminated_at: new Date().toISOString(),
                    snapshot_data: snapshotData
                })
                .eq('id', applicationId);

            if (updateError) throw updateError;
            return NextResponse.json({ success: true });
        }

        if (action === 'approve_mutual_termination') {
            const snapshotData = await createSnapshot(applicationId);
            const { error: updateError } = await supabaseAdmin
                .schema('employer')
                .from('applications')
                .update({
                    status: 'terminated',
                    termination_type: 'mutual',
                    terminated_at: new Date().toISOString(),
                    snapshot_data: snapshotData
                })
                .eq('id', applicationId);

            if (updateError) throw updateError;
            return NextResponse.json({ success: true });
        }

        if (action === 'disapprove_termination' || action === 'disapprove') {
            // Revert status to employed/hired
            const { error: updateError } = await supabaseAdmin
                .schema('employer')
                .from('applications')
                .update({
                    status: 'employed',
                })
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

// Helper to create profile snapshot
async function createSnapshot(applicationId: string) {
    // 1. Fetch Application + Access List
    const { data: application, error: appError } = await supabaseAdmin
        .schema('employer')
        .from('applications')
        .select(`
            user_id,
            enc_access_list
        `)
        .eq('id', applicationId)
        .single();

    if (appError || !application) throw new Error('Snapshot: Application not found');

    const { user_id: professionalId, enc_access_list: encAccessList } = application;
    const accessList: string[] = JSON.parse(decryptData(encAccessList) || '[]');

    // 2. Fetch Professional Profile
    const { data: prof, error: profError } = await supabaseAdmin
        .schema('professional')
        .from('users')
        .select('enc_first_name, enc_last_name, enc_current_role, enc_profile_image_url')
        .eq('id', professionalId)
        .single();

    // Fetch Auth Data (Email/Phone)
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.admin.getUserById(professionalId);

    if (profError || !prof) throw new Error('Snapshot: Profile not found');

    const profile = {
        id: professionalId,
        firstName: decryptData(prof.enc_first_name),
        lastName: decryptData(prof.enc_last_name),
        role: decryptData(prof.enc_current_role),
        profileImageUrl: decryptData(prof.enc_profile_image_url),
        phone: authUser?.phone || null,
        email: authUser?.email || null
    };

    // 3. Fetch Shared Documents Content
    const { data: documents, error: docError } = await supabaseAdmin
        .schema('professional')
        .from('documents')
        .select('doc_type, enc_content, last_updated')
        .eq('user_id', professionalId)
        .in('doc_type', accessList);

    // 3b. Fetch Uploaded Documents (all uploaded files are preserved in snapshot)
    const { data: uploadedDocs } = await supabaseAdmin
        .schema('professional')
        .from('uploaded_documents')
        .select('id, enc_name, enc_blob_url, file_type, file_size, created_at')
        .eq('user_id', professionalId);

    const sharedDocuments = (documents || []).map((doc: any) => ({
        type: doc.doc_type,
        content: decryptData(doc.enc_content),
        lastUpdated: doc.last_updated
    }));

    const uploadedDocuments = (uploadedDocs || []).map((doc: any) => ({
        id: doc.id,
        name: decryptData(doc.enc_name),
        blobUrl: decryptData(doc.enc_blob_url),
        fileType: doc.file_type,
        fileSize: doc.file_size,
        createdAt: doc.created_at
    }));

    return {
        profile,
        sharedDocuments,
        uploadedDocuments,
        accessList,
        snapshottedAt: new Date().toISOString()
    };
}
