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
        let payload;
        try {
            const { payload: verifiedPayload } = await jwtVerify(token, secretKey);
            payload = verifiedPayload;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const { uid, schema } = payload;
        if (schema !== 'employer') {
            return NextResponse.json({ error: 'Only employers can view interviews' }, { status: 403 });
        }

        // Get all jobs for this company
        const { data: jobs, error: jobsError } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select('id, enc_title')
            .eq('company_id', uid);

        if (jobsError) throw jobsError;
        if (!jobs || jobs.length === 0) return NextResponse.json({ interviews: [] });

        const jobIds = jobs.map((j: { id: any; }) => j.id);

        // Get all applications for these jobs
        const { data: applications, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('id, job_id, user_id')
            .in('job_id', jobIds);

        if (appError) throw appError;
        if (!applications || applications.length === 0) return NextResponse.json({ interviews: [] });

        const applicationIds = applications.map((a: { id: any; }) => a.id);

        // Get all interviews for these applications
        const { data: interviews, error: intError } = await supabaseAdmin
            .schema('employer')
            .from('interviews')
            .select('*')
            .in('application_id', applicationIds)
            .order('created_at', { ascending: false });

        if (intError) throw intError;

        // Get professional details
        const professionalIds = [...new Set(applications.map((app: { user_id: any; }) => app.user_id))];
        const { data: professionals } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('id, enc_first_name, enc_last_name')
            .in('id', professionalIds);

        const formattedInterviews = (interviews || []).map((interview: any) => {
            const application = applications.find((a: { id: any; }) => a.id === interview.application_id);
            const job = jobs.find((j: { id: any; }) => j.id === application?.job_id);
            const prof = professionals?.find((p: { id: any; }) => p.id === application?.user_id);

            return {
                id: interview.id,
                applicationId: interview.application_id,
                scheduledAt: decryptData(interview.enc_scheduled_at),
                meetingLink: interview.enc_meeting_link ? decryptData(interview.enc_meeting_link) : null,
                notes: interview.enc_notes ? decryptData(interview.enc_notes) : null,
                status: interview.status,
                candidateName: prof ? `${decryptData(prof.enc_first_name)} ${decryptData(prof.enc_last_name)}` : 'Candidate',
                jobTitle: job ? decryptData(job.enc_title) : 'Unknown Job'
            };
        });

        return NextResponse.json({ interviews: formattedInterviews });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
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
        if (schema !== 'employer') {
            return NextResponse.json({ error: 'Only employers can schedule interviews' }, { status: 403 });
        }

        const body = await req.json();
        const { applicationId, scheduledAt, meetingLink, notes } = body;

        if (!applicationId || !scheduledAt) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Encrypt interview details
        const encScheduledAt = encryptData(scheduledAt);
        const encMeetingLink = meetingLink ? encryptData(meetingLink) : null;
        const encNotes = notes ? encryptData(notes) : null;

        const { data, error } = await supabaseAdmin
            .schema('employer')
            .from('interviews')
            .insert([
                {
                    application_id: applicationId,
                    enc_scheduled_at: encScheduledAt,
                    enc_meeting_link: encMeetingLink,
                    enc_notes: encNotes,
                    status: 'scheduled'
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Interview Error:', error);
            return NextResponse.json({ error: 'Failed to schedule interview' }, { status: 500 });
        }

        // Update application status
        await supabaseAdmin
            .schema('employer')
            .from('applications')
            .update({ status: 'interview_scheduled' })
            .eq('id', applicationId);

        // Get applicant user_id to send notification
        const { data: app } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('user_id')
            .eq('id', applicationId)
            .single();

        if (app) {
            // Send standard notification
            await supabaseAdmin
                .schema('professional')
                .from('notifications')
                .insert([
                    {
                        user_id: app.user_id,
                        enc_message: encryptData('You have a new scheduled interview! Check your interview center.'),
                        type: 'interview'
                    }
                ]);

            // ALSO post a message in the thread
            const messageContent = `I have scheduled an interview for ${scheduledAt}. Meeting link: ${meetingLink || 'To be shared'}. Notes: ${notes || 'None'}`;
            await supabaseAdmin
                .schema('employer')
                .from('messages')
                .insert([{
                    application_id: applicationId,
                    sender_id: uid,
                    sender_type: 'employer',
                    enc_content: encryptData(messageContent)
                }]);
        }

        return NextResponse.json({ success: true, interviewId: data.id });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
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
        if (schema !== 'employer') {
            return NextResponse.json({ error: 'Only employers can edit interviews' }, { status: 403 });
        }

        const body = await req.json();
        const { interviewId, scheduledAt, meetingLink, notes } = body;

        if (!interviewId) {
            return NextResponse.json({ error: 'Missing interview ID' }, { status: 400 });
        }

        const updateData: any = {};
        if (scheduledAt) updateData.enc_scheduled_at = encryptData(scheduledAt);
        if (meetingLink !== undefined) updateData.enc_meeting_link = meetingLink ? encryptData(meetingLink) : null;
        if (notes !== undefined) updateData.enc_notes = notes ? encryptData(notes) : null;

        const { error } = await supabaseAdmin
            .schema('employer')
            .from('interviews')
            .update(updateData)
            .eq('id', interviewId);

        if (error) {
            console.error('Interview Update Error:', error);
            return NextResponse.json({ error: 'Failed to update interview' }, { status: 500 });
        }

        // Get interview and application to send notification
        const { data: interview } = await supabaseAdmin
            .schema('employer')
            .from('interviews')
            .select('application_id')
            .eq('id', interviewId)
            .single();

        if (interview) {
            const { data: app } = await supabaseAdmin
                .schema('employer')
                .from('applications')
                .select('user_id')
                .eq('id', interview.application_id)
                .single();

            if (app) {
                // Send notification about update
                await supabaseAdmin
                    .schema('professional')
                    .from('notifications')
                    .insert([
                        {
                            user_id: app.user_id,
                            enc_message: encryptData('Your interview details have been updated. Check your interview center for the latest information.'),
                            type: 'interview'
                        }
                    ]);

                // Post update message in thread
                const messageContent = `Interview updated. New time: ${scheduledAt}. Meeting link: ${meetingLink || 'To be shared'}. Notes: ${notes || 'None'}`;
                await supabaseAdmin
                    .schema('employer')
                    .from('messages')
                    .insert([{
                        application_id: interview.application_id,
                        sender_id: uid,
                        sender_type: 'employer',
                        enc_content: encryptData(messageContent)
                    }]);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
