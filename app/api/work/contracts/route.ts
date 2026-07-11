import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { supabaseAdmin } from '@/lib/supabase';

async function activeMembership(organizationId: string, userId: string) {
  const { data } = await supabaseAdmin.schema('ondwira').from('organization_members').select('role, status').eq('organization_id', organizationId).eq('user_id', userId).maybeSingle(); return data;
}

export async function GET() {
  const session = await getOndwiraSession(); if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: memberships } = await supabaseAdmin.schema('ondwira').from('organization_members').select('organization_id').eq('user_id', session.uid).eq('status', 'active');
  const orgIds = (memberships ?? []).map((item: { organization_id: string }) => item.organization_id);
  let query = supabaseAdmin.schema('ondwira').from('contracts').select('id, organization_id, worker_id, document_id, status, sent_at, completed_at, created_at, organizations(name), documents(enc_title)');
  query = orgIds.length ? query.or(`worker_id.eq.${session.uid},organization_id.in.(${orgIds.join(',')})`) : query.eq('worker_id', session.uid);
  const { data, error } = await query.order('created_at', { ascending: false }); if (error) return NextResponse.json({ error: 'Unable to load contracts' }, { status: 500 });
  const { decryptData } = await import('@/lib/security');
  return NextResponse.json({ contracts: (data ?? []).map((contract: { documents?: { enc_title?: string } | null; [key: string]: unknown }) => ({ ...contract, title: decryptData(contract.documents?.enc_title), documents: undefined })) });
}

export async function POST(request: Request) {
  const session = await getOndwiraSession(); if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const input = await request.json().catch(() => null) as { organizationId?: string; workerId?: string; documentId?: string } | null;
  if (!input?.organizationId || !input.workerId || !input.documentId) return NextResponse.json({ error: 'Organisation, worker, and contract document are required' }, { status: 400 });
  const member = await activeMembership(input.organizationId, session.uid); if (!member || member.status !== 'active' || !['owner', 'admin', 'manager'].includes(member.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { data: worker } = await supabaseAdmin.schema('ondwira').from('organization_members').select('user_id').eq('organization_id', input.organizationId).eq('user_id', input.workerId).eq('status', 'active').maybeSingle();
  const { data: document } = await supabaseAdmin.schema('ondwira').from('documents').select('id').eq('id', input.documentId).eq('owner_id', session.uid).eq('document_kind', 'contract').maybeSingle();
  if (!worker || !document) return NextResponse.json({ error: 'Worker or contract document not found' }, { status: 404 });
  const now = new Date().toISOString(); const { data, error } = await supabaseAdmin.schema('ondwira').from('contracts').insert({ organization_id: input.organizationId, worker_id: input.workerId, document_id: input.documentId, status: 'sent', sent_at: now, created_by: session.uid }).select('id, status, sent_at').single();
  if (error || !data) return NextResponse.json({ error: 'Unable to send contract' }, { status: 500 }); return NextResponse.json({ contract: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getOndwiraSession(); if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const input = await request.json().catch(() => null) as { contractId?: string; signatureId?: string } | null; if (!input?.contractId || !input.signatureId) return NextResponse.json({ error: 'Contract and signature are required' }, { status: 400 });
  const { data: contract } = await supabaseAdmin.schema('ondwira').from('contracts').select('id, organization_id, worker_id, status').eq('id', input.contractId).maybeSingle(); if (!contract || ['signed', 'declined', 'voided', 'ended'].includes(contract.status)) return NextResponse.json({ error: 'Contract cannot be signed' }, { status: 409 });
  const orgMember = await activeMembership(contract.organization_id, session.uid); const signerRole = contract.worker_id === session.uid ? 'worker' : orgMember?.status === 'active' && ['owner', 'admin', 'manager'].includes(orgMember.role) ? 'organization' : null;
  if (!signerRole) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { data: signature } = await supabaseAdmin.schema('ondwira').from('signatures').select('id, enc_vector_data').eq('id', input.signatureId).eq('owner_id', session.uid).is('revoked_at', null).maybeSingle(); if (!signature) return NextResponse.json({ error: 'Signature not found' }, { status: 404 });
  const { error } = await supabaseAdmin.schema('ondwira').from('contract_signatures').upsert({ contract_id: contract.id, signer_id: session.uid, signature_id: signature.id, signer_role: signerRole, enc_signature_snapshot: signature.enc_vector_data, signed_at: new Date().toISOString() }, { onConflict: 'contract_id,signer_id,signer_role' }); if (error) return NextResponse.json({ error: 'Unable to sign contract' }, { status: 500 });
  const { data: signed } = await supabaseAdmin.schema('ondwira').from('contract_signatures').select('signer_role').eq('contract_id', contract.id); const complete = new Set((signed ?? []).map((item: { signer_role: string }) => item.signer_role)).size >= 2;
  await supabaseAdmin.schema('ondwira').from('contracts').update({ status: complete ? 'signed' : 'partially_signed', completed_at: complete ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq('id', contract.id);
  return NextResponse.json({ success: true, status: complete ? 'signed' : 'partially_signed' });
}
