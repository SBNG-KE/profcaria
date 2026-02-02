import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/security';
import { sendApplicationReceivedEmail } from '@/lib/email';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: jobId } = await params;
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

        const { uid, schema } = payload;
        if (schema !== 'professional') {
            return NextResponse.json({ error: 'Only professionals can apply to jobs' }, { status: 403 });
        }

        const body = await req.json();
        const { formData, accessList } = body;

        if (!formData) {
            return NextResponse.json({ error: 'Missing application data' }, { status: 400 });
        }

        // Encrypt application data
        const encFormData = encryptData(JSON.stringify(formData));
        const encAccessList = encryptData(JSON.stringify(accessList || []));

        const { data, error } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .insert([
                {
                    job_id: jobId,
                    user_id: uid,
                    enc_form_data: encFormData,
                    enc_access_list: encAccessList,
                    status: 'pending'
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Application Error:', error);
            return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
        }

        // Fetch job and company details for notification
        const { data: job } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select('company_id, enc_title, status')
            .eq('id', jobId)
            .single();

        if (job) {
            // Create in-app notification
            await supabaseAdmin
                .schema('employer')
                .from('notifications')
                .insert([
                    {
                        company_id: job.company_id,
                        enc_message: encryptData('New application received for your job.'),
                        type: 'application'
                    }
                ]);

            // Send email notification if job is still open
            if (job.status !== 'closed') {
                try {
                    // Get applicant name
                    const { data: applicant } = await supabaseAdmin
                        .schema('professional')
                        .from('users')
                        .select('enc_first_name, enc_last_name')
                        .eq('id', uid)
                        .single();

                    // Get company admin email
                    const { data: company } = await supabaseAdmin
                        .schema('employer')
                        .from('companies')
                        .select('admin_email')
                        .eq('id', job.company_id)
                        .single();

                    if (applicant && company?.admin_email && job.enc_title && applicant.enc_first_name && applicant.enc_last_name) {
                        const firstName = decryptData(applicant.enc_first_name) || 'Applicant';
                        const lastName = decryptData(applicant.enc_last_name) || '';
                        const jobTitle = decryptData(job.enc_title) || 'Position';

                        await sendApplicationReceivedEmail(
                            company.admin_email,
                            `${firstName} ${lastName}`.trim(),
                            jobTitle,
                            jobId
                        );
                    }
                } catch (emailError) {
                    console.error('Email notification failed:', emailError);
                    // Don't fail the application if email fails
                }
            }
        }

        return NextResponse.json({ success: true, applicationId: data.id });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
