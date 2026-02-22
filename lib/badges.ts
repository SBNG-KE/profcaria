import { supabaseAdmin } from '@/lib/supabase';
import { getBadgeForFollowerCount } from '@/lib/billing-config';
import { getFollowerCount } from '@/lib/followers';

/**
 * Recalculate and update the badge_type for a user or company based on their follower count.
 * Works for both professionals (professional.users) and employers (employer.companies).
 * 
 * Call this after every follow/unfollow action on the target entity.
 */
export async function recalculateBadge(entityId: string, schema: 'professional' | 'employer'): Promise<string> {
    try {
        const followerCount = await getFollowerCount(entityId, schema);
        const newBadge = getBadgeForFollowerCount(followerCount);

        if (schema === 'professional') {
            await supabaseAdmin
                .schema('professional')
                .from('users')
                .update({ badge_type: newBadge })
                .eq('id', entityId);
        } else {
            await supabaseAdmin
                .schema('employer')
                .from('companies')
                .update({ badge_type: newBadge })
                .eq('id', entityId);
        }

        return newBadge;
    } catch (error) {
        console.error(`[badges] Error recalculating badge for ${schema}:${entityId}:`, error);
        return 'none';
    }
}
