import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData, encryptData } from '@/lib/security';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

// GET: Fetch all connections (accepted applications) for this professional
export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);
        const { uid, schema } = payload;

        if (schema !== 'professional') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get all accepted applications for this user
        const { data: applications, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('*, jobs(id, enc_title, company_id, location_type)')
            .eq('user_id', uid)
            .in('status', ['accepted', 'hired', 'employed', 'offered', 'pending_termination', 'terminated', 'resigned', 'rejected', 'declined'])
            .order('created_at', { ascending: false });

        if (appError) throw appError;
        if (!applications || applications.length === 0) return NextResponse.json({ connections: [] });

        // Get company details
        const companyIds = [...new Set(applications.map((app: any) => app.jobs?.company_id).filter(Boolean))];

        const { data: companies, error: compError } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('id, enc_company_name, enc_logo_url')
            .in('id', companyIds);

        if (compError) {
            console.error('Fetch Companies Error:', compError);
        }

        const connections = applications.map((app: any) => {
            const job = app.jobs;
            const company = companies?.find((c: { id: any; }) => c.id === job?.company_id);

            return {
                id: app.id,
                applicationId: app.id,
                status: app.status,
                terminationType: app.termination_type,
                terminationReason: app.enc_termination_reason ? decryptData(app.enc_termination_reason) : null,
                created_at: app.created_at,
                terminated_at: app.terminated_at,
                connectionFileUrl: app.connection_file_url, // New Field
                job: {
                    id: job?.id,
                    title: decryptData(job?.enc_title) || 'Unknown Job',
                    location_type: job?.location_type // Ensure this is selected in the query too if needed, but it wasn't in the original select *, keys might be different
                },
                company: {
                    id: company?.id,
                    name: company ? decryptData(company.enc_company_name) : 'Unknown Company',
                    logoUrl: company ? decryptData(company.enc_logo_url) : null
                }
            };
        });

        return NextResponse.json({ connections });

    } catch (error: any) {
        console.error('Fetch Professional Connections Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

// PATCH: Request termination of a connection
export async function PATCH(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);
        const { uid, schema } = payload;

        if (schema !== 'professional') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { applicationId, action, reason, fileUrl } = await req.json();

        // Fetch application to verify ownership and get current status
        const { data: app, error: fetchError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('*, jobs(company_id)')
            .eq('id', applicationId)
            .eq('user_id', uid)
            .single();

        if (fetchError || !app) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        if (action === 'update_file') {
            // Ensure connection is active to allow edits? User said active only. But logic handled in frontend?
            // Backend should verify status is not terminated?
            // "whenever resigned or mutual or involuntary termination that file becomes an open only"
            // So if status is terminated/resigned, disallow update.

            if (app.status === 'terminated' || app.status === 'resigned' || app.status === 'rejected' || app.status === 'declined') {
                return NextResponse.json({ error: 'Cannot edit file for terminated connection' }, { status: 403 });
            }

            const { error: updateError } = await supabaseAdmin
                .schema('employer')
                .from('applications')
                .update({ connection_file_url: fileUrl })
                .eq('id', applicationId);

            if (updateError) throw updateError;
            return NextResponse.json({ success: true });
        }

        if (action === 'remove_file') {
            if (app.status === 'terminated' || app.status === 'resigned') {
                return NextResponse.json({ error: 'Cannot remove file for terminated connection' }, { status: 403 });
            }
            const { error: updateError } = await supabaseAdmin
                .schema('employer')
                .from('applications')
                .update({ connection_file_url: null })
                .eq('id', applicationId);

            if (updateError) throw updateError;
            return NextResponse.json({ success: true });
        }

        if (!['request_termination', 'request_resignation', 'request_mutual_termination'].includes(action)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const enc_reason = reason ? encryptData(reason) : null;
        let updateData: any = {
            termination_initiated_by: 'professional',
            enc_termination_reason: enc_reason
        };
        let notifMessage = '';
        let generatedFileUrl = null;

        // Generate PDF if reason is provided
        if (reason) {
            try {
                const pdfDoc = await PDFDocument.create();
                const page = pdfDoc.addPage();
                const { width, height } = page.getSize();
                const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
                const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

                const title = action === 'request_resignation' ? 'RESIGNATION LETTER' : 'MUTUAL TERMINATION REQUEST';
                const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

                page.drawText(title, {
                    x: 50,
                    y: height - 50,
                    size: 20,
                    font: titleFont,
                    color: rgb(0, 0, 0),
                });

                page.drawText(`Date: ${dateStr}`, {
                    x: 50,
                    y: height - 80,
                    size: 12,
                    font: font,
                    color: rgb(0, 0, 0),
                });

                page.drawText(`Application ID: ${applicationId}`, {
                    x: 50,
                    y: height - 100,
                    size: 10,
                    font: font,
                    color: rgb(0.5, 0.5, 0.5),
                });

                page.drawText('Reason / Statement:', {
                    x: 50,
                    y: height - 140,
                    size: 14,
                    font: titleFont,
                    color: rgb(0, 0, 0),
                });

                // Simple text wrapping - VERY basic implementation
                const fontSize = 12;
                const maxWidth = width - 100;
                const words = reason.split(' ');
                let line = '';
                let y = height - 160;

                for (const word of words) {
                    const testLine = line + word + ' ';
                    const textWidth = font.widthOfTextAtSize(testLine, fontSize);
                    if (textWidth > maxWidth && y > 50) {
                        page.drawText(line, { x: 50, y, size: fontSize, font, color: rgb(0, 0, 0) });
                        line = word + ' ';
                        y -= 20;
                    } else {
                        line = testLine;
                    }
                }
                page.drawText(line, { x: 50, y, size: fontSize, font, color: rgb(0, 0, 0) });

                const pdfBytes = await pdfDoc.save();
                const filename = `${action}_${applicationId}_${Date.now()}.pdf`;

                const blob = await put(filename, Buffer.from(pdfBytes), {
                    access: 'public',
                    contentType: 'application/pdf',
                });

                generatedFileUrl = blob.url;
                updateData.connection_file_url = generatedFileUrl;

            } catch (pdfError) {
                console.error("Failed to generate PDF:", pdfError);
                // Continue without PDF if fails? Or fail request?
                // Let's log but continue, keeping only text reason.
            }
        }

        if (action === 'request_resignation') {
            updateData.status = 'pending_resignation';
            notifMessage = 'An employee has submitted a formal resignation.';
        } else if (action === 'request_mutual_termination') {
            updateData.status = 'pending_termination';
            updateData.termination_type = 'mutual';
            notifMessage = 'An employee has requested a mutual termination of their contract.';
        } else {
            // Fallback for legacy
            updateData.status = 'pending_termination';
            updateData.termination_type = 'mutual';
            notifMessage = 'An employee has requested to terminate their employment connection.';
        }

        // Update status
        const { error: updateError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .update(updateData)
            .eq('id', applicationId);

        if (updateError) throw updateError;

        // Notify the employer
        const jobData = app.jobs as any;
        if (jobData?.company_id) {
            await supabaseAdmin
                .schema('employer')
                .from('notifications')
                .insert([{
                    company_id: jobData.company_id,
                    enc_message: encryptData(notifMessage),
                    type: 'connection'
                }]);
        }

        return NextResponse.json({ success: true, message: 'Request sent to employer.', fileUrl: generatedFileUrl });

    } catch (error: any) {
        console.error('Request Termination Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
