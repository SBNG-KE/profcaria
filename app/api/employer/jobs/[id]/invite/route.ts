
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { createShortLink } from '@/lib/shortener';
import { sendJobInvite } from '@/lib/email';
import { getJobShareLink } from '@/lib/sharing';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) { // id is jobId
    try {
        const { id: jobId } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const companyId = payload.uid as string;

        const { professionalId } = await req.json();
        console.log(`[INVITE] Request for Job ${jobId} to Professional ${professionalId}`);

        // 1. Get Job Details & Verify Ownership
        const { data: job, error: jobError } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select('title')
            .eq('id', jobId)
            .eq('company_id', companyId)
            .single();

        if (jobError || !job) {
            console.error('Job Fetch Error:', jobError);
            return NextResponse.json({
                error: `Job not found. JobID: ${jobId}, MyCompanyID: ${companyId}, DBError: ${jobError?.message || 'None'}`
            }, { status: 404 });
        }

        // 2. Get Professional Details (Email)
        const { data: professional } = await supabaseAdmin
            .from('users') // Assuming users table holds auth info
            .select('email')
            .eq('id', professionalId)
            .single();

        // Also fetch company name for the email
        const { data: company } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('company_name')
            .eq('id', companyId)
            .single();

        if (professional?.email) {
            // 3. Generate Smart Link
            const origin = new URL(req.url).origin;
            const longLink = getJobShareLink(jobId, origin);

            // Generate Short Link
            const link = await createShortLink(longLink);

            console.log(`[INVITE] Sending email to ${professional.email} for job ${job.title}`);

            // 4. Send Email
            await sendJobInvite(
                professional.email,
                job.title,
                company?.company_name || 'Profcaria Employer',
                link
            );
        } else {
            console.warn(`[INVITE] Professional ${professionalId} has no email or not found. Data:`, professional);
        }

        // 5. Create Notification record (Existing logic)
        await supabaseAdmin
            .schema('employer')
            .from('job_invites') // Or whatever table stores this
            .insert({
                job_id: jobId,
                professional_id: professionalId,
                company_id: companyId
            });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Invite Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
