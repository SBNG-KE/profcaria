import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: applicationId } = await params;
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

        const { uid: companyId, schema } = payload;
        if (schema !== 'employer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // 1. Fetch Application first
        console.log('Snapshot API called for App ID:', applicationId);

        const { data: application, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('*')
            .eq('id', applicationId)
            .single();

        console.log('Snapshot App Fetch Result:', { application, appError });

        if (appError || !application) {
            console.error('Snapshot API: Application not found or error', appError);
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        // 2. Verify Ownership via Job
        // Check if the job associated with this application belongs to the current employer (companyId)
        const { data: job, error: jobError } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select('id')
            .eq('id', application.job_id)
            .eq('company_id', companyId)
            .single();

        if (jobError || !job) {
            console.error('Snapshot Access Denied: Job not owned by employer', { jobId: application.job_id, companyId });
            return NextResponse.json({ error: 'Forbidden: You do not own this application' }, { status: 403 });
        }

        const isTerminated = ['terminated', 'resigned', 'rejected', 'declined'].includes(application.status);

        // 3. Return Snapshot if Terminated
        if (isTerminated && application.snapshot_data) {
            console.log('Returning Snapshot Data');
            return NextResponse.json({
                ...application.snapshot_data,
                isSnapshot: true,
                status: application.status
            });
        }

        const { user_id: professionalId, enc_access_list: encAccessList } = application;
        const accessList: string[] = JSON.parse(decryptData(encAccessList) || '[]');

        console.log('Falling back to live data for User ID:', professionalId);

        // 4. Fallback: Return Live Data
        // 4. Fallback: Return Live Data
        // Fetch profile details from professional.users
        const { data: prof, error: profError } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('enc_first_name, enc_last_name, enc_current_role, enc_profile_image_url')
            .eq('id', professionalId)
            .single();

        // Fetch contact info from auth.users (since professional.users only has blind indexes)
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.admin.getUserById(professionalId);

        if (profError || !prof) {
            console.error('Snapshot Fallback Error: Profile not found', profError);
            return NextResponse.json({ error: 'Professional profile not found' }, { status: 404 });
        }

        const profile = {
            id: professionalId,
            firstName: decryptData(prof.enc_first_name),
            lastName: decryptData(prof.enc_last_name),
            role: decryptData(prof.enc_current_role),
            profileImageUrl: decryptData(prof.enc_profile_image_url),
            phone: authUser?.phone || null,
            email: authUser?.email || null
        };

        const { data: documents, error: docError } = await supabaseAdmin
            .schema('professional')
            .from('documents')
            .select('doc_type, enc_content, last_updated')
            .eq('user_id', professionalId)
            .in('doc_type', accessList);

        const sharedDocuments = (documents || []).map((doc: any) => ({
            type: doc.doc_type,
            content: decryptData(doc.enc_content),
            lastUpdated: doc.last_updated
        }));

        return NextResponse.json({
            profile,
            sharedDocuments,
            accessList,
            isSnapshot: false,
            status: application.status
        });

    } catch (error: any) {
        console.error('Snapshot API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
