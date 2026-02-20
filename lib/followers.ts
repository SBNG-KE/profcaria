import { supabaseAdmin } from '@/lib/supabase';

/**
 * Retrieves the aggregated and deduplicated follower count for a given user or company.
 * It integrates logic to count regular users and subscribers to linked companies.
 */
export async function getFollowerCount(authorId: string, authorType: string = 'professional'): Promise<number> {
    try {
        if (authorType === 'employer' || authorType === 'company') {
            // Company followers are directly in company_follows
            const { count: followerCount } = await supabaseAdmin
                .schema('professional')
                .from('company_follows')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', authorId);
            return followerCount || 0;
        }

        // --- Professional Followers ---
        const { data: userFollowers } = await supabaseAdmin
            .schema('professional')
            .from('user_follows')
            .select('follower_id')
            .eq('following_id', authorId);

        let allFollowerIds = (userFollowers || []).map((f: any) => f.follower_id);

        // Exclude self
        allFollowerIds = allFollowerIds.filter((id: string) => id !== authorId);

        // Remove duplicates
        allFollowerIds = Array.from(new Set(allFollowerIds));

        // Company merging logic (Employer as Professional or Founder)
        let associatedCompanyId: string | null = null;
        if (authorId === '60f0f916-7b32-483f-afd6-681424a360bf') {
            associatedCompanyId = '40e5c47c-4437-4a55-8c3d-4a4cec5a288b';
        } else {
            try {
                const { data: link } = await supabaseAdmin
                    .schema('employer')
                    .from('company_users')
                    .select('company_id')
                    .eq('user_id', authorId)
                    .maybeSingle();

                if (link) {
                    associatedCompanyId = link.company_id;
                }
            } catch (e) { }
        }

        if (associatedCompanyId) {
            const { data: compFollowers } = await supabaseAdmin
                .schema('professional')
                .from('company_follows')
                .select('user_id')
                .eq('company_id', associatedCompanyId);

            if (compFollowers) {
                const compFollowerIds = compFollowers.map((f: any) => f.user_id);
                for (const id of compFollowerIds) {
                    if (!allFollowerIds.includes(id) && id !== authorId) {
                        allFollowerIds.push(id);
                    }
                }
            }
        }

        return allFollowerIds.length;

    } catch (error) {
        console.error('Error fetching follower count:', error);
        return 0;
    }
}
