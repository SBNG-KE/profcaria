import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData, encryptData } from '@/lib/security';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const { token, imageUrl, videoUrl } = await req.json();

        if (!token || !imageUrl || !videoUrl) {
            return NextResponse.json({ error: 'Missing required validation data.' }, { status: 400 });
        }

        // 1. Decode token format: base64url(appId:rawToken)
        //    Also supports standard base64 for backward compatibility
        let decodedToken = '';
        try {
            // Try base64url first, then fall back to standard base64
            decodedToken = Buffer.from(token, 'base64url').toString('utf8');
            if (!decodedToken.includes(':')) {
                decodedToken = Buffer.from(token, 'base64').toString('utf8');
            }
        } catch (e) {
            return NextResponse.json({ error: 'Malformed verification token.' }, { status: 400 });
        }

        const [applicationId, rawToken] = decodedToken.split(':');

        if (!applicationId || !rawToken) {
            return NextResponse.json({ error: 'Invalid token structure.' }, { status: 400 });
        }

        // 2. Fetch the specific application using O(1) lookup
        const { data: application, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('id, user_id, status, enc_kyc_token, job_id, jobs(company_id, enc_title)')
            .eq('id', applicationId)
            .single();

        if (appError || !application) {
            return NextResponse.json({ error: 'Application not found or no longer exists.' }, { status: 404 });
        }

        // 3. Verify they are actually in the waiting state
        if (application.status !== 'pending_verification') {
            return NextResponse.json({ error: 'This application is not awaiting verification.' }, { status: 400 });
        }

        // 4. Decrypt and check the database token securely
        const storedRawToken = decryptData(application.enc_kyc_token);
        if (!storedRawToken || storedRawToken !== rawToken) {
            return NextResponse.json({ error: 'Verification link is invalid or expired.' }, { status: 403 });
        }

        // 5. Success! Move them to shortlisted and save blobs
        const { error: updateError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .update({
                status: 'shortlisted',
                kyc_image_url: imageUrl,
                kyc_video_url: videoUrl,
                enc_kyc_token: null, // Consume the token
                reviewed_at: new Date().toISOString()
            })
            .eq('id', applicationId);

        if (updateError) {
            throw updateError;
        }

        // 6. Fetch details for Notifications
        const jobData = application.jobs as any;
        const companyId = jobData?.company_id;

        const { data: professional } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('enc_email, enc_first_name, enc_last_name')
            .eq('id', application.user_id)
            .single();

        const professionalEmail = professional?.enc_email ? decryptData(professional.enc_email) : null;
        const jobTitle = jobData?.enc_title ? decryptData(jobData.enc_title) : 'Position';
        const safeJobTitle = jobTitle || 'Position';
        const profName = professional ? `${decryptData(professional.enc_first_name)} ${decryptData(professional.enc_last_name)}` : 'A candidate';

        // Notify the professional they passed
        if (professionalEmail) {
            const { sendShortlistedNotification } = await import('@/lib/email');

            // We need the company name instead of ID for the email
            const { data: companyDetails } = await supabaseAdmin
                .schema('employer')
                .from('companies')
                .select('enc_company_name')
                .eq('id', companyId)
                .single();

            const safeCompanyName = companyDetails?.enc_company_name ? decryptData(companyDetails.enc_company_name) : 'Employer';

            sendShortlistedNotification(professionalEmail, safeJobTitle, safeCompanyName || 'Employer').catch(console.error);
        }

        // Notify employer IN APP that candidate finished
        if (companyId) {
            await supabaseAdmin
                .schema('employer')
                .from('notifications')
                .insert([{
                    company_id: companyId,
                    application_id: applicationId,
                    enc_message: encryptData(`KYC Complete! ${profName} has verified their identity and is now officially Shortlisted for ${safeJobTitle}.`),
                    type: 'application'
                }]);

            // Also send employer an EMAIL notification
            try {
                const { data: companyDetails } = await supabaseAdmin
                    .schema('employer')
                    .from('companies')
                    .select('enc_email, enc_company_name')
                    .eq('id', companyId)
                    .single();

                if (companyDetails?.enc_email) {
                    const employerEmail = decryptData(companyDetails.enc_email);
                    const companyName = companyDetails.enc_company_name ? decryptData(companyDetails.enc_company_name) : 'Employer';
                    if (employerEmail) {
                        const { sendKYCCompletedNotification } = await import('@/lib/email');
                        sendKYCCompletedNotification(
                            employerEmail,
                            profName,
                            safeJobTitle,
                            companyName || 'Employer'
                        ).catch(console.error);
                    }
                }
            } catch (emailErr) {
                console.error('Failed to send employer KYC completion email:', emailErr);
            }
        }

        return NextResponse.json({ success: true, message: 'Identity verified successfully!' });

    } catch (error: any) {
        console.error('Verify Identity Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
