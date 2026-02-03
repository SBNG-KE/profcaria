import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SearchHistoryResult {
    id: string;
    name: string;
    image: string;
    type: 'professional' | 'employer';
    followers: number;
    badgeType: string;
    lastSearched: string;
}

// GET - Fetch user's recent search history (last 10 unique clicks)
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get recent search clicks with target info
        const { data: clicks, error } = await supabaseAdmin
            .schema('professional')
            .from('search_clicks')
            .select('id, target_id, target_type, query, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Search history fetch error:', error);
            return NextResponse.json({ history: [] });
        }

        // Deduplicate by target_id (keep most recent)
        const seen = new Set<string>();
        const unique = (clicks || []).filter((c: { target_id: string; target_type: string; query: string | null; created_at: string }) => {
            if (seen.has(c.target_id)) return false;
            seen.add(c.target_id);
            return true;
        }).slice(0, 10);

        // Fetch decrypted names for each target
        const results: SearchHistoryResult[] = [];

        for (const click of unique) {
            if (click.target_type === 'professional') {
                const { data: prof } = await supabaseAdmin
                    .schema('professional')
                    .from('users')
                    .select('id, enc_first_name, enc_last_name, enc_profile_image_url, follower_count, badge_type')
                    .eq('id', click.target_id)
                    .single();

                if (prof) {
                    results.push({
                        id: prof.id,
                        name: `${decryptData(prof.enc_first_name) || ''} ${decryptData(prof.enc_last_name) || ''}`.trim(),
                        image: decryptData(prof.enc_profile_image_url) || '/default-avatar.png',
                        type: 'professional',
                        followers: prof.follower_count || 0,
                        badgeType: prof.badge_type || 'none',
                        lastSearched: click.created_at
                    });
                }
            } else if (click.target_type === 'employer') {
                const { data: company } = await supabaseAdmin
                    .schema('employer')
                    .from('companies')
                    .select('id, enc_company_name, enc_logo_url, follower_count, badge_type')
                    .eq('id', click.target_id)
                    .single();

                if (company) {
                    results.push({
                        id: company.id,
                        name: decryptData(company.enc_company_name) || '',
                        image: decryptData(company.enc_logo_url) || '/default-logo.png',
                        type: 'employer',
                        followers: company.follower_count || 0,
                        badgeType: company.badge_type || 'none',
                        lastSearched: click.created_at
                    });
                }
            }
        }

        return NextResponse.json({ history: results });

    } catch (error: any) {
        console.error('Search History GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Save a search click
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { targetId, targetType, query, industry } = await request.json();

        if (!targetId || !targetType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Insert click record
        const { error } = await supabaseAdmin
            .schema('professional')
            .from('search_clicks')
            .insert({
                user_id: user.id,
                target_id: targetId,
                target_type: targetType,
                query: query || null,
                industry: industry || null
            });

        if (error) {
            console.warn('Search click save error (non-fatal):', error);
            return NextResponse.json({ success: false }, { status: 200 });
        }

        // Also log the query to search_logs for text-based algorithm training
        if (query && query.trim()) {
            await supabaseAdmin
                .schema('professional')
                .from('search_logs')
                .insert({
                    user_id: user.id,
                    query: query.trim()
                });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Search History POST Error:', error);
        // Fail gracefully so frontend doesn't show error to user
        return NextResponse.json({ success: false, warning: error.message }, { status: 200 });
    }
}
