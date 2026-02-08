import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';

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
        const schemaName = schema === 'professional' ? 'professional' : 'employer';
        const userField = schema === 'professional' ? 'user_id' : 'company_id';

        // Auto-cleanup: Delete read notifications older than 7 days
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            await supabaseAdmin
                .schema(schemaName)
                .from('notifications')
                .delete()
                .eq(userField, uid)
                .eq('is_read', true)
                .lt('created_at', sevenDaysAgo.toISOString());
        } catch (cleanupError) {
            console.error('Cleanup Error (Non-fatal):', cleanupError);
        }

        const { data: notifications, error } = await supabaseAdmin
            .schema(schemaName)
            .from('notifications')
            .select('*, is_read')
            .eq(userField, uid)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Fetch Notifications Error:', error);
            return NextResponse.json({ error: 'Failed' }, { status: 500 });
        }


        const decryptedNotifications = await Promise.all((notifications || []).map(async (notif: { enc_message: string; sender_id?: string; sender_type?: string; }) => {
            const base = {
                ...notif,
                message: decryptData(notif.enc_message)
            };

            // Enrich with sender details
            if (notif.sender_id) {
                try {
                    let senderName = '';
                    let senderImage = null;
                    let senderRole = '';

                    if (notif.sender_type === 'employer' || notif.sender_type === 'company') {
                        const { data: comp } = await supabaseAdmin
                            .schema('employer')
                            .from('companies')
                            .select('enc_company_name, enc_logo_url')
                            .eq('id', notif.sender_id)
                            .single();
                        if (comp) {
                            senderName = decryptData(comp.enc_company_name) || 'Company';
                            senderImage = comp.enc_logo_url ? decryptData(comp.enc_logo_url) : null;
                            senderRole = 'Company';
                        }
                    } else {
                        // Professional - use users table with encrypted fields
                        const { data: prof } = await supabaseAdmin
                            .schema('professional')
                            .from('users')
                            .select('enc_first_name, enc_last_name, enc_profile_image_url, enc_current_role')
                            .eq('id', notif.sender_id)
                            .single();
                        if (prof) {
                            const firstName = decryptData(prof.enc_first_name) || '';
                            const lastName = decryptData(prof.enc_last_name) || '';
                            senderName = `${firstName} ${lastName}`.trim() || 'User';
                            senderImage = prof.enc_profile_image_url ? decryptData(prof.enc_profile_image_url) : null;
                            senderRole = decryptData(prof.enc_current_role) || 'Professional';
                        }
                    }

                    // Only return enriched data if we found a name
                    if (senderName) {
                        return { ...base, senderName, senderImage, senderRole };
                    }
                    return base;
                } catch (e) {
                    console.error('Error fetching sender details:', e);
                    return base;
                }
            }
            return base;
        }));

        return NextResponse.json({ notifications: decryptedNotifications });

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
        const { payload } = await jwtVerify(token, secretKey);
        const { uid, schema } = payload;

        const { notificationId, markAll } = await req.json();

        const schemaName = schema === 'professional' ? 'professional' : 'employer';
        const userField = schema === 'professional' ? 'user_id' : 'company_id';

        let query = supabaseAdmin
            .schema(schemaName)
            .from('notifications')
            .update({ is_read: true })
            .eq(userField, uid);

        if (!markAll && notificationId) {
            query = query.eq('id', notificationId);
        }

        const { error } = await query;
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Mark Read Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
