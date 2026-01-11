import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { decryptData } from '@/lib/security';

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
            .limit(100);

        if (prosError) {
            console.error('Candidate Fetch Error:', prosError);
            return NextResponse.json({ error: 'Failed to find candidates' }, { status: 500 });
        }

        // 4. Scoring Engine
        const candidates = pros.map((pro: any) => {
            let score = 0;
            const prefs = pro.preferences || {};

            // A. Role Match (40 pts)
            // Compare Job Title vs Target Roles
            if (prefs.target_roles && Array.isArray(prefs.target_roles)) {
                if (prefs.target_roles.some((r: string) => jobTitle.toLowerCase().includes(r.toLowerCase()))) {
                    score += 40;
                } else if (prefs.target_roles.some((r: string) => jobDesc.toLowerCase().includes(r.toLowerCase()))) {
                    score += 20; // Partial match in description
                }
            }

            // Check Current Role (Backup)
            const currentRole = decryptData(pro.enc_current_role);
            if (currentRole && currentRole.toLowerCase().includes(jobTitle.toLowerCase())) {
                // Reinforce score but cap at 40
                if (score < 40) score = 40;
            }

            // B. Location Match (30 pts)
            // Strict enforcement or Relocation leniency
            let userLoc = '';
            // Get location from latest log
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
                        if (decLog.trim().startsWith('{')) {
                            try {
                                const locObj = JSON.parse(decLog);
                                const parts = [];
                                if (locObj.city) parts.push(locObj.city);
                                if (locObj.country) parts.push(locObj.country);
                                userLoc = parts.join(', ');
                            } catch {
                                userLoc = decLog;
                            }
                        } else {
                            userLoc = decLog;
                        }
                    }
                } catch { }
            }

            const jobOrigin = job.speed_boost_location || jobLocation || '';
            const isLocal = userLoc.toLowerCase().includes(jobOrigin.toLowerCase());

            if (job.location_type === 'remote') {
                score += 30; // Everyone matches remote
            } else if (isLocal) {
                score += 30; // Perfect local match
            } else {
                // Not local. 
                // Strict check? 
                if (isRestricted) {
                    // If strictly restricted, 0 points.
                    score += 0;
                } else {
                    // "Willing to relocate" / Global pool -> Partial Points
                    score += 15;
                }
            }

            // C. Preference Match (20 pts)
            if (prefs.work_modes && prefs.work_modes.includes(job.location_type)) {
                score += 10;
            }
            if (prefs.employment_types && prefs.employment_types.includes(job.employment_type)) { // job.employment_type might be undefined in DB row? check schema
                // Assuming job has employment_type column
                score += 10;
            }

            // D. Activity (10 pts)
            // If they have recent logs (implied by being in the fetch list if we filtered, but we didn't)
            if (pro.activity_logs && pro.activity_logs.length > 0) {
                score += 10;
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
