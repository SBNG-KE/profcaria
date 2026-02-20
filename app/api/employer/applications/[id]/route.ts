import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/security';
import crypto from 'crypto';

export const runtime = 'nodejs';

// GET: Fetch single application details
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

        const { uid: companyId } = payload;

        // 1. Fetch Application first (without joins to avoid schema issues)
        const { data: application, error } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('*, enc_access_list')
            .eq('id', applicationId)
            .single();

        if (error || !application) {
            console.error("Application fetch error:", error);
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        // 2. Fetch Job to verify ownership
        const { data: job, error: jobError } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select('company_id, enc_form_schema')
            .eq('id', application.job_id)
            .single();

        if (jobError || !job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        // Verify ownership
        if (job.company_id !== companyId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 3. Fetch Professional User Details
        const { data: user, error: userError } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('id, enc_first_name, enc_last_name, enc_profile_image_url, badge_type')
            .eq('id', application.user_id)
            .single();

        // 4. Fetch Shared Documents (Artifacts)

        // 4. Fetch Shared Documents (Artifacts)
        const accessList: string[] = JSON.parse(decryptData(application.enc_access_list) || '[]');

        // Fetch existing docs
        let artifacts: { type: string, content: string }[] = [];
        let existingDocsMap = new Map<string, string>();

        if (accessList.length > 0) {
            const { data: documents } = await supabaseAdmin
                .schema('professional')
                .from('documents')
                .select('doc_type, enc_content')
                .eq('user_id', application.user_id)
                .in('doc_type', accessList);

            if (documents) {
                documents.forEach((doc: { enc_content: string; doc_type: string; }) => {
                    const content = decryptData(doc.enc_content);
                    if (content) existingDocsMap.set(doc.doc_type, content);
                });
            }
        }

        // Build final artifact list ensuring ALL granted permissions are shown
        // If content is missing, we show a placeholder.
        accessList.forEach(type => {
            const content = existingDocsMap.get(type);
            artifacts.push({
                type: type,
                content: content || '<p><em>No content has been uploaded for this section yet.</em></p>'
            });
        });

        // Safe Decryption of Form Data with Label Mapping
        let formData: Record<string, any> = {};
        try {
            if (application.enc_form_data) {
                const decrypted = decryptData(application.enc_form_data);
                if (decrypted) {
                    const rawFormData = JSON.parse(decrypted);

                    // Decrypt form schema to get readable labels
                    let labelMap: Record<string, string> = {};
                    if (job.enc_form_schema) {
                        try {
                            const schemaDecrypted = decryptData(job.enc_form_schema);
                            if (schemaDecrypted) {
                                const schema = JSON.parse(schemaDecrypted);
                                // Build ID -> Label map
                                schema.forEach((field: { id: string; label: string }) => {
                                    labelMap[field.id] = field.label;
                                });
                            }
                        } catch (schemaErr) {
                            console.error('Error decrypting form schema:', schemaErr);
                        }
                    }

                    // Map field IDs to readable labels
                    for (const [key, value] of Object.entries(rawFormData)) {
                        const label = labelMap[key] || key; // Fallback to ID if no label
                        formData[label] = value;
                    }
                }
            }
        } catch (err) {
            console.error('Error decrypting form data:', err);
            formData = { "Error": "Could not decrypt application data." };
        }

        return NextResponse.json({
            application: {
                id: application.id,
                status: application.status,
                createdAt: application.created_at,
                formData,
                job: {
                    id: application.job_id
                },
                user: {
                    id: application.user_id,
                    name: user ? `${decryptData(user.enc_first_name)} ${decryptData(user.enc_last_name)}` : 'Unknown User',
                    profileImageUrl: user?.enc_profile_image_url ? decryptData(user.enc_profile_image_url) : null,
                    badgeType: user?.badge_type || 'none'
                },
                kycData: {
                    imageUrl: application.kyc_image_url || null,
                    videoUrl: application.kyc_video_url || null
                },
                artifacts
            }
        });

    } catch (error: any) {
        console.error('Fetch Application Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

// PATCH: Update application status
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

        if (!status || !['accepted', 'rejected', 'pending', 'terminated', 'shortlisted', 'employed', 'declined', 'pending_verification'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Verify ownership and get current application state
        const { data: application, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('id, user_id, status, job_id, jobs(company_id, enc_title), kyc_video_url')
            .eq('id', applicationId)
            .single();

        if (appError || !application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        const jobData = application.jobs as any;
        if (jobData?.company_id !== companyId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Check Limits before creating a connection
        const { checkLimit, incrementUsage } = await import('@/lib/billing');

        const isEmploying = status === 'employed';
        if (isEmploying) {
            const hasLimit = await checkLimit(companyId as string, 'connections');
            if (!hasLimit) {
                return NextResponse.json({ error: 'Connection limit reached for your plan.' }, { status: 403 });
            }
        }

        // Build update data
        const updateData: any = { status };
        let kycToken = null;

        // INTERCEPT SHORTLISTING FOR KYC
        if (status === 'shortlisted' && !application.kyc_video_url) {
            updateData.status = 'pending_verification';
            const rawToken = crypto.randomBytes(32).toString('hex');
            // Token format: base64(appId:rawToken)
            kycToken = Buffer.from(`${applicationId}:${rawToken}`).toString('base64');
            updateData.enc_kyc_token = encryptData(rawToken); // Store just the random part encrypted
        }

        const currentStatus = application.status;
        if (currentStatus === 'pending' && updateData.status !== 'pending') {
            updateData.reviewed_at = new Date().toISOString();
        }

        // Update status
        const { error: updateError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .update(updateData)
            .eq('id', applicationId);

        if (updateError) throw updateError;

        // Increment usage if successful
        if (isEmploying) {
            await incrementUsage(companyId as string, 'connections');
        }

        // Fetch professional email and company name for email notifications
        const { data: professional } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('enc_email')
            .eq('id', application.user_id)
            .single();

        const { data: company } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('enc_company_name')
            .eq('id', companyId)
            .single();

        const professionalEmail = professional?.enc_email ? decryptData(professional.enc_email) : null;
        const jobTitle = jobData?.enc_title ? decryptData(jobData.enc_title) : 'Position';
        const companyName = company?.enc_company_name ? decryptData(company.enc_company_name) : 'Employer';

        // Send email notifications for key status changes
        if (professionalEmail) {
            const { sendShortlistedNotification, sendEmployedNotification, sendKYCRequiredNotification } = await import('@/lib/email');
            const safeJobTitle = jobTitle || 'Position';
            const safeCompanyName = companyName || 'Employer';

            if (updateData.status === 'pending_verification' && kycToken) {
                // Send the magic link video KYC email to the professional
                const kycLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-identity?token=${kycToken}`;
                if (sendKYCRequiredNotification) {
                    sendKYCRequiredNotification(professionalEmail, safeJobTitle, safeCompanyName, kycLink).catch(console.error);
                }
            } else if (updateData.status === 'shortlisted') {
                // Non-blocking email
                sendShortlistedNotification(professionalEmail, safeJobTitle, safeCompanyName).catch(console.error);
            } else if (status === 'employed') {
                // Critical email - send immediately
                try {
                    await sendEmployedNotification(professionalEmail, safeJobTitle, safeCompanyName);
                } catch (emailErr) {
                    console.error('Failed to send employed email:', emailErr);
                    // Don't fail the request, but log it
                }
            }
        }

        // Notify the professional in-app
        let message = '';
        if (updateData.status === 'pending_verification') {
            message = 'Action Required: You have been shortlisted! However, you must complete your Video Identity Verification (KYC) before the employer can proceed. Check your email for the secure link.';
        } else if (updateData.status === 'shortlisted') {
            message = 'Great news! You have been officially shortlisted for the position. The employer is reviewing your profile for the next steps.';
        } else if (updateData.status === 'employed') {
            message = 'Big congratulations! You have been officially employed. Check your contracts for details.';
        } else if (updateData.status === 'rejected') {
            message = 'Your application status has been updated. Unfortunately, you were not selected for this role.';
        } else if (updateData.status === 'declined') {
            message = 'Your application has been declined by the employer.';
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

