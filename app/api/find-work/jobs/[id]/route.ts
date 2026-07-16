/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { decryptJob, getOrganizationMembership } from '@/lib/ondwira-recruitment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const ref = new URL(request.url).searchParams.get('ref');
  const { data: job } = await supabaseAdmin.schema('ondwira').from('jobs')
    .select('*, organizations(id, name)').eq('id', id).eq('status', 'published').maybeSingle();
  if (!job) return NextResponse.json({ error: 'Role not found.' }, { status: 404 });
  if (job.closes_at && new Date(job.closes_at) <= new Date()) {
    return NextResponse.json({ error: 'Applications for this role have closed.' }, { status: 410 });
  }

  let share: any = null;
  if (ref) {
    const { data } = await supabaseAdmin.schema('ondwira').from('job_shares')
      .select('id, referrer_id, expires_at, revoked_at, click_count').eq('job_id', id).eq('share_code', ref).maybeSingle();
    if (data && !data.revoked_at && (!data.expires_at || new Date(data.expires_at) > new Date())) {
      share = data;
      await Promise.all([
        supabaseAdmin.schema('ondwira').from('job_shares').update({ click_count: Number(data.click_count || 0) + 1 }).eq('id', data.id),
        supabaseAdmin.schema('ondwira').from('job_events').insert({
          job_id: id, organization_id: job.organization_id, share_id: data.id,
          event_type: 'share_opened', visitor_hash: createHash('sha256').update(session.uid).digest('hex'),
        }),
      ]);
    }
  }
  if (job.visibility === 'link_only' && !share) return NextResponse.json({ error: 'This private link is not valid.' }, { status: 404 });
  if (job.visibility === 'organization' && !(await getOrganizationMembership(job.organization_id, session.uid))) {
    return NextResponse.json({ error: 'This role is only open inside the organisation.' }, { status: 403 });
  }

  const [{ data: questions }, { data: application }, { data: documents }] = await Promise.all([
    supabaseAdmin.schema('ondwira').from('job_questions').select('*').eq('job_id', id).order('position'),
    supabaseAdmin.schema('ondwira').from('applications').select('id, status, submitted_at, screening_score, screening_recommendation')
      .eq('job_id', id).eq('applicant_id', session.uid).maybeSingle(),
    supabaseAdmin.schema('ondwira').from('documents')
      .select('id, enc_title, document_kind, source_type, credential_issuer, issued_at, expires_at')
      .eq('owner_id', session.uid).is('archived_at', null).order('updated_at', { ascending: false }),
  ]);
  await supabaseAdmin.schema('ondwira').from('job_events').insert({
    job_id: id, organization_id: job.organization_id, actor_id: session.uid,
    event_type: 'viewed', metadata: { authenticated: true },
  });
  return NextResponse.json({
    job: {
      ...decryptJob(job),
      questions: (questions ?? []).map((question: any) => ({
        id: question.id,
        prompt: decryptData(question.enc_prompt),
        type: question.question_type,
        options: JSON.parse(decryptData(question.enc_options) || '[]'),
        required: question.required,
      })),
    },
    application,
    documents: (documents ?? []).map((document: any) => ({
      id: document.id,
      title: decryptData(document.enc_title),
      kind: document.document_kind,
      sourceType: document.source_type,
      credentialIssuer: document.credential_issuer,
      issuedAt: document.issued_at,
      expiresAt: document.expires_at,
    })),
    shareCode: share ? ref : null,
  });
}
