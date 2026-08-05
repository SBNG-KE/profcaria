import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getProfcariaSession } from '@/lib/profcaria-auth';
import { encryptData } from '@/lib/security';
import { createAttachmentUrl, getConversationAccess, isConversationBlocked } from '@/lib/profcaria-chat';
import { inspectDocument } from '@/lib/document-security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getProfcariaSession();
  const { id } = await params;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const access = await getConversationAccess(id, session.uid);
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (access.conversation.context === 'social' && access.conversation.kind === 'direct' && await isConversationBlocked(id, session.uid)) {
    return NextResponse.json({ error: 'Messaging is unavailable for this blocked contact' }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  const requestedKind = String(form?.get('kind') || 'document');
  const caption = String(form?.get('caption') || '').trim().slice(0, 8000);
  if (!(file instanceof File) || !['document', 'image'].includes(requestedKind)) return NextResponse.json({ error: 'Choose a document or picture.' }, { status: 400 });
  if (!file.size || file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Attachments must be smaller than 8 MB.' }, { status: 400 });
  const baseMimeType = file.type.split(';', 1)[0].trim().toLowerCase();
  const isImage = requestedKind === 'image';
  const scan = isImage ? await inspectImage(file, baseMimeType) : await inspectDocument(file);
  if (!scan.safe) return NextResponse.json({ error: scan.reasons[0] || 'This attachment was blocked by the security inspection.' }, { status: 422 });

  const extension = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) : 'bin';
  const storagePath = `${id}/${session.uid}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension || 'bin'}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabaseAdmin.storage.from('profcaria-documents').upload(storagePath, bytes, { contentType: baseMimeType, upsert: false });
  if (uploadError) return NextResponse.json({ error: 'Attachment upload failed' }, { status: 500 });

  const messageType = isImage ? 'image' : 'file';
  const expiresAt = access.conversation.disappearing_seconds ? new Date(Date.now() + access.conversation.disappearing_seconds * 1000).toISOString() : null;
  const { data: message, error: messageError } = await supabaseAdmin.schema('profcaria').from('messages').insert({
    conversation_id: id,
    sender_id: session.uid,
    sender_type: session.schema,
    body: encryptData(caption || file.name),
    message_type: messageType,
    expires_at: expiresAt,
    view_once: false,
  }).select('id, sender_id, sender_type, message_type, expires_at, created_at, view_once').single();
  if (messageError || !message) {
    await supabaseAdmin.storage.from('profcaria-documents').remove([storagePath]);
    return NextResponse.json({ error: 'Attachment message could not be created' }, { status: 500 });
  }

  const { data: attachment, error: attachmentError } = await supabaseAdmin.schema('profcaria').from('message_attachments').insert({
    message_id: message.id,
    storage_path: storagePath,
    storage_bucket: 'profcaria-documents',
    attachment_type: isImage ? 'image' : 'document',
    encrypted_name: encryptData(file.name),
    mime_type: baseMimeType,
    byte_size: file.size,
    scan_status: 'passed',
    scan_provider: isImage ? 'profcaria-image-signature-v1' : 'profcaria-document-inspector-v1',
    scan_report: { reasons: scan.reasons, charactersRead: scan.extractedText.length },
    scanned_at: new Date().toISOString(),
    released_at: new Date().toISOString(),
  }).select('id').single();
  if (attachmentError || !attachment) {
    await supabaseAdmin.schema('profcaria').from('messages').delete().eq('id', message.id);
    await supabaseAdmin.storage.from('profcaria-documents').remove([storagePath]);
    return NextResponse.json({ error: 'Attachment could not be saved' }, { status: 500 });
  }

  await supabaseAdmin.schema('profcaria').from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', id);
  const url = await createAttachmentUrl(storagePath);
  return NextResponse.json({ message: {
    ...message,
    body: caption || file.name,
    delivery_status: 'sent',
    payload: null,
    reactions: [],
    poll: null,
    event: null,
    attachments: [{ id: attachment.id, messageId: message.id, type: isImage ? 'image' : 'document', name: file.name, mimeType: baseMimeType, byteSize: file.size, url }],
  } }, { status: 201 });
}

async function inspectImage(file: File, mimeType: string) {
  const allowed = new Map([
    ['image/jpeg', ['jpg', 'jpeg']],
    ['image/png', ['png']],
    ['image/webp', ['webp']],
  ]);
  const extension = file.name.toLowerCase().split('.').pop() || '';
  const reasons: string[] = [];
  if (!allowed.get(mimeType)?.includes(extension)) reasons.push('Only real JPG, PNG and WebP pictures are accepted.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  const webp = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if ((mimeType === 'image/jpeg' && !jpeg) || (mimeType === 'image/png' && !png) || (mimeType === 'image/webp' && !webp)) reasons.push('The picture contents do not match its file type.');
  return { safe: reasons.length === 0, reasons, extractedText: '' };
}
