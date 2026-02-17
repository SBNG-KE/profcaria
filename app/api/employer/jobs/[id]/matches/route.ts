import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { decryptData } from '@/lib/security';
import { calculateRoleSimilarity } from '@/lib/role-similarity';
import { extractSkillsFromText, calculateSkillOverlap } from '@/lib/skills-matching';
import { detectExperienceLevel, experienceLevelMatch, extractYearsFromText, yearsMatchScore } from '@/lib/experience-level';
import { cosineSimilarity, parseEmbedding } from '@/lib/vector-search';

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
                enc_last_name, 
                enc_current_role,
                enc_profile_image_url,
                is_available_for_hire,
                preferences!inner (
                    target_roles,
                    work_modes,
                    employment_types,
                    preferred_locations,
                    embedding_json,
                    experience_years_ranges
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

        // 3b. Fetch Invitations and Applications
        const { data: invites } = await supabaseAdmin
            .schema('employer')
            .from('job_invites')
            .select('professional_id, status')
            .eq('job_id', jobId);

        const inviteMap = new Map(invites?.map((i: { professional_id: any; status: any; }) => [i.professional_id, i.status]));

        const { data: apps } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('user_id')
            .eq('job_id', jobId);

        const appliedSet = new Set(apps?.map((a: { user_id: any; }) => a.user_id));

        // 4. Scoring Engine
        const candidates = pros.map((pro: any) => {
            // Filter: Already Applied
            if (appliedSet.has(pro.id)) return null;

            // Filter: Not Available (unless already invited)
            const inviteStatus = inviteMap.get(pro.id);
            if (pro.is_available_for_hire === false && !inviteStatus) return null;

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

            // B2. Experience Years Match (~10 pts)
            const jobYears = extractYearsFromText(jobTitle + ' ' + jobDesc);
            if (prefs.experience_years_ranges && prefs.experience_years_ranges.length > 0) {
                const yearScore = yearsMatchScore(jobYears, prefs.experience_years_ranges);
                score += Math.round(yearScore * 0.1);
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

            // F. Semantic ML Match (Primary Factor ~45 pts)
            // Uses pre-computed embeddings for meaning-based matching
            // ML is now the primary ranking factor (40% of total score)
            if (job.embedding_json && prefs.embedding_json) {
                try {
                    const jobEmb = parseEmbedding(job.embedding_json);
                    const userEmb = parseEmbedding(prefs.embedding_json);
                    if (jobEmb && userEmb) {
                        const similarity = cosineSimilarity(userEmb, jobEmb);
                        if (similarity > 0.6) score += 45; // Excellent match
                        else if (similarity > 0.5) score += 35; // Strong match
                        else if (similarity > 0.4) score += 25; // Good match
                        else if (similarity > 0.3) score += 15; // Moderate match
                        else score += 5; // Weak match
                    } else {
                        score += 20; // Neutral: parsing failed
                    }
                } catch (embError) {
                    score += 20; // Neutral: error
                }
            } else {
                score += 20; // Neutral: embeddings not available
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
                },
                invited: !!inviteStatus,
                inviteStatus: inviteStatus || null
            };

        })
            .filter((c: any) => c.score > 40) // Only return decent matches
            .sort((a: any, b: any) => b.score - a.score);

        // 5. Enforce Per-Job Plan Limits
        const { getCompanyPlan, checkJobTopMatchLimit, incrementJobTopMatchUsage } = await import('@/lib/billing');
        const { plan } = await getCompanyPlan(auth.uid as string);

        // Parse page param for enterprise pagination
        const url = new URL(req.url);
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));

        // A. Check Per-Job Credit Limit
        const creditCheck = await checkJobTopMatchLimit(auth.uid as string, jobId);

        // B. Get Per-View Limit (How many to show per page)
        const perViewLimit = plan.limits.maxProfileViewPerJob || 0;

        if (!creditCheck.allowed || perViewLimit <= 0) {
            // Access Denied or Limit Reached for this job
            return NextResponse.json({
                candidates: [],
                limit: perViewLimit,
                totalFound: candidates.length,
                isLimitReached: true,
                remainingCredits: creditCheck.remaining,
                creditsPerJob: creditCheck.limit,
                creditsUsed: creditCheck.used,
                message: "Top Matches credit limit reached for this job."
            });
        }

        // C. Pagination Logic
        // For enterprise (perViewLimit=100): paginate in pages of 100
        // For others: show up to perViewLimit candidates (remaining credits)
        const isEnterprise = perViewLimit >= 100;
        const effectiveLimit = isEnterprise ? perViewLimit : Math.min(perViewLimit, creditCheck.remaining);
        const startIndex = isEnterprise ? (page - 1) * perViewLimit : 0;
        const endIndex = startIndex + effectiveLimit;
        const finalCandidates = candidates.slice(startIndex, endIndex);
        const totalPages = isEnterprise ? Math.ceil(candidates.length / perViewLimit) : 1;
        const hasMore = isEnterprise ? endIndex < candidates.length : false;

        // D. Increment Per-Job Usage (Cost = number of NEW profiles revealed)
        if (finalCandidates.length > 0 && !isEnterprise) {
            await incrementJobTopMatchUsage(auth.uid as string, jobId, finalCandidates.length);
        }

        return NextResponse.json({
            candidates: finalCandidates,
            limit: perViewLimit,
            remainingCredits: creditCheck.limit >= 9999 ? 'Unlimited' : Math.max(0, creditCheck.remaining - finalCandidates.length),
            creditsPerJob: creditCheck.limit >= 9999 ? 'Unlimited' : creditCheck.limit,
            creditsUsed: creditCheck.used,
            totalFound: candidates.length,
            isLimitReached: !isEnterprise && finalCandidates.length >= creditCheck.remaining,
            currentPage: page,
            totalPages,
            hasMore
        });

    } catch (error) {
        console.error('Matching Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
