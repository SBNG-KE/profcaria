import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/security';
import { sendUnreadMessageNotification } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('profcaria_session')?.value;
    if (!token) return null;

    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    try {
        const { payload } = await jwtVerify(token, secretKey);
        return payload;
    } catch (e) {
        return null;
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const applicationId = searchParams.get('applicationId');
        const applicationIdsParam = searchParams.get('applicationIds');

        if (!applicationId && !applicationIdsParam) return NextResponse.json({ error: 'Missing applicationId(s)' }, { status: 400 });

        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Parse IDs (prioritize multiple IDs if present)
        const targetAppIds = applicationIdsParam
            ? applicationIdsParam.split(',').filter(Boolean)
            : [applicationId!];

        // Verify authorization for ALL requested applications
        const { data: applications, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('id, user_id, jobs(company_id)')
            .in('id', targetAppIds);

        if (appError || !applications || applications.length === 0) {
            return NextResponse.json({ error: 'Applications not found' }, { status: 404 });
        }

        // Check ownership for each application found
        const isAuthorized = applications.every((app: any) => {
            return (session.schema === 'professional' && session.uid === app.user_id) ||
                (session.schema === 'employer' && session.uid === (app.jobs as any).company_id);
        });

        if (!isAuthorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { data: messages, error } = await supabaseAdmin
            .schema('employer')
            .from('messages')
            .select('*, is_read')
            .in('application_id', targetAppIds)
            .order('created_at', { ascending: true });

        if (error) return NextResponse.json({ error: 'Fetch Error' }, { status: 500 });

        const decryptedMessages = (messages || []).map((m: { enc_content: string; }) => ({
            ...m,
            content: decryptData(m.enc_content)
        }));

        return NextResponse.json({ messages: decryptedMessages });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { applicationId, applicationIds } = await req.json();

        // Determine target IDs
        const targetIds = applicationIds || (applicationId ? [applicationId] : []);

        if (targetIds.length === 0) return NextResponse.json({ error: 'Missing applicationId(s)' }, { status: 400 });

        // Mark all messages as read WHERE recipient is current user for ALL target applications
        const { error } = await supabaseAdmin
            .schema('employer')
            .from('messages')
            .update({ is_read: true })
            .in('application_id', targetIds)
            .neq('sender_type', session.schema);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { applicationId, content } = await req.json();
        if (!applicationId || !content) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

        // Verify authorization
        const { data: application, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('status, user_id, jobs(company_id, enc_title)')
            .eq('id', applicationId)
            .single();

        if (appError || !application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

        // Block if terminated
        if (application.status === 'terminated') {
            return NextResponse.json({ error: 'Connection terminated. Cannot send messages.' }, { status: 403 });
        }

        const isAuthorized = (session.schema === 'professional' && session.uid === application.user_id) ||
            (session.schema === 'employer' && session.uid === (application.jobs as any).company_id);

        if (!isAuthorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // Encrypt and Insert
        const encContent = encryptData(content);
        const { data, error } = await supabaseAdmin
            .schema('employer')
            .from('messages')
            .insert([{
                application_id: applicationId,
                sender_id: session.uid,
                sender_type: session.schema,
                enc_content: encContent,
                is_read: false
            }])
            .select()
            .single();


        // ... existing code ...

        // ... (inside POST, after supabase insert and before return) ...

        // Notification for the other party
        const recipientId = session.schema === 'professional' ? (application.jobs as any).company_id : application.user_id;
        const recipientSchema = session.schema === 'professional' ? 'employer' : 'professional';
        const recipientField = recipientSchema === 'professional' ? 'user_id' : 'company_id';

        const jobTitle = decryptData((application.jobs as any).enc_title) || 'Job';
        const senderLabel = session.schema === 'professional' ? 'Applicant' : 'Employer';

        // 1. Create In-App Notification
        await supabaseAdmin
            .schema(recipientSchema)
            .from('notifications')
            .insert([{
                [recipientField]: recipientId,
                enc_message: encryptData(`New message from ${senderLabel} regarding ${jobTitle}`),
                type: 'message',
                application_id: applicationId,
                is_read: false
            }]);

        // 2. CHECK "OFFLINE" STATUS & SEND EMAIL
        // Fetch recipient to check last_active_at and get email
        const recipientTable = recipientSchema === 'professional' ? 'users' : 'companies';
        const emailField = recipientSchema === 'professional' ? 'email' : 'work_email'; // Assuming work_email for company

        const { data: recipientUser } = await supabaseAdmin
            .schema(recipientSchema)
            .from(recipientTable)
            .select(`last_active_at, ${emailField}`)
            .eq('id', recipientId)
            .single();

        if (recipientUser) {
            const lastActive = recipientUser.last_active_at ? new Date(recipientUser.last_active_at).getTime() : 0;
            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000;

            // If inactive for > 5 mins (or never active), send email
            if (now - lastActive > fiveMinutes) {
                const recipientEmail = recipientUser[emailField];
                // For professional, we need their name, but for now we just say "New Message"
                // Ideally we'd fetch their name too, but this fits the requirement.
                if (recipientEmail) {
                    // Fire and forget (don't await) to keep API fast
                    sendUnreadMessageNotification(recipientEmail, senderLabel, jobTitle).catch((e: any) => console.error("Email Fail:", e));
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: { ...data, content }
        });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
