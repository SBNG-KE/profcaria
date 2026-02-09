import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { encryptData, decryptData } from '@/lib/security';
import { Resend } from 'resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

// Predefined reference questions (must match request API)
const REFERENCE_QUESTIONS = [
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

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/employer/references/[id]
 * 
 * Get a specific reference request (for responding or viewing)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Get the reference request
        const { data: refRequest, error } = await supabaseAdmin
            .schema('employer')
            .from('reference_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !refRequest) {
            return NextResponse.json({ error: 'Reference request not found' }, { status: 404 });
        }

        // Get professional's name
        const { data: professional } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('enc_first_name, enc_last_name')
            .eq('id', refRequest.professional_id)
            .single();

        const professionalName = professional
            ? `${decryptData(professional.enc_first_name)} ${decryptData(professional.enc_last_name)}`
            : 'Unknown';

        // Get requesting company name
        const { data: requestingCompany } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('enc_company_name')
            .eq('id', refRequest.requesting_company_id)
            .single();

        const requestingCompanyName = requestingCompany
            ? decryptData(requestingCompany.enc_company_name)
            : 'Unknown Company';

        // Get target company name (the one responding)
        const { data: targetCompany } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('enc_company_name')
            .eq('id', refRequest.target_company_id)
            .single();

        const targetCompanyName = targetCompany
            ? decryptData(targetCompany.enc_company_name)
            : 'Unknown Company';

        // Get the questions that were asked
        const questionIds = refRequest.enc_questions
            ? JSON.parse(decryptData(refRequest.enc_questions) || '[]')
            : [];

        const questions = REFERENCE_QUESTIONS.filter(q => questionIds.includes(q.id));

        // Get custom message if any
        const customMessage = refRequest.enc_custom_message
            ? decryptData(refRequest.enc_custom_message)
            : null;

        // Get response if already submitted
        const response = refRequest.enc_response
            ? JSON.parse(decryptData(refRequest.enc_response) || '{}')
            : null;

        // Mark as viewed if first time accessing (for target company)
        if (refRequest.status === 'sent') {
            await supabaseAdmin
                .schema('employer')
                .from('reference_requests')
                .update({ status: 'viewed' })
                .eq('id', id);
        }

        return NextResponse.json({
            id: refRequest.id,
            professionalName,
            requestingCompanyName,
            targetCompanyName,
            questions,
            customMessage,
            status: refRequest.status,
            response,
            respondedAt: refRequest.responded_at,
            createdAt: refRequest.created_at
        });

    } catch (error: any) {
        console.error('Reference GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * POST /api/employer/references/[id]
 * 
 * Submit a response to a reference request
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.schema !== 'employer') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { responses } = body; // Object with questionId: answer pairs

        if (!responses || Object.keys(responses).length === 0) {
            return NextResponse.json({ error: 'Please answer at least one question' }, { status: 400 });
        }

        // Get the reference request
        const { data: refRequest, error: fetchError } = await supabaseAdmin
            .schema('employer')
            .from('reference_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !refRequest) {
            return NextResponse.json({ error: 'Reference request not found' }, { status: 404 });
        }

        // Verify the responder is the target company
        if (refRequest.target_company_id !== user.id) {
            return NextResponse.json({ error: 'You are not authorized to respond to this request' }, { status: 403 });
        }

        // Check if already responded
        if (refRequest.status === 'responded') {
            return NextResponse.json({ error: 'This request has already been responded to' }, { status: 400 });
        }

        // Encrypt and save the response
        const encryptedResponse = encryptData(JSON.stringify(responses));

        const { error: updateError } = await supabaseAdmin
            .schema('employer')
            .from('reference_requests')
            .update({
                enc_response: encryptedResponse,
                status: 'responded',
                responded_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) {
            console.error('Error saving response:', updateError);
            return NextResponse.json({ error: 'Failed to save response' }, { status: 500 });
        }

        // Get professional's name for email
        const { data: professional } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('enc_first_name, enc_last_name')
            .eq('id', refRequest.professional_id)
            .single();

        const professionalName = professional
            ? `${decryptData(professional.enc_first_name)} ${decryptData(professional.enc_last_name)}`
            : 'the candidate';

        // Get target company name (responder)
        const { data: targetCompany } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('enc_company_name')
            .eq('id', user.id)
            .single();

        const targetCompanyName = targetCompany
            ? decryptData(targetCompany.enc_company_name)
            : 'A previous employer';

        // Get requesting company email to send notification
        const { data: requestingCompany } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('enc_company_name, enc_work_email')
            .eq('id', refRequest.requesting_company_id)
            .single();

        const requestingCompanyEmail = requestingCompany?.enc_work_email
            ? decryptData(requestingCompany.enc_work_email)
            : null;

        const requestingCompanyName = requestingCompany
            ? decryptData(requestingCompany.enc_company_name)
            : 'Requesting Company';

        // Send notification email to requesting company
        if (requestingCompanyEmail) {
            try {
                await resend.emails.send({
                    from: 'Profcaria <noreply@profcaria.com>',
                    to: requestingCompanyEmail,
                    subject: `Reference Received for ${professionalName}`,
                    html: `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: 16px; padding: 32px; margin-bottom: 24px;">
                                <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 8px 0;">Reference Received ✓</h1>
                                <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0;">A reference has been submitted</p>
                            </div>
                            
                            <div style="background: #f8f8f8; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                                <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0;">
                                    <strong>${targetCompanyName}</strong> has submitted a reference for 
                                    <strong>${professionalName}</strong>.
                                </p>
                            </div>
                            
                            <div style="text-align: center; margin-bottom: 24px;">
                                <a href="${process.env.NEXT_PUBLIC_APP_URL}/employer/applications" 
                                   style="display: inline-block; background: #000; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                                    View Reference
                                </a>
                            </div>
                            
                            <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
                                Sent via Profcaria Employment Network
                            </p>
                        </div>
                    `
                });
            } catch (emailError) {
                console.error('Error sending notification email:', emailError);
            }
        }

        // Send in-app notification to requesting company
        try {
            await supabaseAdmin
                .schema('employer')
                .from('notifications')
                .insert({
                    user_id: refRequest.requesting_company_id,
                    enc_message: encryptData(`${targetCompanyName} has submitted a reference for ${professionalName}. View their response in the applicant's profile.`),
                    type: 'reference'
                });
        } catch (notifError) {
            console.error('Error creating notification:', notifError);
        }

        return NextResponse.json({
            success: true,
            message: 'Reference submitted successfully'
        });

    } catch (error: any) {
        console.error('Reference POST Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * DELETE /api/employer/references/[id]
 * 
 * Decline a reference request
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.schema !== 'employer') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;

        // Get the reference request
        const { data: refRequest, error: fetchError } = await supabaseAdmin
            .schema('employer')
            .from('reference_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !refRequest) {
            return NextResponse.json({ error: 'Reference request not found' }, { status: 404 });
        }

        // Verify the responder is the target company
        if (refRequest.target_company_id !== user.id) {
            return NextResponse.json({ error: 'You are not authorized to decline this request' }, { status: 403 });
        }

        // Check if already responded or declined
        if (refRequest.status === 'responded' || refRequest.status === 'declined') {
            return NextResponse.json({ error: 'This request has already been processed' }, { status: 400 });
        }

        // Update status to declined
        const { error: updateError } = await supabaseAdmin
            .schema('employer')
            .from('reference_requests')
            .update({
                status: 'declined',
                responded_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) {
            console.error('Error declining request:', updateError);
            return NextResponse.json({ error: 'Failed to decline request' }, { status: 500 });
        }

        // Get names for notification
        const { data: professional } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('enc_first_name, enc_last_name')
            .eq('id', refRequest.professional_id)
            .single();

        const professionalName = professional
            ? `${decryptData(professional.enc_first_name)} ${decryptData(professional.enc_last_name)}`
            : 'the candidate';

        const { data: targetCompany } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('enc_company_name')
            .eq('id', user.id)
            .single();

        const targetCompanyName = targetCompany
            ? decryptData(targetCompany.enc_company_name)
            : 'A previous employer';

        // Send in-app notification to requesting company
        try {
            await supabaseAdmin
                .schema('employer')
                .from('notifications')
                .insert({
                    user_id: refRequest.requesting_company_id,
                    enc_message: encryptData(`${targetCompanyName} has declined to provide a reference for ${professionalName}.`),
                    type: 'reference'
                });
        } catch (notifError) {
            console.error('Error creating decline notification:', notifError);
        }

        return NextResponse.json({
            success: true,
            message: 'Reference request declined'
        });

    } catch (error: any) {
        console.error('Reference DELETE Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
