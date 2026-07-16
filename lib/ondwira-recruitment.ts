/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomBytes } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData, encryptData } from '@/lib/security';
import { calculateRoleSimilarity } from '@/lib/role-similarity';
import { extractSkillsFromText } from '@/lib/skills-matching';

export const MANAGER_ROLES = new Set(['owner', 'admin', 'manager']);
export const APPLICATION_STATUSES = [
  'submitted', 'screening', 'needs_review', 'on_hold', 'shortlisted',
  'interview', 'offer', 'offer_accepted', 'offer_declined', 'hired',
  'rejected', 'withdrawn', 'employment_ended',
] as const;

export async function getOrganizationMembership(organizationId: string, userId: string) {
  const { data } = await supabaseAdmin.schema('ondwira').from('organization_members')
    .select('organization_id, user_id, role, status, account_type')
    .eq('organization_id', organizationId).eq('user_id', userId).maybeSingle();
  return data;
}

export async function requireOrganizationManager(organizationId: string, userId: string) {
  const member = await getOrganizationMembership(organizationId, userId);
  return member?.status === 'active' && MANAGER_ROLES.has(member.role) ? member : null;
}

export function cleanText(value: unknown, max = 5000) {
  return typeof value === 'string' ? value.trim().replace(/\r\n/g, '\n').slice(0, max) : '';
}

export function cleanTags(value: unknown, max = 30) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(item => cleanText(item, 60).toLowerCase()).filter(Boolean))].slice(0, max);
}

export function makeJobCode() {
  return `OND-${new Date().getUTCFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export function makeShareCode() {
  return randomBytes(18).toString('base64url');
}

export function decryptJob(job: any) {
  return {
    id: job.id,
    organizationId: job.organization_id,
    organization: job.organizations?.name ? { id: job.organization_id, name: job.organizations.name } : undefined,
    jobCode: job.job_code,
    shareSlug: job.share_slug,
    title: decryptData(job.enc_title) || 'Untitled role',
    summary: decryptData(job.enc_summary) || '',
    description: decryptData(job.enc_description) || '',
    location: decryptData(job.enc_location) || '',
    requirements: decryptData(job.enc_requirements) || '',
    benefits: decryptData(job.enc_benefits) || '',
    compensation: decryptData(job.enc_compensation) || '',
    roleCategory: job.role_category,
    skillTags: job.skill_tags ?? [],
    employmentType: job.employment_type,
    locationType: job.location_type,
    seniority: job.seniority,
    status: job.status,
    visibility: job.visibility,
    applicationMode: job.application_mode,
    applicationLimit: job.application_limit,
    applicationCount: job.application_count ?? 0,
    hiredCount: job.hired_count ?? 0,
    blindReview: Boolean(job.blind_review),
    allowReferrals: Boolean(job.allow_referrals),
    allowInternalCandidates: Boolean(job.allow_internal_candidates),
    publishedAt: job.published_at,
    closesAt: job.closes_at,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
  };
}

export async function addStageEvent(input: {
  applicationId: string;
  fromStatus?: string | null;
  toStatus: string;
  actorId?: string | null;
  actorScope: 'applicant' | 'organization' | 'system' | 'ai';
  reasonCode?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin.schema('ondwira').from('application_stage_events').insert({
    application_id: input.applicationId,
    from_status: input.fromStatus || null,
    to_status: input.toStatus,
    actor_id: input.actorId || null,
    actor_scope: input.actorScope,
    reason_code: input.reasonCode || null,
    enc_note: input.note ? encryptData(input.note) : null,
    metadata: input.metadata ?? {},
  });
  if (error) throw error;
}

function yearsBetween(start: string | null, end: string | null) {
  if (!start) return 0;
  const from = new Date(start).getTime();
  const to = end ? new Date(end).getTime() : Date.now();
  return Number.isFinite(from) && Number.isFinite(to) && to > from ? (to - from) / 31_557_600_000 : 0;
}

export async function evaluateApplication(applicationId: string) {
  const { data: application, error } = await supabaseAdmin.schema('ondwira').from('applications')
    .select('id, applicant_id, status, job_id, jobs(*, job_screening_profiles(*))')
    .eq('id', applicationId).single();
  if (error || !application) throw error || new Error('Application not found');
  const job = application.jobs as any;
  const policy = Array.isArray(job.job_screening_profiles) ? job.job_screening_profiles[0] : job.job_screening_profiles;
  if (!policy || policy.mode === 'off') {
    await supabaseAdmin.schema('ondwira').from('applications').update({
      screening_status: 'not_requested', screening_score: null, screening_recommendation: null,
    }).eq('id', applicationId);
    return { score: null, recommendation: null, nextStatus: application.status };
  }

  const [{ data: answers }, { data: documentRows }, { data: employment }] = await Promise.all([
    supabaseAdmin.schema('ondwira').from('application_answers')
      .select('enc_answer, passed_knockout, awarded_score, job_questions(score_weight, knockout)')
      .eq('application_id', applicationId),
    supabaseAdmin.schema('ondwira').from('application_documents')
      .select('document_kind, documents(enc_content, credential_issuer, credential_id)')
      .eq('application_id', applicationId).is('access_revoked_at', null),
    supabaseAdmin.schema('ondwira').from('employment_records')
      .select('title, started_at, ended_at, verification_status')
      .eq('user_id', application.applicant_id),
  ]);

  const answerText = (answers ?? []).map((answer: any) => decryptData(answer.enc_answer) || '').join(' ');
  const documentText = (documentRows ?? []).map((row: any) => decryptData(row.documents?.enc_content) || '').join(' ');
  const employmentText = (employment ?? []).map((record: any) => record.title).join(' ');
  const candidateText = `${answerText} ${documentText} ${employmentText}`.toLowerCase();
  const candidateSkills = extractSkillsFromText(candidateText);
  const requiredSkills = cleanTags(policy.required_skills);
  const preferredSkills = cleanTags(policy.preferred_skills);
  const matchedRequired = requiredSkills.filter(skill => candidateText.includes(skill) || candidateSkills.includes(skill));
  const missingRequired = requiredSkills.filter(skill => !matchedRequired.includes(skill));
  const matchedPreferred = preferredSkills.filter(skill => candidateText.includes(skill) || candidateSkills.includes(skill));
  const requiredDocs = cleanTags(policy.required_document_kinds);
  const suppliedDocs = new Set((documentRows ?? []).map((row: any) => row.document_kind));
  const missingDocuments = requiredDocs.filter(kind => !suppliedDocs.has(kind));
  const verifiedHistory = (employment ?? []).filter((record: any) => record.verification_status === 'verified');
  const years = (employment ?? []).reduce((sum: number, record: any) => sum + yearsBetween(record.started_at, record.ended_at), 0);
  const knockoutFailed = (answers ?? []).some((answer: any) => answer.job_questions?.knockout && answer.passed_knockout === false);

  let score = 35;
  if (requiredSkills.length) score += 30 * (matchedRequired.length / requiredSkills.length);
  else score += Math.min(15, calculateRoleSimilarity(employmentText, decryptData(job.enc_title) || '') * 0.15);
  if (preferredSkills.length) score += 10 * (matchedPreferred.length / preferredSkills.length);
  if (requiredDocs.length) score += 10 * ((requiredDocs.length - missingDocuments.length) / requiredDocs.length);
  else score += 5;
  if (policy.minimum_years != null) score += years >= Number(policy.minimum_years) ? 10 : Math.max(0, 10 * (years / Math.max(1, Number(policy.minimum_years))));
  else score += Math.min(8, years);
  if (policy.require_verified_history) score += verifiedHistory.length ? 10 : 0;
  else if (verifiedHistory.length) score += 5;
  const answerScore = (answers ?? []).reduce((sum: number, answer: any) => sum + Number(answer.awarded_score || 0), 0);
  score += Math.min(10, answerScore);
  if (knockoutFailed) score = Math.min(score, 20);
  score = Math.max(0, Math.min(100, Math.round(score * 100) / 100));

  let recommendation: 'strong_fit' | 'review' | 'hold' = 'review';
  if (!knockoutFailed && policy.auto_shortlist_score != null && score >= Number(policy.auto_shortlist_score)) recommendation = 'strong_fit';
  if (knockoutFailed || (policy.auto_hold_below_score != null && score < Number(policy.auto_hold_below_score))) recommendation = 'hold';
  const nextStatus = policy.mode === 'triage'
    ? recommendation === 'strong_fit' ? 'shortlisted' : recommendation === 'hold' ? 'on_hold' : 'needs_review'
    : 'needs_review';
  const missingEvidence = [
    ...missingDocuments.map(kind => `document:${kind}`),
    ...(policy.require_verified_history && !verifiedHistory.length ? ['verified_employment_history'] : []),
  ];
  const explanation = [
    matchedRequired.length ? `Matched required skills: ${matchedRequired.join(', ')}.` : '',
    missingRequired.length ? `Missing or unconfirmed skills: ${missingRequired.join(', ')}.` : '',
    missingEvidence.length ? `Missing evidence: ${missingEvidence.join(', ')}.` : '',
    `${years.toFixed(1)} years of recorded experience; ${verifiedHistory.length} verified employment record(s).`,
    knockoutFailed ? 'A job-specific knockout answer needs human review.' : '',
    'Protected personal attributes were not used.',
  ].filter(Boolean).join(' ');

  const { error: evaluationError } = await supabaseAdmin.schema('ondwira').from('application_ai_evaluations').insert({
    application_id: applicationId,
    policy_version: policy.policy_version,
    score,
    recommendation,
    confidence: missingEvidence.length || missingRequired.length ? 68 : 86,
    feature_scores: {
      years: Number(years.toFixed(2)),
      matchedRequired: matchedRequired.length,
      totalRequired: requiredSkills.length,
      matchedPreferred: matchedPreferred.length,
      suppliedDocuments: suppliedDocs.size,
      verifiedHistory: verifiedHistory.length,
      knockoutFailed,
    },
    missing_evidence: missingEvidence,
    matched_skills: [...new Set([...matchedRequired, ...matchedPreferred])],
    missing_skills: missingRequired,
    enc_explanation: encryptData(explanation),
    protected_attributes_excluded: true,
  });
  if (evaluationError) throw evaluationError;
  const previousStatus = application.status;
  const { error: updateError } = await supabaseAdmin.schema('ondwira').from('applications').update({
    status: nextStatus,
    screening_status: 'complete',
    screening_score: score,
    screening_recommendation: recommendation,
    screening_policy_version: policy.policy_version,
    enc_screening_summary: encryptData(explanation),
    first_reviewed_at: nextStatus === 'shortlisted' ? new Date().toISOString() : null,
    shortlisted_at: nextStatus === 'shortlisted' ? new Date().toISOString() : null,
  }).eq('id', applicationId);
  if (updateError) throw updateError;
  await addStageEvent({
    applicationId, fromStatus: previousStatus, toStatus: nextStatus,
    actorScope: 'ai', reasonCode: recommendation, note: explanation,
    metadata: { score, policyVersion: policy.policy_version, humanReviewRequired: policy.human_review_required },
  });
  return { score, recommendation, nextStatus, explanation, missingEvidence, missingSkills: missingRequired };
}

export async function ensureCompanyGroupMembership(input: {
  organizationId: string;
  workerId: string;
  accountType: 'professional' | 'employer';
  actorId: string;
  sourceId: string;
  active: boolean;
}) {
  const now = new Date().toISOString();
  await supabaseAdmin.schema('ondwira').from('organization_members').upsert({
    organization_id: input.organizationId,
    user_id: input.workerId,
    account_type: input.accountType,
    role: 'member',
    status: input.active ? 'active' : 'removed',
    joined_at: input.active ? now : undefined,
    ended_at: input.active ? null : now,
  }, { onConflict: 'organization_id,user_id' });
  const { data: group } = await supabaseAdmin.schema('ondwira').from('work_groups')
    .select('id, conversation_id').eq('organization_id', input.organizationId)
    .eq('group_type', 'company').is('archived_at', null).maybeSingle();
  if (!group) return;
  await supabaseAdmin.schema('ondwira').from('work_group_members').upsert({
    group_id: group.id,
    user_id: input.workerId,
    role: 'member',
    membership_source: 'employment',
    source_id: input.sourceId,
    joined_at: now,
    removed_at: input.active ? null : now,
  }, { onConflict: 'group_id,user_id' });
  if (group.conversation_id) {
    await supabaseAdmin.schema('ondwira').from('conversation_members').upsert({
      conversation_id: group.conversation_id,
      user_id: input.workerId,
      account_type: input.accountType,
      role: 'member',
      membership_status: input.active ? 'accepted' : 'removed',
    }, { onConflict: 'conversation_id,user_id' });
  }
}
