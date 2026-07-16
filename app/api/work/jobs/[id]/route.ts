/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData, encryptData } from '@/lib/security';
import { cleanTags, cleanText, decryptJob, requireOrganizationManager } from '@/lib/ondwira-recruitment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function loadJob(id: string) {
  const { data } = await supabaseAdmin.schema('ondwira').from('jobs')
    .select('*, organizations(id, name), job_screening_profiles(*)').eq('id', id).maybeSingle();
  return data;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const job = await loadJob(id);
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  const manager = await requireOrganizationManager(job.organization_id, session.uid);
  if (!manager) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  const { data: questions } = await supabaseAdmin.schema('ondwira').from('job_questions')
    .select('*').eq('job_id', id).order('position');
  return NextResponse.json({
    job: {
      ...decryptJob(job),
      questions: (questions ?? []).map((question: any) => ({
        id: question.id,
        prompt: decryptData(question.enc_prompt),
        type: question.question_type,
        options: JSON.parse(decryptData(question.enc_options) || '[]'),
        required: question.required,
        knockout: question.knockout,
        expectedAnswer: question.expected_answer,
        weight: question.score_weight,
      })),
      screening: Array.isArray(job.job_screening_profiles) ? job.job_screening_profiles[0] : job.job_screening_profiles,
    },
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const job = await loadJob(id);
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  const manager = await requireOrganizationManager(job.organization_id, session.uid);
  if (!manager) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const input = await request.json().catch(() => null) as any;
  const update: Record<string, unknown> = {};
  if (input?.title !== undefined) {
    const value = cleanText(input.title, 140);
    if (value.length < 2) return NextResponse.json({ error: 'Use a valid title.' }, { status: 400 });
    update.enc_title = encryptData(value);
  }
  for (const [inputKey, column, max] of [
    ['summary', 'enc_summary', 500], ['description', 'enc_description', 30_000],
    ['location', 'enc_location', 240], ['requirements', 'enc_requirements', 15_000],
    ['benefits', 'enc_benefits', 10_000], ['compensation', 'enc_compensation', 500],
  ] as const) {
    if (input?.[inputKey] !== undefined) {
      const value = cleanText(input[inputKey], max);
      update[column] = value ? encryptData(value) : null;
    }
  }
  if (input?.skillTags !== undefined) update.skill_tags = cleanTags(input.skillTags);
  if (input?.applicationLimit !== undefined) update.application_limit = Number.isInteger(input.applicationLimit) && input.applicationLimit > 0 ? input.applicationLimit : null;
  if (input?.closesAt !== undefined) update.closes_at = input.closesAt ? new Date(input.closesAt).toISOString() : null;
  const allowedStatuses = new Set(['draft', 'published', 'paused', 'closed', 'filled', 'cancelled']);
  if (input?.status !== undefined && allowedStatuses.has(input.status)) {
    update.status = input.status;
    if (input.status === 'published' && !job.published_at) update.published_at = new Date().toISOString();
    if (['closed', 'filled', 'cancelled'].includes(input.status)) update.closed_at = new Date().toISOString();
  }
  if (!Object.keys(update).length) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  const { data, error } = await supabaseAdmin.schema('ondwira').from('jobs').update(update)
    .eq('id', id).select('*, organizations(id, name)').single();
  if (error || !data) return NextResponse.json({ error: 'Job could not be updated.' }, { status: 500 });
  const eventType = update.status && ['published', 'paused', 'closed', 'filled', 'cancelled'].includes(String(update.status))
    ? String(update.status) : 'updated';
  await supabaseAdmin.schema('ondwira').from('job_events').insert({
    job_id: id, organization_id: job.organization_id, actor_id: session.uid,
    event_type: eventType, metadata: { changed: Object.keys(update).filter(key => key !== 'updated_at') },
  });
  return NextResponse.json({ job: decryptJob(data) });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const job = await loadJob(id);
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  const manager = await requireOrganizationManager(job.organization_id, session.uid);
  if (!manager) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (job.status !== 'draft' || job.application_count > 0) {
    return NextResponse.json({ error: 'Published jobs and jobs with applications must be closed, not deleted.' }, { status: 409 });
  }
  const { error } = await supabaseAdmin.schema('ondwira').from('jobs').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Job could not be deleted.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
