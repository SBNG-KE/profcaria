
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData } from '@/lib/security';

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

        const { uid, schema, name } = payload; // Assuming 'name' is in payload, if not we fetch it

        if (schema !== 'professional') {
            return NextResponse.json({ error: 'Only professionals can update permissions' }, { status: 403 });
        }

        const { permissions } = await req.json();

        if (!Array.isArray(permissions)) {
            return NextResponse.json({ error: 'Invalid permissions format' }, { status: 400 });
        }

        // 1. Update Global Access Control Document
        const encryptedContent = encryptData(JSON.stringify(permissions));

        const { error: docError } = await supabaseAdmin
            .schema('professional')
            .from('documents')
            .upsert({
                user_id: uid,
                doc_type: 'access_control',
                enc_content: encryptedContent,
                last_updated: new Date().toISOString()
            }, { onConflict: 'user_id, doc_type' });

        if (docError) {
            console.error('Error updating access control doc:', docError);
            return NextResponse.json({ error: 'Failed to save permissions' }, { status: 500 });
        }

        // 2. Fetch ALL Applications for this user
        const { data: applications, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('id, jobs(company_id), status')
            .eq('user_id', uid);

        if (appError) {
            console.error('Error fetching applications:', appError);
        }

        if (applications && applications.length > 0) {
            const encAccessList = encryptData(JSON.stringify(permissions));
            const distinctCompanyIds = new Set<string>();

            // 3. Update Applications & Notify
            for (const app of applications) {
                // Update application in EMPLOYER schema
                await supabaseAdmin
                    .schema('employer')
                    .from('applications')
                    .update({ enc_access_list: encAccessList })
                    .eq('id', app.id);

                // Get Company ID safely from joined data
                const jobData = app.jobs as any;
                const companyId = jobData?.company_id;

                // Check for existing conversation
                const { count, error: msgError } = await supabaseAdmin
                    .schema('employer')
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('application_id', app.id);

                if (count && count > 0) {
                    // Conversation exists: Send a chat message instead of a generic notification
                    const msgContent = "I have updated my profile permissions. You can now view additional documents.";
                    await supabaseAdmin
                        .schema('employer')
                        .from('messages')
                        .insert([{
                            application_id: app.id,
                            sender_id: uid,
                            sender_type: 'professional',
                            enc_content: encryptData(msgContent),
                            is_read: false
                        }]);

                    if (companyId) {
                        await supabaseAdmin
                            .schema('employer')
                            .from('notifications')
                            .insert([{
                                company_id: companyId,
                                enc_message: encryptData(`New message from ${name || 'Applicant'} regarding updated permissions`),
                                type: 'message',
                                application_id: app.id,
                                is_read: false
                            }]);
                    }

                } else {
                    // No conversation: Send system notification 
                    if (companyId) distinctCompanyIds.add(companyId);
                }
            }

            // 4. Send System Notifications (for non-chatting employers)
            const notificationMessage = `${name || 'A candidate'} has updated their profile permissions. New data may be available.`;
            const encMessage = encryptData(notificationMessage);

            for (const companyId of distinctCompanyIds) {
                await supabaseAdmin
                    .schema('employer')
                    .from('notifications')
                    .insert({
                        company_id: companyId,
                        enc_message: encMessage,
                        is_read: false,
                        type: 'system',
                        created_at: new Date().toISOString()
                    });
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Permission Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
