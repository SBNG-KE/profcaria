import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q')?.trim() || '';

        if (!query) {
            return NextResponse.json({ results: [] });
        }

        // Search Professional Users
        // Note: Since names are encrypted, we can't search them directly with SQL LIKE efficiently without strict equality or a separate search index (which we don't have yet for encrypted fields).
        // FOR NOW: We will fetch all users and filter in memory. THIS IS NOT SCALABLE but works for MVP/small scale as requested.
        // A better approach would be to have a blind index or unencrypted search_name column, but that requires a migration.
        // Given constraints, we'll fetch ID, encrypted names, and follower count, then decrypt and filter.

        // Fetch Professionals
        const { data: professionals } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('id, enc_first_name, enc_last_name, enc_profile_image_url, follower_count');

        // Fetch Employers
        const { data: employers } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('id, enc_company_name, enc_logo_url'); // Employers may not have follower_count yet in companies table? Let's check schema.
        // Wait, migration `feed_social.sql` adds follower tables but not necessarily counts to companies if it's new.
        // Actually `professional.users` has `follower_count` added in `prof_settings_v4` or similar? 
        // In layout user view, I saw `followerCount`.

        // Let's assume we filter in memory.

        const results: any[] = [];
        const lowerQuery = query.toLowerCase();

        // Process Professionals
        if (professionals) {
            for (const p of professionals) {
                const fName = decryptData(p.enc_first_name) || '';
                const lName = decryptData(p.enc_last_name) || '';
                const fullName = `${fName} ${lName}`.trim();

                if (fullName.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        id: p.id,
                        name: fullName,
                        image: decryptData(p.enc_profile_image_url) || '/default-avatar.png',
                        type: 'professional',
                        followers: p.follower_count || 0
                    });
                }
            }
        }

        // Process Employers
        if (employers) {
            for (const e of employers) {
                const name = decryptData(e.enc_company_name) || '';
                if (name.toLowerCase().includes(lowerQuery)) {
                    // Employer follower count might be missing, default to 0
                    results.push({
                        id: e.id,
                        name: name,
                        image: decryptData(e.enc_logo_url) || '/default-logo.png',
                        type: 'employer',
                        followers: 0 // TODO: Add follower_count to companies if needed
                    });
                }
            }
        }

        // Rank by followers descending
        results.sort((a, b) => b.followers - a.followers);

        // Limit results
        return NextResponse.json({ results: results.slice(0, 10) });

    } catch (error: any) {
        console.error('Search Users Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
