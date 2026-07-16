/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHash, randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData, encryptData } from '@/lib/security';
import { cleanText } from '@/lib/ondwira-recruitment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin.schema('ondwira').from('employment_records')
    .select('id, title, employment_type, status, started_at, ended_at, end_reason, source, enc_organization_name, verification_status, verification_method, verified_at, evidence_document_id, external_reference, source_details, organizations(name)')
    .eq('user_id', session.uid).order('started_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Unable to load job history.' }, { status: 500 });
  const ids = (data ?? []).map((record: any) => record.id);
  const { data: requests } = ids.length
    ? await supabaseAdmin.schema('ondwira').from('employment_verification_requests')
      .select('id, employment_record_id, status, requested_at, expires_at, responded_at').in('employment_record_id', ids)
      .order('requested_at', { ascending: false })
    : { data: [] };
  return NextResponse.json({
    history: (data ?? []).map((record: any) => ({
      ...record,
      organizationName: record.organizations?.name || decryptData(record.enc_organization_name) || 'Organisation',
      enc_organization_name: undefined,
      verificationRequests: (requests ?? []).filter((request: any) => request.employment_record_id === record.id),
    })),
  });
}

export async function POST(request: Request) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const input = await request.json().catch(() => null) as any;
  const title = cleanText(input?.title, 180);
  const organizationName = cleanText(input?.organizationName, 180);
  const startedAt = input?.startedAt && !Number.isNaN(Date.parse(input.startedAt)) ? String(input.startedAt).slice(0, 10) : null;
  const endedAt = input?.endedAt && !Number.isNaN(Date.parse(input.endedAt)) ? String(input.endedAt).slice(0, 10) : null;
  if (!title || !organizationName || !startedAt) {
    return NextResponse.json({ error: 'Role, organisation, and start date are required.' }, { status: 400 });
  }
  if (endedAt && new Date(endedAt) < new Date(startedAt)) {
    return NextResponse.json({ error: 'End date cannot be before the start date.' }, { status: 400 });
  }
  let evidenceDocumentId = null;
  if (input?.evidenceDocumentId) {
    const { data: evidence } = await supabaseAdmin.schema('ondwira').from('documents').select('id')
      .eq('id', input.evidenceDocumentId).eq('owner_id', session.uid).is('archived_at', null).maybeSingle();
    if (!evidence) return NextResponse.json({ error: 'Evidence document was not found.' }, { status: 404 });
    evidenceDocumentId = evidence.id;
  }
  const { data, error } = await supabaseAdmin.schema('ondwira').from('employment_records').insert({
    user_id: session.uid,
    title,
    enc_organization_name: encryptData(organizationName),
    employment_type: cleanText(input?.employmentType, 40) || null,
    status: endedAt ? 'ended' : 'active',
    started_at: startedAt,
    ended_at: endedAt,
    end_reason: endedAt ? cleanText(input?.endReason, 1000) || 'left before Ondwira verification' : null,
    source: 'manual',
    verification_status: evidenceDocumentId ? 'pending' : 'self_declared',
    verification_method: evidenceDocumentId ? 'document' : null,
    evidence_document_id: evidenceDocumentId,
    external_reference: cleanText(input?.externalReference, 300) || null,
    source_details: { importedByOwner: true, addedAt: new Date().toISOString() },
  }).select('id, title, status, verification_status, started_at, ended_at').single();
  if (error || !data) return NextResponse.json({ error: 'Employment history could not be saved.' }, { status: 500 });
  return NextResponse.json({ record: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const input = await request.json().catch(() => null) as any;
  const recordId = cleanText(input?.recordId, 80);
  const action = cleanText(input?.action, 40);
  const { data: record } = await supabaseAdmin.schema('ondwira').from('employment_records')
    .select('*').eq('id', recordId).eq('user_id', session.uid).maybeSingle();
  if (!record) return NextResponse.json({ error: 'Employment record not found.' }, { status: 404 });

  if (action === 'update_manual') {
    if (record.source !== 'manual') return NextResponse.json({ error: 'System-verified history cannot be manually rewritten.' }, { status: 409 });
    const update: Record<string, unknown> = {};
    if (input.title !== undefined) update.title = cleanText(input.title, 180);
    if (input.organizationName !== undefined) update.enc_organization_name = encryptData(cleanText(input.organizationName, 180));
    if (input.employmentType !== undefined) update.employment_type = cleanText(input.employmentType, 40) || null;
    if (input.startedAt !== undefined) update.started_at = input.startedAt || null;
    if (input.endedAt !== undefined) {
      update.ended_at = input.endedAt || null;
      update.status = input.endedAt ? 'ended' : 'active';
    }
    if (!Object.keys(update).length) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
    const { error } = await supabaseAdmin.schema('ondwira').from('employment_records').update(update).eq('id', recordId);
    if (error) return NextResponse.json({ error: 'Employment record could not be updated.' }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'request_verification') {
    if (record.verification_status === 'verified') return NextResponse.json({ error: 'This employment is already verified.' }, { status: 409 });
    const targetName = cleanText(input.targetName, 180) || decryptData(record.enc_organization_name);
    const targetEmail = cleanText(input.targetEmail, 240).toLowerCase();
    if (!targetName || !targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      return NextResponse.json({ error: 'Add the organisation contact name and a valid work email.' }, { status: 400 });
    }
    let evidenceDocumentId = record.evidence_document_id;
    if (input.evidenceDocumentId) {
      const { data: evidence } = await supabaseAdmin.schema('ondwira').from('documents').select('id')
        .eq('id', input.evidenceDocumentId).eq('owner_id', session.uid).is('archived_at', null).maybeSingle();
      if (!evidence) return NextResponse.json({ error: 'Evidence document not found.' }, { status: 404 });
      evidenceDocumentId = evidence.id;
    }
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: verification, error } = await supabaseAdmin.schema('ondwira').from('employment_verification_requests').insert({
      employment_record_id: recordId, requested_by: session.uid,
      enc_target_name: encryptData(targetName), enc_target_email: encryptData(targetEmail),
      evidence_document_id: evidenceDocumentId,
      status: 'sent', token_hash: createHash('sha256').update(token).digest('hex'),
      expires_at: expiresAt,
    }).select('id, status, expires_at').single();
    if (error || !verification) return NextResponse.json({ error: 'Verification request could not be created.' }, { status: 500 });
    await Promise.all([
      supabaseAdmin.schema('ondwira').from('employment_records').update({
        verification_status: 'pending', evidence_document_id: evidenceDocumentId, last_event_at: new Date().toISOString(),
      }).eq('id', recordId),
      supabaseAdmin.schema('ondwira').from('employment_events').insert({
        employment_record_id: recordId, worker_id: session.uid, actor_id: session.uid,
        event_type: 'verification_requested', metadata: { verificationId: verification.id },
      }),
    ]);
    // The token is returned once so an email/agent connector can deliver the verification link.
    return NextResponse.json({ verification, verificationLink: `/verify-employment/${verification.id}?token=${token}` }, { status: 201 });
  }
  return NextResponse.json({ error: 'Unknown employment action.' }, { status: 400 });
}
