import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { decryptData } from '@/lib/security';
import { calculateRoleSimilarity } from '@/lib/role-similarity';
import { extractSkillsFromText, calculateSkillOverlap } from '@/lib/skills-matching';
import { detectExperienceLevel, experienceLevelMatch } from '@/lib/experience-level';

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
            .select('job_id')
            .eq('professional_id', auth.uid)
            .in('status', ['pending', 'sent']); // Allow 'sent' as well just in case

        const invitedJobIds = invites?.map((inv: any) => inv.job_id) || [];

        // 2b. Fetch User's Applications (to prevent re-applying)
        const { data: userApps } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .from('applications')
            .select('job_id, status, id, job:jobs(enc_title)')
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
            // Decrypt Job Info FIRST so we can score it
            const title = decryptData(job.enc_title) || 'Untitled Role';
            const description = decryptData(job.enc_description) || '';
            const location = decryptData(job.enc_location) || '';

            // Decrypt Company Info
            const companyName = job.company?.enc_company_name ? decryptData(job.company.enc_company_name) : 'Confidential';
            const companyLogo = job.company?.enc_logo_url ? decryptData(job.company.enc_logo_url) : null;

            let score = 0;

            // --- NEW ALGORITHM IMPLEMENTATION ---

            try {
                // A. Role Similarity & Semantic Match (Max ~50 pts)
                // Uses fuzzy matching + category awareness
                let roleScore = 0;
                const jobCategories = job.role_categories || (job.role_category ? [job.role_category] : []); // Support array

                if (prefs.target_roles && prefs.target_roles.length > 0) {
                    // Check similarity against all target roles and take best match
                    const similarities = prefs.target_roles.map((targetRole: string) =>
                        calculateRoleSimilarity(targetRole, title, jobCategories)
                    );
                    const bestMatch = Math.max(...similarities);

                    // Base score from similarity (0-100) -> scaled to 0-30
                    score += Math.round(bestMatch * 0.3);

                    // Bonus if exact match on title (boost confidence)
                    if (bestMatch > 90) score += 10;
                }

                // B. Skills Matching (Max ~20 pts)
                // Extract skills from job description and match with user's implied skills
                // (In future: use actual user skills profile)
                const jobSkills = extractSkillsFromText(description + ' ' + title);
                const userContext = (prefs.target_roles || []).join(' ') + ' ' + (prefs.headline || '');
                // We don't have user skills in prefs yet, so we infer from roles. 
                // Ideally we'd fetch user.skills. For now, we extract from their target roles to simulate.
                const userSkills = extractSkillsFromText(userContext);

                if (jobSkills.length > 0) {
                    const skillMatch = calculateSkillOverlap(userSkills, jobSkills);
                    score += Math.round(skillMatch * 0.2); // Scale 0-100 to 0-20
                }

                // C. Experience Level Match (Max ~10 pts)
                const jobLevel = detectExperienceLevel(title) || detectExperienceLevel(description);
                // We assume user level from their target roles or past jobs? 
                // Hard to guess without strict profile data. Defaulting to neutral if unknown.
                // If user has "Senior" in target roles:
                const userLevel = detectExperienceLevel((prefs.target_roles || []).join(' '));

                if (jobLevel && userLevel) {
                    const levelScore = experienceLevelMatch(userLevel, jobLevel);
                    score += Math.round(levelScore * 0.1); // Scale 0-100 to 0-10
                } else {
                    score += 5; // Neutral bonus
                }

                // D. Work Mode & Employment (Max 20 pts)
                if (prefs.work_modes?.includes(job.location_type)) score += 10;
                if (prefs.employment_types?.includes(job.employment_type)) score += 10;

                // E. Location Match (Max 10 pts)
                if (job.location_type !== 'remote' && prefs.preferred_locations?.countries) {
                    const jobLoc = location.toLowerCase();
                    const matchesLoc = prefs.preferred_locations.countries.some((c: string) =>
                        jobLoc.includes(c.toLowerCase())
                    );
                    if (matchesLoc) score += 10;
                }

                // F. Activity/Recency Logic (Dynamic)
                const hoursOld = (Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60);
                if (hoursOld < 6) score += 5;      // Very fresh
                else if (hoursOld < 24) score += 3; // Today
                else if (hoursOld < 72) score += 1; // Recent

                // G. Bidirectional Matching (Past Applications)
                // Did user apply to similar jobs?
                if (userApps && userApps.length > 0) {
                    const pastTitles = userApps
                        .map((a: any) => decryptData(a.job?.enc_title))
                        .filter(Boolean) as string[];

                    // Check similarity with THIS job
                    const pastSimilarity = Math.max(0, ...pastTitles.map(t => calculateRoleSimilarity(t, title)));
                    if (pastSimilarity > 70) {
                        score += 10; // User likes this kind of job
                    }
                }

                // H. Invite Boost
                if (invitedJobIds.includes(job.id)) score += 1000;

                // Diversity Shuffle (Minor)
                score += Math.random() * 3;

                // 1. Strict Restricted Jobs
                if (job.is_restricted) {
                    if (job.allowed_country_codes && Array.isArray(job.allowed_country_codes)) {
                        const allowed = job.allowed_country_codes.map((c: string) => c.toLowerCase());
                        const userCountryLower = userRealCountry.toLowerCase();

                        if (userRealCountry && !allowed.some((ac: string) => userCountryLower.includes(ac))) {
                            return null;
                        }
                    }
                }

                // 2. "Speed" Logic - The "Head Start" based on REAL IP
                const secondsOld = (Date.now() - new Date(job.created_at).getTime()) / 1000;
                if (!job.is_restricted && secondsOld < 30 && job.speed_boost_location) {
                    const jobOrigin = job.speed_boost_location || '';
                    const isLocalReal = userRealCountry && jobOrigin.toLowerCase().includes(userRealCountry.toLowerCase());

                    // Only enforce if we successfully detected user country
                    if (userRealCountry && !isLocalReal) {
                        return null;
                    }
                }

                // 3. Max Applications Check (Plan Enforcement)
                const effectiveMax = job.max_applications || 100; // Default system cap if null
                const currentApps = jobAppCounts[job.id] || 0;

                if (currentApps >= effectiveMax) {
                    return null; // Job is full/closed
                }

                // Check Application Status
                const userApp = appMap[job.id];

                return {
                    ...job,
                    title,
                    description,
                    location,
                    company: {
                        name: companyName || 'Confidential',
                        logoUrl: companyLogo
                    },
                    createdAt: job.created_at,
                    applicationStatus: userApp ? userApp.status : null,
                    applicationId: userApp ? userApp.id : null,
                    isInvited: invitedJobIds.includes(job.id),
                    _score: score
                };

            } catch (jobError) {
                console.error(`[MetaFeed] Error processing job ${job.id}:`, jobError);
                return null; // Skip this job instead of crashing
            }
        }).filter((j: any) => j !== null); // Remove filter-out jobs

        console.log(`[Feed API] Returning ${scoredJobs.length} jobs. Auth: ${auth.uid}`);

        // 5. Sort by Score
        scoredJobs.sort((a: any, b: any) => b._score - a._score);

        return NextResponse.json({
            jobs: scoredJobs,
            debug: {
                totalFetched: jobs.length,
                filteredRestricted: jobs.length - scoredJobs.length, // Rough diff
                userCountry: userRealCountry
            }
        });

    } catch (error) {
        console.error('Feed Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
