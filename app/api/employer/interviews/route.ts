import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData } from '@/lib/security';

export const runtime = 'nodejs';

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
