import React from 'react';
import ProfessionalPostsSection from '@/app/components/professional/ProfessionalPostsSection';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { getFollowerCount } from '@/lib/followers';
import {
    User, MapPin, Briefcase, GraduationCap, Link2, Building2, Mail, MessageSquare,
    ShieldCheck, BadgeCheck, CheckCircle2, Circle, Trophy, Sparkles, TrendingUp,
    Lock, Globe, Award, Phone, FileText, ExternalLink, Clock, Target, Rocket, Handshake
} from 'lucide-react';
import ProfileInfoSection from '@/app/components/professional/ProfileInfoSection';
import VerificationBadge from '@/app/components/VerificationBadge';
import InviteButton from '@/app/components/employer/InviteButton';
import CopyableText from '@/app/components/ui/CopyableText';
import ProfileViewTracker from '@/app/components/shared/ProfileViewTracker';

export const dynamic = 'force-dynamic';

// ────────────────────────────────────────────────────
// Verification Score Mini-Calculator (server-side)
// ────────────────────────────────────────────────────
async function getVerificationData(userId: string) {
    const checks: { label: string; icon: string; status: 'verified' | 'partial' | 'unverified'; detail: string }[] = [];

    // 1. Identity — badge_type
    const { data: user } = await supabaseAdmin.schema('professional').from('users').select('badge_type, two_factor_enabled').eq('id', userId).single();
    const badge = user?.badge_type || 'none';
    checks.push({
        label: 'Identity',
        icon: 'shield',
        status: badge === 'gold' ? 'verified' : badge === 'blue' ? 'partial' : 'unverified',
        detail: badge === 'gold' ? 'Gold verified identity' : badge === 'blue' ? 'Blue verified' : 'Not yet verified',
    });

    // 2. Employment Chain
    const { data: emp } = await supabaseAdmin.schema('professional').from('employment_history').select('id, source').eq('user_id', userId);
    const verifiedEmp = (emp || []).filter((e: any) => e.source === 'employer_verified' || e.source === 'application');
    checks.push({
        label: 'Employment Chain',
        icon: 'briefcase',
        status: verifiedEmp.length > 0 ? (verifiedEmp.length >= (emp?.length || 1) ? 'verified' : 'partial') : 'unverified',
        detail: `${verifiedEmp.length}/${(emp || []).length} roles verified on-chain`,
    });

    // 3. References
    const { data: refs, count: refCount } = await supabaseAdmin.schema('employer').from('references').select('id', { count: 'exact', head: true }).eq('professional_id', userId).eq('status', 'completed');
    checks.push({
        label: 'References',
        icon: 'users',
        status: (refCount || 0) >= 2 ? 'verified' : (refCount || 0) >= 1 ? 'partial' : 'unverified',
        detail: `${refCount || 0} verified references`,
    });

    // 4. Skill Endorsements (AI Radar)
    const { data: radar } = await supabaseAdmin.from('professional_radar_stats').select('depth_score').eq('user_id', userId).single();
    checks.push({
        label: 'Skill Endorsements',
        icon: 'sparkles',
        status: radar ? 'verified' : 'unverified',
        detail: radar ? 'AI-verified skill assessment' : 'No AI analysis yet',
    });

    // 5. Education
    const { data: edu } = await supabaseAdmin.schema('professional').from('education_history').select('id').eq('user_id', userId);
    checks.push({
        label: 'Education',
        icon: 'graduation',
        status: (edu || []).length > 0 ? 'verified' : 'unverified',
        detail: `${(edu || []).length} education entries`,
    });

    // 6. Documents
    const { data: docs } = await supabaseAdmin.schema('professional').from('documents').select('id').eq('user_id', userId);
    const { data: uploads } = await supabaseAdmin.schema('professional').from('uploaded_documents').select('id').eq('user_id', userId);
    const totalDocs = (docs?.length || 0) + (uploads?.length || 0);
    checks.push({
        label: 'Documents',
        icon: 'file',
        status: totalDocs >= 2 ? 'verified' : totalDocs >= 1 ? 'partial' : 'unverified',
        detail: `${totalDocs} supporting documents`,
    });

    // 7. Account Security
    checks.push({
        label: 'Account Security',
        icon: 'lock',
        status: user?.two_factor_enabled ? 'verified' : 'unverified',
        detail: user?.two_factor_enabled ? '2FA enabled' : '2FA not enabled',
    });

    const verified = checks.filter(c => c.status === 'verified').length;
    const partial = checks.filter(c => c.status === 'partial').length;
    const score = Math.round(((verified * 100) + (partial * 50)) / checks.length);

    return { checks, score, verified, partial, total: checks.length };
}

// ────────────────────────────────────────────────────
// Career Score Mini-Calculator (server-side)
// ────────────────────────────────────────────────────
async function getCareerScore(userId: string) {
    // Profile Strength
    const { data: user } = await supabaseAdmin.schema('professional').from('users').select('enc_bio, enc_headline, primary_role, enc_profile_image_url').eq('id', userId).single();
    const { data: skills } = await supabaseAdmin.schema('professional').from('skills').select('id').eq('user_id', userId);
    const { data: emp } = await supabaseAdmin.schema('professional').from('employment_history').select('id').eq('user_id', userId);

    let profileStrength = 0;
    if (user?.enc_profile_image_url) profileStrength += 15;
    if (user?.enc_bio) profileStrength += 15;
    if (user?.enc_headline) profileStrength += 10;
    if (user?.primary_role) profileStrength += 10;
    if ((skills || []).length >= 3) profileStrength += 25;
    if ((emp || []).length > 0) profileStrength += 25;
    profileStrength = Math.min(profileStrength, 100);

    // Skill Power
    const { data: radar } = await supabaseAdmin.from('professional_radar_stats').select('depth_score, execution_speed, collaboration_index, creativity_score').eq('user_id', userId).single();
    const skillPower = radar ? Math.round(((radar.depth_score || 0) + (radar.execution_speed || 0) + (radar.collaboration_index || 0) + (radar.creativity_score || 0)) / 4) : 0;

    // Network
    const { count: followers } = await supabaseAdmin.schema('professional').from('user_follows').select('id', { count: 'exact', head: true }).eq('following_id', userId);
    const networkScore = Math.min(Math.round(Math.log2((followers || 0) + 1) * 15), 100);

    const overall = Math.round(profileStrength * 0.2 + skillPower * 0.25 + networkScore * 0.15 + profileStrength * 0.4);
    const tier = overall >= 80 ? 'legendary' : overall >= 60 ? 'elite' : overall >= 40 ? 'rising' : overall >= 20 ? 'emerging' : 'newcomer';

    return { overall, tier, profileStrength, skillPower, networkScore, followers: followers || 0 };
}

export default async function ViewCandidatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { data: user, error } = await supabaseAdmin
        .schema('professional')
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !user) notFound();

    // Decrypt
    const firstName = decryptData(user.enc_first_name as string) || '';
    const lastName = decryptData(user.enc_last_name as string) || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const profileImage = decryptData(user.enc_profile_image_url as string);
    const headline = decryptData(user.enc_headline as string);
    const bio = decryptData(user.enc_bio as string);
    const cvUrl = decryptData(user.enc_cv_url as string);
    const role = user.primary_role;
    const location = decryptData(user.enc_location as string) || decryptData(user.enc_city as string);
    const email = decryptData(user.enc_email as string);
    const phone = decryptData(user.enc_phone_number as string);
    const intentMode = user.intent_mode;
    const badgeType = user.badge_type;

    const followerCount = await getFollowerCount(id, 'professional');

    // Fetch sections
    const { data: employment } = await supabaseAdmin.schema('professional').from('employment_history').select('*').eq('user_id', id).order('start_date', { ascending: false });
    const { data: education } = await supabaseAdmin.schema('professional').from('education_history').select('*').eq('user_id', id).order('start_date', { ascending: false });
    const { data: skills } = await supabaseAdmin.schema('professional').from('skills').select('*').eq('user_id', id);
    const { data: otherProfiles } = await supabaseAdmin.schema('professional').from('other_profiles').select('*').eq('user_id', id);

    // Verification & Career Score
    const verification = await getVerificationData(id);
    const careerScore = await getCareerScore(id);

    const employmentHistory = employment?.map((e: any) => ({
        ...e, startDate: e.start_date, endDate: e.end_date, isCurrent: e.is_current, source: e.source
    })) || [];

    const educationHistory = education?.map((e: any) => ({
        ...e, startDate: e.start_date, endDate: e.end_date, isCurrent: e.is_current, fieldOfStudy: e.field_of_study
    })) || [];

    const tierConfig: Record<string, { emoji: string; gradient: string; label: string }> = {
        legendary: { emoji: '👑', gradient: 'from-amber-500 to-orange-500', label: 'Legendary' },
        elite: { emoji: '💎', gradient: 'from-indigo-500 to-purple-500', label: 'Elite' },
        rising: { emoji: '🚀', gradient: 'from-emerald-500 to-teal-500', label: 'Rising' },
        emerging: { emoji: '🌱', gradient: 'from-lime-500 to-green-500', label: 'Emerging' },
        newcomer: { emoji: '✨', gradient: 'from-neutral-400 to-neutral-500', label: 'Newcomer' },
    };

    const tier = tierConfig[careerScore.tier] || tierConfig.newcomer;

    return (
        <div className="min-h-screen bg-[#fafbfd] dark:bg-black pb-20">
            <ProfileViewTracker targetId={id} targetType="professional" />

            {/* ── Hero Banner ── */}
            <div className="relative h-56 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-amber-600/10" />
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#fafbfd] dark:from-black to-transparent" />
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-24 space-y-6">

                {/* ── Profile Card ── */}
                <div className="bg-white dark:bg-neutral-900 rounded-[32px] shadow-xl dark:shadow-none border border-neutral-200 dark:border-neutral-800 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="relative shrink-0">
                            <div className="w-32 h-32 md:w-36 md:h-36 rounded-[1.5rem] border-4 border-white dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-800 shadow-lg flex items-center justify-center">
                                {profileImage ? (
                                    <img src={profileImage} alt={fullName} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={56} className="text-neutral-300 dark:text-neutral-600" />
                                )}
                            </div>
                            {badgeType && badgeType !== 'none' && (
                                <div className="absolute -bottom-1 -right-1">
                                    <VerificationBadge tier={badgeType} size={28} />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 w-full">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tight">{fullName}</h1>
                                    <p className="text-lg font-medium text-blue-600 dark:text-blue-400 mt-0.5">{headline || role}</p>
                                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                                        {location && (
                                            <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                                                <MapPin size={12} /> {location}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                                            <User size={12} /> {followerCount} followers
                                        </span>
                                        {intentMode && intentMode !== 'not_looking' && (
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${intentMode === 'actively_looking' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                intentMode === 'open_to_freelance' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                                                    'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                }`}>
                                                {intentMode === 'actively_looking' && <><Target size={10} /> Actively Looking</>}
                                                {intentMode === 'open_to_offers' && <><Briefcase size={10} /> Open to Offers</>}
                                                {intentMode === 'open_to_freelance' && <><Rocket size={10} /> Open to Freelance</>}
                                                {intentMode === 'open_to_cofounder' && <><Handshake size={10} /> Open to Co-found</>}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <InviteButton professionalId={id} professionalName={fullName} />
                                    <a
                                        href={`/employer/notifications?candidateId=${id}`}
                                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-bold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                                    >
                                        <MessageSquare size={16} />
                                        <span className="hidden sm:inline">Message</span>
                                    </a>
                                </div>
                            </div>

                            {/* Contact Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
                                <CopyableText label="Email" text={email} icon={<Mail size={14} />} />
                                {phone && <CopyableText label="Phone" text={phone} icon={<Phone size={14} />} />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── VERIFIED CAREER PROOF ── (replaces CV) */}
                <div className="bg-white dark:bg-neutral-900 rounded-[32px] shadow-xl dark:shadow-none border border-neutral-200 dark:border-neutral-800 p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                            <ShieldCheck size={22} className="text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-black dark:text-white tracking-tight">Verified Career Proof</h2>
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wider">
                                Replaces traditional CVs — every claim is verifiable
                            </p>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <span className={`text-2xl font-black bg-gradient-to-r ${tier.gradient} bg-clip-text text-transparent`}>
                                {careerScore.overall}
                            </span>
                            <span className="text-xs">{tier.emoji}</span>
                        </div>
                    </div>

                    {/* Verification Chain */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        {verification.checks.slice(0, 4).map((check, i) => {
                            const statusColor = check.status === 'verified' ? 'emerald' : check.status === 'partial' ? 'amber' : 'neutral';
                            return (
                                <div key={i} className={`p-3 rounded-2xl border transition-all ${check.status === 'verified' ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10' :
                                    check.status === 'partial' ? 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10' :
                                        'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        {check.status === 'verified' ? (
                                            <CheckCircle2 size={14} className="text-emerald-500" />
                                        ) : check.status === 'partial' ? (
                                            <Clock size={14} className="text-amber-500" />
                                        ) : (
                                            <Circle size={14} className="text-neutral-400 dark:text-neutral-600" />
                                        )}
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{check.label}</span>
                                    </div>
                                    <p className={`text-[9px] ${check.status === 'verified' ? 'text-emerald-600 dark:text-emerald-400' :
                                        check.status === 'partial' ? 'text-amber-600 dark:text-amber-400' :
                                            'text-neutral-400 dark:text-neutral-500'
                                        }`}>{check.detail}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Lower chain */}
                    <div className="grid grid-cols-3 gap-3">
                        {verification.checks.slice(4).map((check, i) => (
                            <div key={i} className={`p-2.5 rounded-xl border flex items-center gap-2 ${check.status === 'verified' ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10' :
                                check.status === 'partial' ? 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10' :
                                    'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50'
                                }`}>
                                {check.status === 'verified' ? (
                                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                ) : check.status === 'partial' ? (
                                    <Clock size={12} className="text-amber-500 shrink-0" />
                                ) : (
                                    <Circle size={12} className="text-neutral-400 dark:text-neutral-600 shrink-0" />
                                )}
                                <div>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">{check.label}</span>
                                    <span className={`text-[8px] ${check.status === 'verified' ? 'text-emerald-600 dark:text-emerald-400' :
                                        check.status === 'partial' ? 'text-amber-600 dark:text-amber-400' :
                                            'text-neutral-400 dark:text-neutral-500'
                                        }`}>{check.detail}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Proof Score Bar */}
                    <div className="mt-5 flex items-center gap-3">
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Proof Score</span>
                                <span className="text-xs font-black text-black dark:text-white">{verification.score}/100</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
                                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500 transition-all duration-1000" style={{ width: `${verification.score}%` }} />
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-lg font-black text-black dark:text-white">{verification.verified}</span>
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">/{verification.total} verified</span>
                        </div>
                    </div>
                </div>

                {/* ── CV (Optional, de-emphasized) ── */}
                {cvUrl && (
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileText size={18} className="text-neutral-400" />
                            <div>
                                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Traditional CV available</span>
                                <span className="text-[9px] text-neutral-400 dark:text-neutral-500 block">Optional — Verified Career Proof is more reliable</span>
                            </div>
                        </div>
                        <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all">
                            View CV
                        </a>
                    </div>
                )}

                {/* ── About ── */}
                {bio && (
                    <div className="bg-white dark:bg-neutral-900 rounded-[32px] shadow-sm dark:shadow-none border border-neutral-200 dark:border-neutral-800 p-6 md:p-8">
                        <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2 mb-4">
                            <User size={18} /> About
                        </h2>
                        <p className="whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">{bio}</p>
                    </div>
                )}

                {/* ── Posts ── */}
                <div className="pt-2">
                    <ProfessionalPostsSection userId={id} initialPosts={[]} />
                </div>

                {/* ── Profile Sections (Employment, Education, Skills, etc.) ── */}
                <ProfileInfoSection
                    isDark={false}
                    readOnly={true}
                    employmentHistory={employmentHistory}
                    education={educationHistory}
                    skills={skills || []}
                    certifications={[]}
                    awards={[]}
                    otherProfiles={otherProfiles || []}
                />
            </div>
        </div>
    );
}
