import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
            .eq('user_id', auth.uid)
            .single();

        // 2. Fetch User's Real IP Location (from latest activity log)
        const { data: latestLog } = await supabaseAdmin
            .schema('professional')
            .from('activity_logs')
            .select('enc_location_details')
            .eq('user_id', auth.uid)
            .neq('enc_location_details', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .limit(1)
            .single();

        // 2a. Fetch User's Invites
        const { data: invites } = await supabaseAdmin
            .schema('employer')
            .from('job_invites')
            .select('job_id')
            .eq('professional_id', auth.uid)
            .eq('status', 'pending');

        const invitedJobIds = invites?.map((inv: any) => inv.job_id) || [];

        // 2b. Fetch User's Applications (to prevent re-applying)
        const { data: userApps } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('job_id, status, id')
            .eq('user_id', auth.uid);

        const appMap: Record<string, any> = {};
        userApps?.forEach((app: any) => {
            appMap[app.job_id] = { status: app.status, id: app.id };
        });


        // Derive "Real Country" from IP logs
        let userRealCountry = '';
        if (latestLog?.enc_location_details) {
            try {
                // Decrypt
                const plainStr = decryptData(latestLog.enc_location_details);
                if (plainStr) {
                    // Attempt JSON parse or fallback
                    if (plainStr.trim().startsWith('{')) {
                        const parsed = JSON.parse(plainStr);
                        userRealCountry = parsed.country || '';
                    } else {
                        // If string is "Nairobi, Kenya", naively grab last part
                        userRealCountry = plainStr.split(',').pop()?.trim() || '';
                    }
                }
            } catch (e) {
                // Fallback to empty if decryption fails
            }
        }

        // 2. Fetch User's "Browser Location" (if passed via query) or last known location
        // For now, we will use the preferences primarily.

        // 3. Fetch All Open Jobs (optimized: limited columns)
        // In a real app we would filter in SQL. For MVP smart match, we fetch and partial filter.
        let query = supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select('*, company:companies(enc_company_name, enc_logo_url)')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(100); // Limit to top 100 recent for now to sort

        const { data: jobs, error } = await query;

        // 3a. Fetch Application Counts for Max Apps Logic
        // Ideally this should be a view or a counter cache, but for now we aggregate.
        const jobIds = jobs?.map((j: any) => j.id) || [];
        let jobAppCounts: Record<string, number> = {};

        if (jobIds.length > 0) {
            const { data: apps } = await supabaseAdmin
                .schema('employer')
                .from('applications')
                .select('job_id')
                .in('job_id', jobIds);

            if (apps) {
                apps.forEach((app: any) => {
                    jobAppCounts[app.job_id] = (jobAppCounts[app.job_id] || 0) + 1;
                });
            }
        }


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
            const secondsOld = (Date.now() - new Date(job.created_at).getTime()) / 1000;

            if (daysOld < 3) score += 3;

            // --- G. ADVANCED ALGORITHM: SPEED & RESTRICTIONS ---

            // 1. Strict Restricted Jobs
            if (job.is_restricted) {
                // Check against PLAIN TEXT `allowed_country_codes` (if available) or skip if not strictly enforced yet
                if (job.allowed_country_codes && Array.isArray(job.allowed_country_codes)) {
                    // Normalize
                    const allowed = job.allowed_country_codes.map((c: string) => c.toLowerCase());
                    const userCountryLower = userRealCountry.toLowerCase();

                    // If we have a real country and it's NOT in allowed list -> HIDE
                    // Note: If we can't detect user country, we err on side of caution? Or allow?
                    // User prompted "Strict", so if country unknown, maybe block? 
                    // Let's block if country known and mismatch.
                    if (userRealCountry && !allowed.some((ac: string) => userCountryLower.includes(ac))) {
                        return null;
                    }
                }
            }

            // 2. "Speed" Logic - The "Head Start" based on REAL IP
            if (!job.is_restricted && secondsOld < 30 && job.speed_boost_location) {
                const jobOrigin = job.speed_boost_location || '';

                // Strict Check: User's REAL DETECTED country must match job origin
                const isLocalReal = userRealCountry && jobOrigin.toLowerCase().includes(userRealCountry.toLowerCase());

                if (!isLocalReal) {
                    // DELAY! User is remote (or undetected), so they don't see it yet.
                    return null;
                }
            }

            // 3. Max Applications Check
            if (job.max_applications) {
                const currentApps = jobAppCounts[job.id] || 0;
                if (currentApps >= job.max_applications) {
                    return null; // Job is full/closed
                }
            }

            // 4. Invite Boost
            if (invitedJobIds.includes(job.id)) {
                score += 1000; // Massive boost to ensure it's at the top
            }

            // Decrypt Company Info
            const companyName = job.company?.enc_company_name ? decryptData(job.company.enc_company_name) : 'Confidential';
            const companyLogo = job.company?.enc_logo_url ? decryptData(job.company.enc_logo_url) : null;

            // Decrypt Job Info
            const title = decryptData(job.enc_title) || 'Untitled Role';
            const description = decryptData(job.enc_description) || '';
            const location = decryptData(job.enc_location) || '';

            // Check Application Status
            const userApp = appMap[job.id];

            return {
                ...job,
                title,
                description,
                location,
                company: {
                    name: companyName,
                    logoUrl: companyLogo
                },
                createdAt: job.created_at,
                applicationStatus: userApp ? userApp.status : null,
                applicationId: userApp ? userApp.id : null,
                _score: score
            };
        }).filter((j: any) => j !== null); // Remove filter-out jobs

        console.log(`[Feed API] Returning ${scoredJobs.length} jobs. Auth: ${auth.uid}`);

        // 5. Sort by Score
        scoredJobs.sort((a: any, b: any) => b._score - a._score);

        return NextResponse.json({ jobs: scoredJobs });

    } catch (error) {
        console.error('Feed Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
