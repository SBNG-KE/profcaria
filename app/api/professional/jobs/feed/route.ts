import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const runtime = 'nodejs';

async function getUserId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('profcaria_session')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return { uid: payload.uid as string, schema: payload.schema as string };
    } catch {
        return null;
    }
}

export async function GET(req: Request) {
    try {
        const auth = await getUserId();
        if (!auth || auth.schema !== 'professional') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch User Preferences
        const { data: prefs } = await supabaseAdmin
            .schema('professional')
            .from('preferences')
            .select('*')
            .eq('user_id', auth.uid)
            .single();

        // 2. Fetch User's "Browser Location" (if passed via query) or last known location
        // For now, we will use the preferences primarily.

        // 3. Fetch All Open Jobs (optimized: limited columns)
        // In a real app we would filter in SQL. For MVP smart match, we fetch and partial filter.
        let query = supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select('*, company:companies(name:company_name, logoUrl:logo_url, enc_company_name, enc_logo_url)')
            .eq('status', 'open')
            .order('created_at', { ascending: false })
            .limit(100); // Limit to top 100 recent for now to sort

        const { data: jobs, error } = await query;

        if (error) {
            console.error('Job Fetch Error:', error);
            return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
        }

        if (!prefs) {
            // No prefs? Return chronological
            return NextResponse.json({ jobs });
        }

        // 4. Algorithm: Weighted Scoring
        const scoredJobs = jobs.map((job: any) => {
            let score = 0;

            // A. Role Match (Heavy Weight: +20)
            if (prefs.target_roles && prefs.target_roles.length > 0) {
                const titleLower = job.title.toLowerCase();
                const descLower = (job.description || '').toLowerCase();
                const matches = prefs.target_roles.some((role: string) =>
                    titleLower.includes(role.toLowerCase()) ||
                    descLower.includes(role.toLowerCase())
                );
                if (matches) score += 20;
            }

            // B. Work Mode Match (Medium Weight: +10)
            if (prefs.work_modes && prefs.work_modes.length > 0) {
                if (prefs.work_modes.includes(job.location_type)) {
                    score += 10;
                }
            }

            // C. Employment Type Match (Medium Weight: +10)
            if (prefs.employment_types && prefs.employment_types.length > 0) {
                if (prefs.employment_types.includes(job.employment_type)) {
                    score += 10;
                }
            }

            // D. Location Match (Medium Weight: +10 / Critical if not remote)
            if (job.location_type !== 'remote' && prefs.preferred_locations?.countries) {
                // Check if job location string contains any preferred country
                // Very basic string check
                const jobLoc = (job.location || '').toLowerCase();
                const matchesLoc = prefs.preferred_locations.countries.some((c: string) =>
                    jobLoc.includes(c.toLowerCase())
                );
                if (matchesLoc) score += 10;
            }

            // E. Random "Diversity" Shuffle (Small Weight: 0-5)
            // Ensures the feed isn't identical every second
            score += Math.random() * 5;

            // F. Recency Decay (Optional, but let's keep recent jobs slightly higher)
            // Included implicitly by the stable sort of initial fetch, 
            // but we can add small point for "New" (< 2 days)
            const daysOld = (Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24);
            if (daysOld < 3) score += 3;

            return { ...job, _score: score };
        });

        // 5. Sort by Score
        scoredJobs.sort((a: any, b: any) => b._score - a._score);

        return NextResponse.json({ jobs: scoredJobs });

    } catch (error) {
        console.error('Feed Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
