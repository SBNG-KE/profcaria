import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const runtime = 'nodejs';

async function getAuth() {
    const cookieStore = await cookies();
    const token = cookieStore.get('profcaria_session')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        if (payload.schema !== 'professional') return null;
        return { uid: payload.uid as string };
    } catch {
        return null;
    }
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const targetUserId = url.searchParams.get('userId');

        let userId: string;
        if (targetUserId) {
            userId = targetUserId;
        } else {
            const auth = await getAuth();
            if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            userId = auth.uid;
        }

        // Fetch all data in parallel
        const [
            userRes, radarRes, employmentRes, verifiedEmploymentRes,
            educationRes, certsRes, skillsRes, docsRes, uploadedDocsRes,
            profileViewsRes, postsRes, followersRes, connectionsRes,
        ] = await Promise.all([
            supabaseAdmin.schema('professional').from('users')
                .select('badge_type, requires_2fa, has_passkey, has_totp, enc_profile_image_url, enc_about, enc_current_role, enc_first_name, enc_last_name, follower_count')
                .eq('id', userId).single(),
            supabaseAdmin.from('professional_radar_stats')
                .select('depth_score, execution_speed, collaboration_index, creativity_score')
                .eq('professional_id', userId).maybeSingle(),
            supabaseAdmin.schema('professional').from('employment_history')
                .select('id').eq('user_id', userId),
            supabaseAdmin.schema('employer').from('applications')
                .select('id, status').eq('user_id', userId)
                .in('status', ['hired', 'employed', 'terminated', 'resigned', 'pending_termination']),
            supabaseAdmin.schema('professional').from('education')
                .select('id').eq('user_id', userId),
            supabaseAdmin.schema('professional').from('certifications')
                .select('id').eq('user_id', userId),
            supabaseAdmin.schema('professional').from('skills')
                .select('id, endorsement_count').eq('user_id', userId),
            supabaseAdmin.schema('professional').from('documents')
                .select('id').eq('user_id', userId),
            supabaseAdmin.schema('professional').from('uploaded_documents')
                .select('id').eq('user_id', userId),
            supabaseAdmin.schema('professional').from('profile_views')
                .select('id', { count: 'exact' }).eq('viewed_professional_id', userId),
            supabaseAdmin.schema('professional').from('posts')
                .select('id', { count: 'exact' }).eq('user_id', userId),
            supabaseAdmin.schema('professional').from('user_follows')
                .select('id', { count: 'exact' }).eq('following_id', userId),
            supabaseAdmin.schema('professional').from('user_follows')
                .select('id', { count: 'exact' }).eq('follower_id', userId),
        ]);

        const user = userRes.data;
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const radar = radarRes.data;
        const skills = skillsRes.data || [];
        const badgeTier = user.badge_type || 'none';

        // ============ COMPUTE 5 PILLARS ============

        // 1. PROFILE STRENGTH (0-100)
        const hasPhoto = !!user.enc_profile_image_url;
        const hasAbout = !!user.enc_about;
        const hasRole = !!user.enc_current_role;
        const hasEducation = (educationRes.data?.length || 0) > 0;
        const hasCerts = (certsRes.data?.length || 0) > 0;
        const hasSkills = skills.length > 0;
        const hasDocs = (docsRes.data?.length || 0) + (uploadedDocsRes.data?.length || 0) > 0;
        const hasEmployment = (employmentRes.data?.length || 0) > 0;

        const profileChecks = [hasPhoto, hasAbout, hasRole, hasEducation, hasCerts, hasSkills, hasDocs, hasEmployment];
        const profileStrength = Math.round((profileChecks.filter(Boolean).length / profileChecks.length) * 100);

        // 2. SKILL POWER (0-100) — from AI radar stats
        let skillPower = 0;
        if (radar) {
            skillPower = Math.round(
                (radar.depth_score + radar.execution_speed + radar.collaboration_index + radar.creativity_score) / 4
            );
        }

        // 3. VERIFICATION TRUST (0-100) — from verification data
        const verifiedCount = verifiedEmploymentRes.data?.length || 0;
        const has2FA = user.requires_2fa || user.has_passkey || user.has_totp;
        const endorsedSkills = skills.filter((s: any) => s.endorsement_count > 0).length;

        const trustChecks: { weight: number; score: number }[] = [
            { weight: 25, score: badgeTier !== 'none' ? 100 : 0 },
            { weight: 20, score: has2FA ? 100 : 0 },
            { weight: 25, score: verifiedCount > 0 ? Math.min(verifiedCount * 50, 100) : 0 },
            { weight: 15, score: endorsedSkills > 0 ? Math.min(endorsedSkills * 25, 100) : 0 },
            { weight: 15, score: hasDocs ? 100 : 0 },
        ];
        const verificationTrust = Math.round(
            trustChecks.reduce((sum, c) => sum + (c.weight * c.score / 100), 0)
        );

        // 4. NETWORK INFLUENCE (0-100) — followers, views, connections
        const followersCount = followersRes.count || 0;
        const viewsCount = profileViewsRes.count || 0;
        const postsCount = postsRes.count || 0;
        const connectionsCount = connectionsRes.count || 0;

        // Logarithmic scale: more followers = diminishing returns
        const followerScore = Math.min(Math.round(Math.log2(followersCount + 1) * 12), 100);
        const viewScore = Math.min(Math.round(Math.log2(viewsCount + 1) * 10), 100);
        const postScore = Math.min(Math.round(Math.log2(postsCount + 1) * 15), 100);
        const connectionScore = Math.min(Math.round(Math.log2(connectionsCount + 1) * 14), 100);

        const networkInfluence = Math.round((followerScore + viewScore + postScore + connectionScore) / 4);

        // 5. GROWTH TRAJECTORY (0-100) — activity and engagement
        const hasRecentEmployment = hasEmployment;
        const hasMultipleSkills = skills.length >= 3;
        const hasMultipleDocs = (docsRes.data?.length || 0) + (uploadedDocsRes.data?.length || 0) >= 2;
        const hasConnections = connectionsCount > 0;
        const hasPosts = postsCount > 0;

        const growthChecks = [hasRecentEmployment, hasMultipleSkills, hasMultipleDocs, hasConnections, hasPosts];
        const growthTrajectory = Math.round((growthChecks.filter(Boolean).length / growthChecks.length) * 100);

        // ============ OVERALL CAREER SCORE ============
        const pillars = [
            { id: 'profile', label: 'Profile Strength', score: profileStrength, weight: 20, icon: 'user', description: 'Completeness of your professional profile' },
            { id: 'skills', label: 'Skill Power', score: skillPower, weight: 25, icon: 'code', description: 'AI-analyzed depth, execution, collaboration, creativity' },
            { id: 'trust', label: 'Verification Trust', score: verificationTrust, weight: 25, icon: 'shield', description: 'Badge, 2FA, verified employment, endorsements' },
            { id: 'network', label: 'Network Influence', score: networkInfluence, weight: 15, icon: 'users', description: 'Followers, views, posts, connections' },
            { id: 'growth', label: 'Growth Trajectory', score: growthTrajectory, weight: 15, icon: 'trending', description: 'Activity, skilling, and engagement trends' },
        ];

        const overallScore = Math.round(
            pillars.reduce((sum, p) => sum + (p.score * p.weight / 100), 0)
        );

        // Determine tier
        let tier: string;
        if (overallScore >= 80) tier = 'legendary';
        else if (overallScore >= 60) tier = 'elite';
        else if (overallScore >= 40) tier = 'rising';
        else if (overallScore >= 20) tier = 'emerging';
        else tier = 'newcomer';

        // Radar breakdown (for mini radar chart)
        const radarBreakdown = radar ? {
            depth: radar.depth_score,
            execution: radar.execution_speed,
            collaboration: radar.collaboration_index,
            creativity: radar.creativity_score,
        } : null;

        return NextResponse.json({
            score: {
                overall: overallScore,
                tier,
                pillars,
                radarBreakdown,
                stats: {
                    followers: followersCount,
                    views: viewsCount,
                    posts: postsCount,
                    connections: connectionsCount,
                    skills: skills.length,
                    endorsedSkills,
                    verifiedRoles: verifiedCount,
                    documents: (docsRes.data?.length || 0) + (uploadedDocsRes.data?.length || 0),
                    badgeTier,
                },
            }
        });
    } catch (error) {
        console.error('Career Score API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
