/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { resolveOndwiraAccounts } from '@/lib/ondwira-contacts';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData } from '@/lib/security';
import { addStageEvent, cleanText, evaluateApplication, getOrganizationMembership } from '@/lib/ondwira-recruitment';

export const runtime = 'nodejs';

function answersEqual(actual: unknown, expected: unknown) {
  if (Array.isArray(actual) || Array.isArray(expected)) {
    const left = Array.isArray(actual) ? actual.map(String).sort() : [String(actual)];
    const right = Array.isArray(expected) ? expected.map(String).sort() : [String(expected)];
    return JSON.stringify(left) === JSON.stringify(right);
  }
  return String(actual ?? '').trim().toLowerCase() === String(expected ?? '').trim().toLowerCase();
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const input = await request.json().catch(() => null) as {
    answers?: Record<string, unknown>; documentIds?: string[]; coverNote?: string; shareCode?: string; consent?: boolean;
  } | null;
  if (!input?.consent) return NextResponse.json({ error: 'Confirm that Ondwira may share the selected evidence for this application.' }, { status: 400 });

  const { data: job } = await supabaseAdmin.schema('ondwira').from('jobs')
    .select('*, organizations(id, name)').eq('id', id).eq('status', 'published').maybeSingle();
  if (!job) return NextResponse.json({ error: 'This role is not accepting applications.' }, { status: 404 });
  if ((job.closes_at && new Date(job.closes_at) <= new Date()) || (job.application_limit && job.application_count >= job.application_limit)) {
    return NextResponse.json({ error: 'Applications for this role have closed.' }, { status: 409 });
  }
  if (job.visibility === 'organization' && !(await getOrganizationMembership(job.organization_id, session.uid))) {
    return NextResponse.json({ error: 'This role is for organisation members only.' }, { status: 403 });
  }
  const { data: existing } = await supabaseAdmin.schema('ondwira').from('applications')
    .select('id').eq('job_id', id).eq('applicant_id', session.uid).maybeSingle();
  if (existing) return NextResponse.json({ error: 'You already applied for this role.' }, { status: 409 });

  let share: any = null;
  if (input.shareCode) {
    const { data } = await supabaseAdmin.schema('ondwira').from('job_shares')
      .select('id, referrer_id, expires_at, revoked_at, application_count').eq('job_id', id).eq('share_code', input.shareCode).maybeSingle();
    if (data && !data.revoked_at && (!data.expires_at || new Date(data.expires_at) > new Date())) share = data;
  }
  if (job.visibility === 'link_only' && !share) return NextResponse.json({ error: 'This private application link is not valid.' }, { status: 404 });

  const [{ data: questions }, { data: ownedDocuments }, { data: history }, people] = await Promise.all([
    supabaseAdmin.schema('ondwira').from('job_questions').select('*').eq('job_id', id).order('position'),
    input.documentIds?.length
      ? supabaseAdmin.schema('ondwira').from('documents').select('id, enc_title, document_kind, credential_issuer, credential_id')
        .eq('owner_id', session.uid).is('archived_at', null).in('id', input.documentIds.slice(0, 20))
      : Promise.resolve({ data: [] }),
    supabaseAdmin.schema('ondwira').from('employment_records')
      .select('id, title, employment_type, status, started_at, ended_at, verification_status, organizations(name)')
      .eq('user_id', session.uid).order('started_at', { ascending: false }),
    resolveOndwiraAccounts([session.uid]),
  ]);
  const answerInput = input.answers ?? {};
  const missingRequired = (questions ?? []).filter((question: any) => {
    const value = answerInput[question.id];
    return question.required && (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length));
  });
  if (missingRequired.length) return NextResponse.json({ error: 'Answer every required job question.' }, { status: 400 });
  const requestedDocumentIds = [...new Set(input.documentIds ?? [])].slice(0, 20);
  if ((ownedDocuments ?? []).length !== requestedDocumentIds.length) {
    return NextResponse.json({ error: 'One or more selected documents are unavailable.' }, { status: 400 });
  }

  const snapshot = {
    name: people.get(session.uid)?.name || 'Ondwira member',
    capturedAt: new Date().toISOString(),
    employment: (history ?? []).map((record: any) => ({
      title: record.title,
      organization: record.organizations?.name || null,
      employmentType: record.employment_type,
      status: record.status,
      startedAt: record.started_at,
      endedAt: record.ended_at,
      verificationStatus: record.verification_status,
    })),
    documentKinds: (ownedDocuments ?? []).map((document: any) => document.document_kind),
  };
  const now = new Date().toISOString();
  const { data: application, error } = await supabaseAdmin.schema('ondwira').from('applications').insert({
    job_id: id,
    organization_id: job.organization_id,
    applicant_id: session.uid,
    source: share ? (share.referrer_id ? 'referral' : 'share') : 'direct',
    share_id: share?.id || null,
    referred_by: share?.referrer_id || null,
    status: 'submitted',
    enc_cover_note: cleanText(input.coverNote, 5000) ? encryptData(cleanText(input.coverNote, 5000)) : null,
    enc_candidate_snapshot: encryptData(JSON.stringify(snapshot)),
    consented_at: now,
    submitted_at: now,
  }).select('id').single();
  if (error || !application) return NextResponse.json({ error: 'The application could not be submitted.' }, { status: 500 });

  try {
    if ((questions ?? []).length) {
      await supabaseAdmin.schema('ondwira').from('application_answers').insert((questions ?? []).map((question: any) => {
        const answer = answerInput[question.id];
        const passed = question.knockout ? answersEqual(answer, question.expected_answer) : null;
        return {
          application_id: application.id,
          question_id: question.id,
          enc_answer: encryptData(typeof answer === 'string' ? answer : JSON.stringify(answer ?? '')),
          passed_knockout: passed,
          awarded_score: passed === true ? question.score_weight : 0,
        };
      }));
    }
    if ((ownedDocuments ?? []).length) {
      await supabaseAdmin.schema('ondwira').from('application_documents').insert((ownedDocuments ?? []).map((document: any) => ({
        application_id: application.id,
        document_id: document.id,
        document_kind: document.document_kind,
        enc_title_snapshot: document.enc_title,
        consented_at: now,
      })));
    }
    await Promise.all([
      addStageEvent({ applicationId: application.id, toStatus: 'submitted', actorId: session.uid, actorScope: 'applicant' }),
      supabaseAdmin.schema('ondwira').from('job_events').insert({
        job_id: id, organization_id: job.organization_id, actor_id: session.uid,
        application_id: application.id, share_id: share?.id || null, event_type: 'application_submitted',
      }),
      share ? supabaseAdmin.schema('ondwira').from('job_shares')
        .update({ application_count: Number(share.application_count || 0) + 1 }).eq('id', share.id) : Promise.resolve(),
    ]);
    const screening = await evaluateApplication(application.id);
    return NextResponse.json({ applicationId: application.id, status: screening.nextStatus, screening }, { status: 201 });
  } catch (applicationError) {
    console.error('[ONDWIRA] Application finalization failed', applicationError);
    await supabaseAdmin.schema('ondwira').from('applications').delete().eq('id', application.id);
    return NextResponse.json({ error: 'The application evidence could not be saved.' }, { status: 500 });
  }
}
