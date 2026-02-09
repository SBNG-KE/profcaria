import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { encryptData, decryptData } from '@/lib/security';
import { Resend } from 'resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Resend for email
const resend = new Resend(process.env.RESEND_API_KEY);

// Predefined reference questions
export const REFERENCE_QUESTIONS = [
    { id: 'work_quality', label: 'How would you rate the quality of their work?' },
    { id: 'reliability', label: 'Was this person reliable and punctual?' },
    { id: 'teamwork', label: 'How well did they work with others?' },
    { id: 'communication', label: 'How would you rate their communication skills?' },
    { id: 'problem_solving', label: 'How effective were they at solving problems?' },
    { id: 'leadership', label: 'Did they show leadership qualities?' },
    { id: 'adaptability', label: 'How well did they adapt to changes?' },
    { id: 'rehire', label: 'Would you rehire this person?' },
    { id: 'reason_left', label: 'Why did they leave your organization?' },
    { id: 'strengths', label: 'What are their greatest strengths?' },
    { id: 'improvements', label: 'What areas could they improve?' },
    { id: 'recommendation', label: 'Would you recommend them for this role?' }
];

/**
 * POST /api/employer/references/request
 * 
 * Sends a reference request to a previous employer
 */
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.schema !== 'employer') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const {
            applicationId,        // Current application being reviewed
            targetEmploymentId,   // The verified employment record to reference
            targetCompanyId,      // Company to request reference from
            targetCompanyEmail,   // Email to send request to
            questionIds,          // Array of question IDs selected
            customMessage         // Optional custom message
        } = body;

        // Validate required fields
        if (!applicationId || !targetEmploymentId || !targetCompanyId || !targetCompanyEmail) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!questionIds || questionIds.length === 0) {
            return NextResponse.json({ error: 'Please select at least one question' }, { status: 400 });
        }

        // Get requesting company details
        const { data: requestingCompany, error: companyError } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('id, enc_company_name, enc_work_email')
            .eq('id', user.id)
            .single();

        if (companyError || !requestingCompany) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // Get the application to find the professional
        const { data: application, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('user_id')
            .eq('id', applicationId)
            .single();

        if (appError || !application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        // Get professional's name
        const { data: professional } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('enc_first_name, enc_last_name')
            .eq('id', application.user_id)
            .single();

        const professionalName = professional
            ? `${decryptData(professional.enc_first_name)} ${decryptData(professional.enc_last_name)}`
            : 'the candidate';

        // Get target company name
        const { data: targetCompany } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('enc_company_name')
            .eq('id', targetCompanyId)
            .single();

        const targetCompanyName = targetCompany
            ? decryptData(targetCompany.enc_company_name)
            : 'Previous Employer';

        const requestingCompanyName = decryptData(requestingCompany.enc_company_name);
        const requestingCompanyEmail = decryptData(requestingCompany.enc_work_email);

        // Create the reference request record
        const { data: refRequest, error: insertError } = await supabaseAdmin
            .schema('employer')
            .from('reference_requests')
            .insert({
                requesting_company_id: user.id,
                requesting_application_id: applicationId,
                target_company_id: targetCompanyId,
                target_company_email: targetCompanyEmail,
                professional_id: application.user_id,
                target_employment_id: targetEmploymentId,
                enc_questions: encryptData(JSON.stringify(questionIds)),
                enc_custom_message: customMessage ? encryptData(customMessage) : null,
                status: 'pending'
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating reference request:', insertError);
            return NextResponse.json({ error: 'Failed to create reference request' }, { status: 500 });
        }

        // Build selected questions list for email
        const selectedQuestions = REFERENCE_QUESTIONS
            .filter(q => questionIds.includes(q.id))
            .map(q => q.label);

        // Send email to previous employer
        try {
            await resend.emails.send({
                from: 'Profcaria <noreply@profcaria.com>',
                to: targetCompanyEmail,
                subject: `Reference Request for ${professionalName}`,
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 16px; padding: 32px; margin-bottom: 24px;">
                            <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 8px 0;">Reference Request</h1>
                            <p style="color: #a0a0a0; font-size: 14px; margin: 0;">via Profcaria Employment Network</p>
                        </div>
                        
                        <div style="background: #f8f8f8; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                                <strong>${requestingCompanyName}</strong> is requesting a reference for <strong>${professionalName}</strong>, 
                                who previously worked at your organization.
                            </p>
                            
                            ${customMessage ? `
                                <div style="background: #fff; border-left: 4px solid #3b82f6; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
                                    <p style="color: #666; font-size: 14px; margin: 0; font-style: italic;">"${customMessage}"</p>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div style="background: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                            <h2 style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                                Questions They'd Like Answered
                            </h2>
                            <ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                ${selectedQuestions.map(q => `<li>${q}</li>`).join('')}
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin-bottom: 24px;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/employer/references/${refRequest.id}" 
                               style="display: inline-block; background: #000; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                                Respond to Request
                            </a>
                        </div>
                        
                        <div style="border-top: 1px solid #e5e5e5; padding-top: 24px;">
                            <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
                                This reference request was sent through Profcaria. 
                                If you have questions, contact ${requestingCompanyEmail}.
                            </p>
                        </div>
                    </div>
                `
            });

            // Update status to 'sent'
            await supabaseAdmin
                .schema('employer')
                .from('reference_requests')
                .update({ status: 'sent' })
                .eq('id', refRequest.id);

        } catch (emailError) {
            console.error('Error sending reference request email:', emailError);
            // Don't fail the request if email fails, but log it
        }

        // Send confirmation email to requesting company
        if (requestingCompanyEmail) {
            try {
                await resend.emails.send({
                    from: 'Profcaria <noreply@profcaria.com>',
                    to: requestingCompanyEmail,
                    subject: `Reference Request Sent for ${professionalName}`,
                    html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: 16px; padding: 32px; margin-bottom: 24px;">
                            <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 8px 0;">Reference Request Sent ✓</h1>
                            <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0;">Your request has been delivered</p>
                        </div>
                        
                        <div style="background: #f8f8f8; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0;">
                                Your reference request for <strong>${professionalName}</strong> has been sent to 
                                <strong>${targetCompanyName}</strong> at ${targetCompanyEmail}.
                            </p>
                        </div>
                        
                        <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                            <p style="color: #92400e; font-size: 14px; margin: 0;">
                                <strong>Note:</strong> You'll receive a notification when they respond. Most references are completed within 3-5 business days.
                            </p>
                        </div>
                        
                        <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
                            Sent via Profcaria Employment Network
                        </p>
                    </div>
                `
                });
            } catch (confirmEmailError) {
                console.error('Error sending confirmation email:', confirmEmailError);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Reference request sent successfully',
            requestId: refRequest.id
        });

    } catch (error: any) {
        console.error('Reference Request API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * GET /api/employer/references/request
 * 
 * Get all reference requests for the current company (sent or received)
 */
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.schema !== 'employer') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'sent'; // 'sent' or 'received'

        const query = supabaseAdmin
            .schema('employer')
            .from('reference_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (type === 'sent') {
            query.eq('requesting_company_id', user.id);
        } else {
            query.eq('target_company_id', user.id);
        }

        const { data: requests, error } = await query;

        if (error) throw error;

        // Decrypt and enrich the requests
        const enrichedRequests = await Promise.all((requests || []).map(async (req: any) => {
            // Get professional name
            const { data: prof } = await supabaseAdmin
                .schema('professional')
                .from('users')
                .select('enc_first_name, enc_last_name')
                .eq('id', req.professional_id)
                .single();

            // Get company names
            const { data: requestingComp } = await supabaseAdmin
                .schema('employer')
                .from('companies')
                .select('enc_company_name')
                .eq('id', req.requesting_company_id)
                .single();

            const { data: targetComp } = await supabaseAdmin
                .schema('employer')
                .from('companies')
                .select('enc_company_name')
                .eq('id', req.target_company_id)
                .single();

            return {
                id: req.id,
                professionalName: prof ? `${decryptData(prof.enc_first_name)} ${decryptData(prof.enc_last_name)}` : 'Unknown',
                requestingCompany: requestingComp ? decryptData(requestingComp.enc_company_name) : 'Unknown',
                targetCompany: targetComp ? decryptData(targetComp.enc_company_name) : 'Unknown',
                targetEmail: req.target_company_email,
                questions: req.enc_questions ? JSON.parse(decryptData(req.enc_questions) || '[]') : [],
                customMessage: req.enc_custom_message ? decryptData(req.enc_custom_message) : null,
                status: req.status,
                response: req.enc_response ? decryptData(req.enc_response) : null,
                respondedAt: req.responded_at,
                createdAt: req.created_at
            };
        }));

        return NextResponse.json({ requests: enrichedRequests });

    } catch (error: any) {
        console.error('Reference Requests GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
