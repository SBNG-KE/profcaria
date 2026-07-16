/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData } from '@/lib/security';
import { validateJobCategory } from '@/lib/ai-moderation';
import {
  cleanTags, cleanText, decryptJob,
  makeJobCode, makeShareCode, requireOrganizationManager,
} from '@/lib/ondwira-recruitment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type QuestionInput = {
  prompt?: string;
  type?: string;
  options?: string[];
  required?: boolean;
  knockout?: boolean;
  expectedAnswer?: unknown;
  weight?: number;
};

export async function GET(request: Request) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = new URL(request.url).searchParams.get('organizationId');
  const { data: memberships, error: membershipError } = await supabaseAdmin.schema('ondwira')
    .from('organization_members').select('organization_id, role, status, organizations!inner(id, name)')
    .eq('user_id', session.uid).eq('status', 'active');
  if (membershipError) return NextResponse.json({ error: 'Unable to load workspaces' }, { status: 500 });
  const allowed = (memberships ?? []).filter((item: any) => !organizationId || item.organization_id === organizationId);
  if (organizationId && !allowed.length) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  const organizationIds = allowed.map((item: any) => item.organization_id);
  if (!organizationIds.length) return NextResponse.json({ jobs: [], organizations: [] });

  const { data: rows, error } = await supabaseAdmin.schema('ondwira').from('jobs')
    .select('*, organizations(id, name), job_screening_profiles(*)')
    .in('organization_id', organizationIds).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Unable to load jobs' }, { status: 500 });
  const roleMap = new Map(allowed.map((item: any) => [item.organization_id, item.role]));
  return NextResponse.json({
    organizations: allowed.map((item: any) => ({
      id: item.organization_id, name: item.organizations.name, role: item.role,
      canManage: ['owner', 'admin', 'manager'].includes(item.role),
    })),
    jobs: (rows ?? []).map((row: any) => ({
      ...decryptJob(row),
      canManage: ['owner', 'admin', 'manager'].includes(String(roleMap.get(row.organization_id))),
      screening: Array.isArray(row.job_screening_profiles) ? row.job_screening_profiles[0] : row.job_screening_profiles,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const input = await request.json().catch(() => null) as any;
  const organizationId = cleanText(input?.organizationId, 80);
  const title = cleanText(input?.title, 140);
  const description = cleanText(input?.description, 30_000);
  const summary = cleanText(input?.summary, 500);
  if (!organizationId || !title || title.length < 2 || !description || description.length < 30) {
    return NextResponse.json({ error: 'Workspace, professional title, and a useful role description are required.' }, { status: 400 });
  }
  const manager = await requireOrganizationManager(organizationId, session.uid);
  if (!manager) return NextResponse.json({ error: 'Only workspace managers can create jobs.' }, { status: 403 });
  const moderation = await validateJobCategory(title);
  if (!moderation.valid) return NextResponse.json({ error: moderation.reason || 'Use a valid professional job title.' }, { status: 422 });

  const status = input?.status === 'draft' ? 'draft' : 'published';
  const employmentTypes = new Set(['full_time', 'part_time', 'contract', 'temporary', 'internship', 'apprenticeship', 'freelance']);
  const locationTypes = new Set(['remote', 'hybrid', 'onsite', 'flexible']);
  const seniorities = new Set(['entry', 'junior', 'mid', 'senior', 'lead', 'executive', 'not_specified']);
  const visibilities = new Set(['public', 'link_only', 'organization']);
  const jobCode = makeJobCode();
  const shareSlug = makeShareCode().slice(0, 20);
  const now = new Date().toISOString();
  const closesAt = input?.closesAt ? new Date(input.closesAt) : null;
  if (closesAt && (!Number.isFinite(closesAt.getTime()) || closesAt <= new Date())) {
    return NextResponse.json({ error: 'Closing date must be in the future.' }, { status: 400 });
  }
  const { data: job, error: jobError } = await supabaseAdmin.schema('ondwira').from('jobs').insert({
    organization_id: organizationId,
    created_by: session.uid,
    job_code: jobCode,
    share_slug: shareSlug,
    enc_title: encryptData(title),
    enc_summary: summary ? encryptData(summary) : null,
    enc_description: encryptData(description),
    enc_location: cleanText(input?.location, 240) ? encryptData(cleanText(input.location, 240)) : null,
    enc_requirements: cleanText(input?.requirements, 15_000) ? encryptData(cleanText(input.requirements, 15_000)) : null,
    enc_benefits: cleanText(input?.benefits, 10_000) ? encryptData(cleanText(input.benefits, 10_000)) : null,
    enc_compensation: cleanText(input?.compensation, 500) ? encryptData(cleanText(input.compensation, 500)) : null,
    role_category: cleanText(input?.roleCategory, 100) || null,
    skill_tags: cleanTags(input?.skillTags),
    employment_type: employmentTypes.has(input?.employmentType) ? input.employmentType : 'full_time',
    location_type: locationTypes.has(input?.locationType) ? input.locationType : 'remote',
    seniority: seniorities.has(input?.seniority) ? input.seniority : 'mid',
    status,
    visibility: visibilities.has(input?.visibility) ? input.visibility : 'public',
    application_mode: Array.isArray(input?.questions) && input.questions.length ? 'structured' : 'simple',
    application_limit: Number.isInteger(input?.applicationLimit) && input.applicationLimit > 0 ? Math.min(input.applicationLimit, 100_000) : null,
    blind_review: Boolean(input?.blindReview),
    allow_referrals: input?.allowReferrals !== false,
    allow_internal_candidates: input?.allowInternalCandidates !== false,
    published_at: status === 'published' ? now : null,
    closes_at: closesAt?.toISOString() || null,
  }).select('*, organizations(id, name)').single();
  if (jobError || !job) return NextResponse.json({ error: 'Unable to create the job.' }, { status: 500 });

  const questions = (Array.isArray(input?.questions) ? input.questions : []).slice(0, 12) as QuestionInput[];
  const questionRows = questions.map((question, index) => {
    const prompt = cleanText(question.prompt, 500);
    const type = ['short_text', 'long_text', 'yes_no', 'single_choice', 'multi_choice', 'number', 'date'].includes(question.type || '')
      ? question.type : 'short_text';
    return prompt ? {
      job_id: job.id,
      enc_prompt: encryptData(prompt),
      question_type: type,
      enc_options: Array.isArray(question.options) && question.options.length
        ? encryptData(JSON.stringify(question.options.map(option => cleanText(option, 160)).filter(Boolean).slice(0, 20))) : null,
      required: Boolean(question.required),
      knockout: Boolean(question.knockout) && ['yes_no', 'single_choice', 'number'].includes(type || ''),
      expected_answer: question.expectedAnswer ?? null,
      score_weight: Number.isInteger(question.weight) ? Math.max(0, Math.min(100, Number(question.weight))) : 0,
      position: index,
    } : null;
  }).filter(Boolean);
  if (questionRows.length) {
    const { error } = await supabaseAdmin.schema('ondwira').from('job_questions').insert(questionRows);
    if (error) {
      await supabaseAdmin.schema('ondwira').from('jobs').delete().eq('id', job.id);
      return NextResponse.json({ error: 'The job questions could not be saved.' }, { status: 500 });
    }
  }

  const screening = input?.screening ?? {};
  const { error: screeningError } = await supabaseAdmin.schema('ondwira').from('job_screening_profiles').insert({
    job_id: job.id,
    mode: ['off', 'assist', 'triage'].includes(screening.mode) ? screening.mode : 'assist',
    minimum_review_score: Number.isInteger(screening.minimumReviewScore) ? Math.max(0, Math.min(100, screening.minimumReviewScore)) : 45,
    auto_shortlist_score: Number.isInteger(screening.autoShortlistScore) ? Math.max(0, Math.min(100, screening.autoShortlistScore)) : null,
    auto_hold_below_score: Number.isInteger(screening.autoHoldBelowScore) ? Math.max(0, Math.min(100, screening.autoHoldBelowScore)) : null,
    minimum_years: Number.isFinite(Number(screening.minimumYears)) && Number(screening.minimumYears) >= 0 ? Number(screening.minimumYears) : null,
    required_skills: cleanTags(screening.requiredSkills),
    preferred_skills: cleanTags(screening.preferredSkills),
    required_document_kinds: cleanTags(screening.requiredDocumentKinds, 10),
    require_verified_history: Boolean(screening.requireVerifiedHistory),
    human_review_required: true,
    configured_by: session.uid,
  });
  if (screeningError) {
    await supabaseAdmin.schema('ondwira').from('jobs').delete().eq('id', job.id);
    return NextResponse.json({ error: 'The screening policy could not be saved.' }, { status: 500 });
  }
  await Promise.all([
    supabaseAdmin.schema('ondwira').from('job_collaborators').insert({
      job_id: job.id, user_id: session.uid, access_level: 'owner', added_by: session.uid,
    }),
    supabaseAdmin.schema('ondwira').from('job_events').insert({
      job_id: job.id, organization_id: organizationId, actor_id: session.uid,
      event_type: status === 'published' ? 'published' : 'created', metadata: { jobCode },
    }),
  ]);
  return NextResponse.json({ job: decryptJob(job) }, { status: 201 });
}
