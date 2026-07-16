/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData, encryptData } from '@/lib/security';
import { resolveOndwiraAccounts } from '@/lib/ondwira-contacts';
import { cleanText } from '@/lib/ondwira-recruitment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function loadVerification(id: string, token: string) {
  if (!token) return null;
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const { data } = await supabaseAdmin.schema('ondwira').from('employment_verification_requests')
    .select('*, employment_records(id, user_id, title, employment_type, started_at, ended_at, enc_organization_name)')
    .eq('id', id).eq('token_hash', tokenHash).maybeSingle();
  if (!data || !['pending', 'sent'].includes(data.status) || (data.expires_at && new Date(data.expires_at) <= new Date())) return null;
  return data;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get('token') || '';
  const verification = await loadVerification(id, token);
  if (!verification) return NextResponse.json({ error: 'This verification link is invalid or expired.' }, { status: 404 });
  const people = await resolveOndwiraAccounts([verification.employment_records.user_id]);
  return NextResponse.json({
    verification: {
      id,
      workerName: people.get(verification.employment_records.user_id)?.name || 'Ondwira member',
      role: verification.employment_records.title,
      organization: decryptData(verification.employment_records.enc_organization_name),
      employmentType: verification.employment_records.employment_type,
      startedAt: verification.employment_records.started_at,
      endedAt: verification.employment_records.ended_at,
      requestedFor: decryptData(verification.enc_target_name),
      expiresAt: verification.expires_at,
    },
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const input = await request.json().catch(() => null) as any;
  const verification = await loadVerification(id, cleanText(input?.token, 200));
  if (!verification) return NextResponse.json({ error: 'This verification link is invalid or expired.' }, { status: 404 });
  if (!['confirmed', 'partially_confirmed', 'declined'].includes(input?.response)) {
    return NextResponse.json({ error: 'Choose confirm, partial confirmation, or decline.' }, { status: 400 });
  }
  const now = new Date().toISOString();
  const recordStatus = input.response === 'confirmed' ? 'verified'
    : input.response === 'partially_confirmed' ? 'partially_verified' : 'disputed';
  await Promise.all([
    supabaseAdmin.schema('ondwira').from('employment_verification_requests').update({
      status: input.response,
      enc_response: cleanText(input.note, 4000) ? encryptData(cleanText(input.note, 4000)) : null,
      responded_at: now,
    }).eq('id', id),
    supabaseAdmin.schema('ondwira').from('employment_records').update({
      verification_status: recordStatus,
      verification_method: input.response === 'confirmed' ? 'organization_confirmation' : null,
      verified_at: input.response === 'confirmed' ? now : null,
      last_event_at: now,
    }).eq('id', verification.employment_record_id),
    supabaseAdmin.schema('ondwira').from('employment_events').insert({
      employment_record_id: verification.employment_record_id,
      worker_id: verification.employment_records.user_id,
      event_type: input.response === 'declined' ? 'verification_disputed' : 'verification_completed',
      effective_at: now,
      enc_details: cleanText(input.note, 4000) ? encryptData(cleanText(input.note, 4000)) : null,
      metadata: { verificationId: id, response: input.response },
    }),
  ]);
  return NextResponse.json({ success: true, verificationStatus: recordStatus });
}
