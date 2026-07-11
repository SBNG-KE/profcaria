import { del, put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData, encryptData } from '@/lib/security';
import { sanitizeFilename } from '@/lib/file-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const kinds = new Set(['cv', 'cover_letter', 'certificate', 'contract', 'portfolio', 'identity', 'note', 'other']);
const allowedTypes = new Set(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png', 'image/webp']);

export async function GET(request: Request) {
  const session = await getOndwiraSession(); if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('id');
  let query = supabaseAdmin.schema('ondwira').from('documents').select('id, enc_title, document_kind, source_type, enc_content, enc_file_url, enc_external_url, mime_type, file_size, credential_issuer, credential_id, issued_at, expires_at, agent_readable, created_at, updated_at').eq('owner_id', session.uid).is('archived_at', null).order('updated_at', { ascending: false });
  if (id) query = query.eq('id', id);
  const { data, error } = await query; if (error) return NextResponse.json({ error: 'Unable to load documents' }, { status: 500 });
  const documents = (data ?? []).map((doc: { enc_title: string; enc_content: string | null; enc_file_url: string | null; enc_external_url: string | null; [key: string]: unknown }) => ({ ...doc, title: decryptData(doc.enc_title), content: decryptData(doc.enc_content), fileUrl: decryptData(doc.enc_file_url), externalUrl: decryptData(doc.enc_external_url), enc_title: undefined, enc_content: undefined, enc_file_url: undefined, enc_external_url: undefined }));
  return NextResponse.json(id ? { document: documents[0] ?? null } : { documents });
}

export async function POST(request: Request) {
  const session = await getOndwiraSession(); if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const contentType = request.headers.get('content-type') || '';
  let record: Record<string, unknown>;
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData(); const file = form.get('file'); const title = String(form.get('title') || '').trim().slice(0, 160); const kind = String(form.get('kind') || 'other');
    if (!(file instanceof File) || !title || !kinds.has(kind)) return NextResponse.json({ error: 'Valid file, title, and type are required' }, { status: 400 });
    if (!allowedTypes.has(file.type) || file.size > 20 * 1024 * 1024 || file.size < 1) return NextResponse.json({ error: 'Use a PDF, Word, text, JPG, PNG, or WEBP file up to 20MB' }, { status: 400 });
    const blob = await put(`ondwira/documents/${session.uid}/${sanitizeFilename(file.name)}`, file, { access: 'public', addRandomSuffix: true });
    record = { owner_id: session.uid, enc_title: encryptData(title), document_kind: kind, source_type: 'upload', enc_file_url: encryptData(blob.url), mime_type: file.type, file_size: file.size };
  } else {
    const input = await request.json().catch(() => null) as { title?: string; kind?: string; content?: string; externalUrl?: string; credentialIssuer?: string; credentialId?: string; issuedAt?: string; expiresAt?: string; agentReadable?: boolean } | null;
    const title = input?.title?.trim().slice(0, 160); const kind = input?.kind || 'note'; const content = input?.content?.trim(); const externalUrl = input?.externalUrl?.trim();
    if (!title || !kinds.has(kind) || (!content && !externalUrl)) return NextResponse.json({ error: 'Title and written content or a link are required' }, { status: 400 });
    if (externalUrl) { try { const url = new URL(externalUrl); if (!['http:', 'https:'].includes(url.protocol)) throw new Error(); } catch { return NextResponse.json({ error: 'Use a valid https link' }, { status: 400 }); } }
    record = { owner_id: session.uid, enc_title: encryptData(title), document_kind: kind, source_type: externalUrl ? 'linked' : 'written', enc_content: content ? encryptData(content.slice(0, 200000)) : null, enc_external_url: externalUrl ? encryptData(externalUrl) : null, credential_issuer: input?.credentialIssuer?.trim().slice(0, 160) || null, credential_id: input?.credentialId?.trim().slice(0, 160) || null, issued_at: input?.issuedAt || null, expires_at: input?.expiresAt || null, agent_readable: Boolean(input?.agentReadable) };
  }
  const { data, error } = await supabaseAdmin.schema('ondwira').from('documents').insert(record).select('id, document_kind, source_type, created_at').single();
  if (error || !data) return NextResponse.json({ error: 'Unable to save document' }, { status: 500 });
  return NextResponse.json({ document: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await getOndwiraSession(); if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('id'); if (!id) return NextResponse.json({ error: 'Document id is required' }, { status: 400 });
  const { data } = await supabaseAdmin.schema('ondwira').from('documents').select('enc_file_url').eq('id', id).eq('owner_id', session.uid).maybeSingle();
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const fileUrl = decryptData(data.enc_file_url); if (fileUrl) await del(fileUrl).catch(error => console.error('[ONDWIRA] Blob deletion failed', error));
  await supabaseAdmin.schema('ondwira').from('documents').update({ archived_at: new Date().toISOString() }).eq('id', id).eq('owner_id', session.uid);
  return NextResponse.json({ success: true });
}
