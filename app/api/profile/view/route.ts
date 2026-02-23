import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { targetId, targetType } = body;

        if (!targetId || !targetType || !['professional', 'company'].includes(targetType)) {
            return NextResponse.json({ error: 'Missing or invalid target parameters' }, { status: 400 });
        }

        const cookieStore = await cookies();
        const session = cookieStore.get('profcaria_session')?.value;

        let viewerId = null;
        let sessionUid = null;

        if (session) {
            try {
                // Safe base64url decode
                const base64Url = session.split('.')[1];
                if (base64Url) {
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));

                    const payload = JSON.parse(jsonPayload);
                    sessionUid = payload.uid;
                    // viewer_id references professional.users so only professionals count as viewers in that column.
                    if (payload.schema === 'professional') {
                        viewerId = payload.uid;
                    }
                }
            } catch (e) {
                console.error("Failed to parse session JWT:", e);
            }
        }

        // Prevent self-views
        if (sessionUid === targetId) {
            return NextResponse.json({ success: true, message: 'Self view ignored' });
        }

        // Construct the insert payload
        const insertData: any = {
            viewer_id: viewerId
        };

        if (targetType === 'professional') {
            insertData.viewed_professional_id = targetId;
        } else if (targetType === 'company') {
            insertData.viewed_company_id = targetId;
        }

        const { error } = await supabaseAdmin
            .schema('professional')
            .from('profile_views')
            .insert(insertData);

        if (error) {
            console.error('Error inserting profile view:', error);
            // It's just analytics, so don't fail the request completely but return 500
            return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('Exception in profile view tracking:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
