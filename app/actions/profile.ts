'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function recordProfileView(targetId: string, targetType: 'professional' | 'company') {
    try {
        console.log(`[ProfileViewTracker] Attempting to record view. Target: ${targetId} (${targetType})`);

        if (!targetId || !targetType || !['professional', 'company'].includes(targetType)) {
            console.error('[ProfileViewTracker] Invalid parameters');
            return { error: 'Invalid parameters' };
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

                    if (payload.schema === 'professional') {
                        viewerId = payload.uid;
                    }
                }
            } catch (e) {
                console.error("[ProfileViewTracker] Failed to parse session JWT:", e);
            }
        }

        console.log(`[ProfileViewTracker] sessionUid: ${sessionUid}, viewerId: ${viewerId}`);

        // Prevent self-views
        if (sessionUid === targetId) {
            console.log('[ProfileViewTracker] Ignored: Self view');
            return { success: true, message: 'Self view ignored' };
        }

        // Construct the insert payload
        const insertData: any = {
            viewer_id: viewerId // can be null
        };

        if (targetType === 'professional') {
            insertData.viewed_professional_id = targetId;
        } else if (targetType === 'company') {
            insertData.viewed_company_id = targetId;
        }

        console.log('[ProfileViewTracker] Insert Payload:', insertData);

        const { data, error } = await supabaseAdmin
            .schema('professional')
            .from('profile_views')
            .insert(insertData)
            .select();

        if (error) {
            console.error('[ProfileViewTracker] Supabase Insert Error:', error);
            return { error: 'Failed to record view', details: error.message };
        }

        console.log('[ProfileViewTracker] Successfully recorded view!', data);
        return { success: true };

    } catch (err: any) {
        console.error('[ProfileViewTracker] Exception:', err);
        return { error: 'Internal server error', details: err.message };
    }
}
