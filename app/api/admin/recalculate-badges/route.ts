import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getBadgeForFollowerCount } from '@/lib/billing-config';

export const runtime = 'nodejs';

// One-time admin endpoint to recalculate ALL badges based on actual follower counts.
// Call once, then this can be removed or kept for future maintenance.
// Protected by admin secret to prevent abuse.

export async function POST(req: NextRequest) {
    try {
        // Simple admin protection
        const { secret } = await req.json();
        if (secret !== process.env.JWT_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const results = { professionals: { total: 0, updated: 0, details: [] as any[] }, employers: { total: 0, updated: 0, details: [] as any[] } };

        // --- 1. PROFESSIONAL USERS ---
        const { data: users } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('id, badge_type');

        if (users) {
            results.professionals.total = users.length;

            for (const user of users) {
                // Count actual followers
                const { count } = await supabaseAdmin
                    .schema('professional')
                    .from('user_follows')
                    .select('*', { count: 'exact', head: true })
                    .eq('following_id', user.id);

                const followerCount = count || 0;
                const correctBadge = getBadgeForFollowerCount(followerCount);

                if (user.badge_type !== correctBadge) {
                    await supabaseAdmin
                        .schema('professional')
                        .from('users')
                        .update({ badge_type: correctBadge })
                        .eq('id', user.id);

                    results.professionals.updated++;
                    results.professionals.details.push({
                        id: user.id,
                        oldBadge: user.badge_type,
                        newBadge: correctBadge,
                        followers: followerCount
                    });
                }
            }
        }

        // --- 2. EMPLOYER COMPANIES ---
        const { data: companies } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('id, badge_type');

        if (companies) {
            results.employers.total = companies.length;

            for (const company of companies) {
                // Count actual followers (company_follows uses company_id)
                const { count } = await supabaseAdmin
                    .schema('professional')
                    .from('company_follows')
                    .select('*', { count: 'exact', head: true })
                    .eq('company_id', company.id);

                const followerCount = count || 0;
                const correctBadge = getBadgeForFollowerCount(followerCount);

                if (company.badge_type !== correctBadge) {
                    await supabaseAdmin
                        .schema('employer')
                        .from('companies')
                        .update({ badge_type: correctBadge })
                        .eq('id', company.id);

                    results.employers.updated++;
                    results.employers.details.push({
                        id: company.id,
                        oldBadge: company.badge_type,
                        newBadge: correctBadge,
                        followers: followerCount
                    });
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Recalculated badges for ${results.professionals.total} professionals and ${results.employers.total} companies.`,
            professionals: {
                total: results.professionals.total,
                corrected: results.professionals.updated,
                changes: results.professionals.details
            },
            employers: {
                total: results.employers.total,
                corrected: results.employers.updated,
                changes: results.employers.details
            }
        });

    } catch (error: any) {
        console.error('Badge cleanup error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
