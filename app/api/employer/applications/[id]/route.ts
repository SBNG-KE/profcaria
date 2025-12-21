import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData } from '@/lib/security';

export const runtime = 'nodejs';

// PATCH: Update application status
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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
        if (schema !== 'employer') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { status } = await req.json();

        if (!status || !['accepted', 'rejected', 'pending', 'terminated'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Verify ownership
        const { data: application, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('id, user_id, jobs(company_id)')
            .eq('id', applicationId)
            .single();

        if (appError || !application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        const jobData = application.jobs as any;
        if (jobData?.company_id !== companyId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update status
        const { error: updateError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .update({ status })
            .eq('id', applicationId);

        if (updateError) throw updateError;

        // Notify the professional
        let message = '';
        if (status === 'accepted') {
            message = 'Congratulations! Your application has been accepted. You are now connected with the employer.';
        } else if (status === 'rejected') {
            message = 'Your application has been reviewed. Unfortunately, it was not accepted at this time.';
        } else if (status === 'terminated') {
            message = 'Your employment connection has been terminated.';
        }

        if (message) {
            await supabaseAdmin
                .schema('professional')
                .from('notifications')
                .insert([{
                    user_id: application.user_id,
                    enc_message: encryptData(message),
                    type: 'application'
                }]);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Update Application Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

