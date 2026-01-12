import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { decryptData } from '@/lib/security';
import { calculateRoleSimilarity } from '@/lib/role-similarity';
import { extractSkillsFromText, calculateSkillOverlap } from '@/lib/skills-matching';
import { detectExperienceLevel, experienceLevelMatch } from '@/lib/experience-level';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: jobId } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 1. Verify Employer
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        let auth;
        try {
            const { payload } = await jwtVerify(token, secret);
            auth = payload;
        } catch {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        if (auth.schema !== 'employer') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Fetch Job Details for Matching
        const { data: job, error: jobError } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .eq('company_id', auth.uid)
            .single();

        if (jobError || !job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        // Decrypt necessary job fields
        const jobTitle = decryptData(job.enc_title) || '';
        const jobDesc = decryptData(job.enc_description) || '';
        const jobLocation = decryptData(job.enc_location) || '';
        const isRestricted = job.is_restricted;

        // 3. Fetch Candidates (Professionals)
        // Optimization: In a real app, use Supabase Text Search or Filters to narrow down first.
        // For now, fetch top 100 recent active users to score.
        const { data: pros, error: prosError } = await supabaseAdmin
            .schema('professional')
            .from('users') // We need to access preferences table mostly
            .select(`
                id, 
                enc_first_name, 
                enc_last_name, 
                enc_current_role,
                enc_profile_image_url,
                preferences!inner (
                    target_roles,
                    work_modes,
                    employment_types,
                    preferred_locations
                ),
                activity_logs (
                    enc_location_details,
                    created_at
                )
            `)

            .limit(200); // Expanded pool for better matching

        if (prosError) {
            console.error('Candidate Fetch Error:', prosError);
            return NextResponse.json({ error: 'Failed to find candidates' }, { status: 500 });
        }

        // 4. Scoring Engine
        const candidates = pros.map((pro: any) => {
            let score = 0;
            const prefs = pro.preferences || {};

            // --- NEW ALGORITHM IMPLEMENTATION ---

            // A. Role Similarity (Max 40 pts)
            const jobCategories = job.role_categories || (job.role_category ? [job.role_category] : []);

            // Check Target Roles
            let targetRoleScore = 0;
            if (prefs.target_roles && Array.isArray(prefs.target_roles) && prefs.target_roles.length > 0) {
                const bestMatch = Math.max(...prefs.target_roles.map((r: string) =>
                    calculateRoleSimilarity(r, jobTitle, jobCategories)
                ));
                targetRoleScore = Math.round(bestMatch * 0.4); // Scale 0-100 to 0-40
            }

            // Check Current Role (Backup/Reinforce)
            let currentRoleScore = 0;
            const currentRole = decryptData(pro.enc_current_role);
            if (currentRole) {
                const match = calculateRoleSimilarity(currentRole, jobTitle, jobCategories);
                currentRoleScore = Math.round(match * 0.4);
            }

            // Take the better of the two, but maybe boost if both match?
            score += Math.max(targetRoleScore, currentRoleScore);


            // B. Skills Matching (Max 20 pts)
            // Extract from Job Desc
            const jobSkills = extractSkillsFromText(jobTitle + ' ' + (jobDesc || ''));
            // Extract from Candidate (Current Role + Target Roles serves as proxy for now)
            // Future: Fetch explicit skills column
            const candidateContext = (currentRole || '') + ' ' + (prefs.target_roles || []).join(' ');
            const candidateSkills = extractSkillsFromText(candidateContext);

            if (jobSkills.length > 0) {
                const skillMatch = calculateSkillOverlap(candidateSkills, jobSkills);
                score += Math.round(skillMatch * 0.2);
            }

            // C. Location Match (Max 30 pts)
            let userLoc = '';
            // Get location from latest log
            if (pro.activity_logs && pro.activity_logs.length > 0) {
                // Sort logs by created_at desc to find latest
                const sortedLogs = pro.activity_logs.sort((a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                const log = sortedLogs[0];
                try {
                    const decLog = decryptData(log.enc_location_details);
                    if (decLog) {
                        userLoc = decLog.trim().startsWith('{') ? JSON.parse(decLog).country || decLog : decLog;
                        // Simplify for comparison (naive)
                        if (userLoc.includes(',')) userLoc = userLoc.split(',').pop()?.trim() || userLoc;
                    }
                } catch { }
            }

            const jobOrigin = job.speed_boost_location || jobLocation || '';
            // Naive check
            const isLocal = userLoc && jobOrigin && userLoc.toLowerCase().includes(jobOrigin.toLowerCase());

            if (job.location_type === 'remote') {
                score += 30;
            } else if (isLocal) {
                score += 30;
            } else {
                if (isRestricted) {
                    score += 0;
                } else {
                    score += 15; // Relocation / Global
                }
            }

            // D. Preferences (Max 10 pts)
            // Combined Work Mode & Employment Type
            let prefScore = 0;
            if (prefs.work_modes?.includes(job.location_type)) prefScore += 5;
            if (prefs.employment_types?.includes(job.employment_type)) prefScore += 5;
            score += prefScore;

            // E. Activity Recency (Max 10 pts)
            if (pro.activity_logs && pro.activity_logs.length > 0) {
                const latest = new Date(pro.activity_logs[0].created_at).getTime(); // They are sorted in SQL? No, only fetched.
                // Re-sort locally just in case arrays are messy
                const sortedLogs = pro.activity_logs.sort((a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                const lastActive = new Date(sortedLogs[0].created_at).getTime();
                const hoursAgo = (Date.now() - lastActive) / (1000 * 60 * 60);

                if (hoursAgo < 24) score += 10;
                else if (hoursAgo < 72) score += 7; // 3 days
                else if (hoursAgo < 168) score += 5; // 1 week
                else score += 2; // Older
            }

            return {
                id: pro.id,
                name: `${decryptData(pro.enc_first_name) || 'Unknown'} ${decryptData(pro.enc_last_name) || 'Candidate'}`,
                role: currentRole,
                image: decryptData(pro.enc_profile_image_url),
                score: Math.min(score, 100),
                location: userLoc,
                matchBreakdown: {
                    role: score >= 40,
                    location: isLocal || job.location_type === 'remote',
                    relocation: !isLocal && !isRestricted && job.location_type !== 'remote'
                }
            };

        })
            .filter((c: any) => c.score > 40) // Only return decent matches
            .sort((a: any, b: any) => b.score - a.score);

        // 5. Enforce Plan Limits
        const { getCompanyPlan, checkLimit, incrementUsage } = await import('@/lib/billing');
        const { plan } = await getCompanyPlan(auth.uid as string);

        // A. Check Global "Credit" Limit (Total top matches allowed)
        // If checking 'topMatches', checkLimit checks if usage < limit.
        const canViewMore = await checkLimit(auth.uid as string, 'topMatches');

        // B. Get Per-View Limit (How many to show right now)
        const perViewLimit = plan.limits.maxProfileViewPerJob || 0;
        const totalCreditsLimit = plan.limits.topMatches || 0;

        if (!canViewMore || perViewLimit === 0) {
            // Access Denied or Limit Reached
            return NextResponse.json({
                candidates: [],
                limit: perViewLimit,
                totalFound: candidates.length,
                isLimitReached: true,
                message: "Top Matches limit reached or feature not available."
            });
        }

        // C. Slice Logic
        // We show `perViewLimit` candidates.
        const finalCandidates = candidates.slice(0, perViewLimit);

        // D. Increment Usage (Cost = number of profiles revealed)
        // Only increment if we actually found candidates
        if (finalCandidates.length > 0) {
            // We await this to ensure it counts, or we can fire-and-forget if performance is critical.
            // For accuracy, we await.
            await incrementUsage(auth.uid as string, 'topMatches', finalCandidates.length);
        }

        return NextResponse.json({
            candidates: finalCandidates,
            limit: perViewLimit,
            remainingCredits: totalCreditsLimit >= 9999 ? 'Unlimited' : (totalCreditsLimit - (await getCompanyPlan(auth.uid as string)).subscription?.usage_top_matches),
            totalFound: candidates.length,
            isLimitReached: candidates.length > perViewLimit // Just indicates there are more hidden ones
        });

    } catch (error) {
        console.error('Matching Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
