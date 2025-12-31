import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/security';

export const runtime = 'nodejs';

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
        if (!applicationId) return NextResponse.json({ error: 'Missing applicationId' }, { status: 400 });

        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Verify user is authorized for this application
        const { data: application, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('user_id, jobs(company_id)')
            .eq('id', applicationId)
            .single();

        if (appError || !application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

        const isAuthorized = (session.schema === 'professional' && session.uid === application.user_id) ||
            (session.schema === 'employer' && session.uid === (application.jobs as any).company_id);

        if (!isAuthorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { data: messages, error } = await supabaseAdmin
            .schema('employer')
            .from('messages')
            .select('*, is_read')
            .eq('application_id', applicationId)
            .order('created_at', { ascending: true });

        if (error) return NextResponse.json({ error: 'Fetch Error' }, { status: 500 });

        const decryptedMessages = (messages || []).map(m => ({
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

        const { applicationId } = await req.json();
        if (!applicationId) return NextResponse.json({ error: 'Missing applicationId' }, { status: 400 });

        // Mark all messages as read WHERE recipient is current user
        // Note: sender_type !== session.schema means the other party sent it
        const { error } = await supabaseAdmin
            .schema('employer')
            .from('messages')
            .update({ is_read: true })
            .eq('application_id', applicationId)
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

        if (error) return NextResponse.json({ error: 'Save Error' }, { status: 500 });

        // Notification for the other party
        const recipientId = session.schema === 'professional' ? (application.jobs as any).company_id : application.user_id;
        const recipientSchema = session.schema === 'professional' ? 'employer' : 'professional';
        const recipientField = recipientSchema === 'professional' ? 'user_id' : 'company_id';

        const jobTitle = decryptData((application.jobs as any).enc_title) || 'Job';
        const senderLabel = session.schema === 'professional' ? 'Applicant' : 'Employer';

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

        return NextResponse.json({
            success: true,
            message: { ...data, content }
        });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
