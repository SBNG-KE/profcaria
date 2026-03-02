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

// Also support fetching for a specific user (public endpoint for profile display)
export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const targetUserId = url.searchParams.get('userId');

        let userId: string;

        if (targetUserId) {
            // Public access — compute graph for any user
            userId = targetUserId;
        } else {
            // Authenticated — compute for self
            const auth = await getAuth();
            if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            userId = auth.uid;
        }

        // Fetch all verification data in parallel
        const [
            userRes,
            employmentRes,
            verifiedEmploymentRes,
            educationRes,
            certsRes,
            skillsRes,
            docsRes,
            uploadedDocsRes,
            otherProfilesRes,
        ] = await Promise.all([
            supabaseAdmin.schema('professional').from('users')
                .select('badge_type, requires_2fa, has_passkey, has_totp, enc_profile_image_url, enc_about, enc_current_role')
                .eq('id', userId).single(),
            supabaseAdmin.schema('professional').from('employment_history')
                .select('id, enc_company, enc_title, is_current')
                .eq('user_id', userId),
            supabaseAdmin.schema('employer').from('applications')
                .select('id, status')
                .eq('user_id', userId)
                .in('status', ['hired', 'employed', 'terminated', 'resigned', 'pending_termination']),
            supabaseAdmin.schema('professional').from('education')
                .select('id, enc_school, enc_degree')
                .eq('user_id', userId),
            supabaseAdmin.schema('professional').from('certifications')
                .select('id, enc_name, enc_issuer')
                .eq('user_id', userId),
            supabaseAdmin.schema('professional').from('skills')
                .select('id, endorsement_count')
                .eq('user_id', userId),
            supabaseAdmin.schema('professional').from('documents')
                .select('id, doc_type')
                .eq('user_id', userId),
            supabaseAdmin.schema('professional').from('uploaded_documents')
                .select('id')
                .eq('user_id', userId),
            supabaseAdmin.schema('professional').from('other_profiles')
                .select('id, enc_network')
                .eq('user_id', userId),
        ]);

        const user = userRes.data;
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const manualEmployment = employmentRes.data || [];
        const verifiedEmployment = verifiedEmploymentRes.data || [];
        const education = educationRes.data || [];
        const certifications = certsRes.data || [];
        const skills = skillsRes.data || [];
        const documents = docsRes.data || [];
        const uploadedDocs = uploadedDocsRes.data || [];
        const otherProfiles = otherProfilesRes.data || [];

        // --- Compute verification nodes ---
        const nodes: any[] = [];

        // 1. Identity Proof
        const hasProfileImage = !!user.enc_profile_image_url;
        const hasAbout = !!user.enc_about;
        const hasRole = !!user.enc_current_role;
        const has2FA = user.requires_2fa || user.has_passkey || user.has_totp;
        const badgeTier = user.badge_type || 'none';

        const identityScore = [hasProfileImage, hasAbout, hasRole, has2FA, badgeTier !== 'none']
            .filter(Boolean).length;

        nodes.push({
            id: 'identity',
            label: 'Identity',
            icon: 'user',
            status: identityScore >= 4 ? 'verified' : identityScore >= 2 ? 'partial' : 'unverified',
            score: identityScore,
            maxScore: 5,
            details: [
                { label: 'Profile Photo', verified: hasProfileImage },
                { label: 'About Section', verified: hasAbout },
                { label: 'Current Role', verified: hasRole },
                { label: '2FA Enabled', verified: has2FA },
                { label: 'Badge Verified', verified: badgeTier !== 'none' },
            ]
        });

        // 2. Employment Proof
        const verifiedCount = verifiedEmployment.length;
        const manualCount = manualEmployment.length;
        const totalEmployment = verifiedCount + manualCount;
        const employmentStatus = verifiedCount > 0 ? 'verified' : manualCount > 0 ? 'partial' : 'unverified';

        nodes.push({
            id: 'employment',
            label: 'Employment',
            icon: 'briefcase',
            status: employmentStatus,
            score: verifiedCount,
            maxScore: Math.max(totalEmployment, 1),
            details: [
                { label: 'Verified Roles (via Profcaria)', verified: verifiedCount > 0, count: verifiedCount },
                { label: 'Self-declared Roles', verified: manualCount > 0, count: manualCount },
            ]
        });

        // 3. Education Proof
        const hasEducation = education.length > 0;
        nodes.push({
            id: 'education',
            label: 'Education',
            icon: 'graduation',
            status: hasEducation ? 'partial' : 'unverified', // Always partial until we add school verification
            score: education.length,
            maxScore: Math.max(education.length, 1),
            details: [
                { label: 'Education Records', verified: hasEducation, count: education.length },
            ]
        });

        // 4. Skills Proof
        const totalEndorsements = skills.reduce((sum: number, s: any) => sum + (s.endorsement_count || 0), 0);
        const endorsedSkills = skills.filter((s: any) => s.endorsement_count > 0).length;

        nodes.push({
            id: 'skills',
            label: 'Skills',
            icon: 'code',
            status: endorsedSkills > 0 ? 'verified' : skills.length > 0 ? 'partial' : 'unverified',
            score: endorsedSkills,
            maxScore: Math.max(skills.length, 1),
            details: [
                { label: 'Total Skills', verified: skills.length > 0, count: skills.length },
                { label: 'Endorsed Skills', verified: endorsedSkills > 0, count: endorsedSkills },
                { label: 'Total Endorsements', verified: totalEndorsements > 0, count: totalEndorsements },
            ]
        });

        // 5. Certifications Proof
        const hasCerts = certifications.length > 0;
        nodes.push({
            id: 'certifications',
            label: 'Certifications',
            icon: 'award',
            status: hasCerts ? 'partial' : 'unverified',
            score: certifications.length,
            maxScore: Math.max(certifications.length, 1),
            details: [
                { label: 'Certifications', verified: hasCerts, count: certifications.length },
            ]
        });

        // 6. Documents Proof
        const totalDocs = documents.length + uploadedDocs.length;
        nodes.push({
            id: 'documents',
            label: 'Documents',
            icon: 'file',
            status: totalDocs > 0 ? 'partial' : 'unverified',
            score: totalDocs,
            maxScore: Math.max(totalDocs, 1),
            details: [
                { label: 'Written Docs', verified: documents.length > 0, count: documents.length },
                { label: 'Uploaded Files', verified: uploadedDocs.length > 0, count: uploadedDocs.length },
            ]
        });

        // 7. External Profiles
        const hasLinked = otherProfiles.length > 0;
        nodes.push({
            id: 'profiles',
            label: 'Linked Profiles',
            icon: 'link',
            status: hasLinked ? 'partial' : 'unverified',
            score: otherProfiles.length,
            maxScore: Math.max(otherProfiles.length, 1),
            details: [
                { label: 'Linked Accounts', verified: hasLinked, count: otherProfiles.length },
            ]
        });

        // 8. Security Level
        const securityChecks = [user.requires_2fa, user.has_passkey, user.has_totp, badgeTier !== 'none'];
        const securityScore = securityChecks.filter(Boolean).length;

        nodes.push({
            id: 'security',
            label: 'Account Security',
            icon: 'shield',
            status: securityScore >= 3 ? 'verified' : securityScore >= 1 ? 'partial' : 'unverified',
            score: securityScore,
            maxScore: 4,
            details: [
                { label: '2FA Required', verified: !!user.requires_2fa },
                { label: 'Passkey Setup', verified: !!user.has_passkey },
                { label: 'TOTP Setup', verified: !!user.has_totp },
                { label: 'Badge Tier', verified: badgeTier !== 'none' },
            ]
        });

        // Compute overall score
        const verifiedNodes = nodes.filter(n => n.status === 'verified').length;
        const partialNodes = nodes.filter(n => n.status === 'partial').length;
        const overallScore = Math.round(((verifiedNodes * 2 + partialNodes) / (nodes.length * 2)) * 100);

        // Determine overall tier
        let overallTier: string;
        if (overallScore >= 80) overallTier = 'gold';
        else if (overallScore >= 50) overallTier = 'blue';
        else if (overallScore >= 25) overallTier = 'gray';
        else overallTier = 'none';

        return NextResponse.json({
            graph: {
                nodes,
                overallScore,
                overallTier,
                badgeTier,
                totalVerified: verifiedNodes,
                totalPartial: partialNodes,
                totalUnverified: nodes.filter(n => n.status === 'unverified').length,
            }
        });
    } catch (error) {
        console.error('Verification Graph API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
