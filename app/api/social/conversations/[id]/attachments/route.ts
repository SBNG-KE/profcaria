import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { encryptData } from '@/lib/security';
import { createAttachmentUrl, getConversationAccess, isConversationBlocked } from '@/lib/ondwira-chat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const allowedKinds = new Set(['image', 'video', 'camera', 'document', 'audio', 'sticker']);
const allowedMime = /^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm)|audio\/(mpeg|mp4|ogg|webm)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|spreadsheetml\.sheet|presentationml\.presentation)|vnd\.ms-excel|vnd\.ms-powerpoint)|text\/plain)$/;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getOndwiraSession();
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
  const viewOnce = String(form?.get('viewOnce')) === 'true';
  if (!(file instanceof File) || !allowedKinds.has(requestedKind)) return NextResponse.json({ error: 'Choose a valid attachment' }, { status: 400 });
  if (!file.size || file.size > 50 * 1024 * 1024) return NextResponse.json({ error: 'Attachments must be smaller than 50 MB' }, { status: 400 });
  if (!allowedMime.test(file.type)) return NextResponse.json({ error: 'This file type is not supported' }, { status: 400 });

  const extension = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) : 'bin';
  const storagePath = `${id}/${session.uid}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension || 'bin'}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabaseAdmin.storage.from('ondwira-chat').upload(storagePath, bytes, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: 'Attachment upload failed' }, { status: 500 });

  const messageType = requestedKind === 'camera' ? 'image' : requestedKind === 'document' ? 'file' : requestedKind;
  const expiresAt = access.conversation.disappearing_seconds ? new Date(Date.now() + access.conversation.disappearing_seconds * 1000).toISOString() : null;
  const { data: message, error: messageError } = await supabaseAdmin.schema('ondwira').from('messages').insert({
    conversation_id: id,
    sender_id: session.uid,
    sender_type: session.schema,
    body: encryptData(caption || file.name),
    message_type: messageType,
    expires_at: expiresAt,
    view_once: viewOnce || access.conversation.view_once_default,
  }).select('id, sender_id, sender_type, message_type, expires_at, created_at, view_once').single();
  if (messageError || !message) {
    await supabaseAdmin.storage.from('ondwira-chat').remove([storagePath]);
    return NextResponse.json({ error: 'Attachment message could not be created' }, { status: 500 });
  }

  const { data: attachment, error: attachmentError } = await supabaseAdmin.schema('ondwira').from('message_attachments').insert({
    message_id: message.id,
    storage_path: storagePath,
    attachment_type: requestedKind,
    encrypted_name: encryptData(file.name),
    mime_type: file.type,
    byte_size: file.size,
  }).select('id').single();
  if (attachmentError || !attachment) {
    await supabaseAdmin.schema('ondwira').from('messages').delete().eq('id', message.id);
    await supabaseAdmin.storage.from('ondwira-chat').remove([storagePath]);
    return NextResponse.json({ error: 'Attachment could not be saved' }, { status: 500 });
  }

  if (requestedKind === 'sticker') {
    await supabaseAdmin.schema('ondwira').from('saved_stickers').insert({ owner_id: session.uid, storage_path: storagePath, encrypted_name: encryptData(file.name) });
  }
  await supabaseAdmin.schema('ondwira').from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', id);
  const url = await createAttachmentUrl(storagePath);
  return NextResponse.json({ message: {
    ...message,
    body: caption || file.name,
    delivery_status: 'sent',
    payload: null,
    reactions: [],
    poll: null,
    event: null,
    attachments: [{ id: attachment.id, messageId: message.id, type: requestedKind, name: file.name, mimeType: file.type, byteSize: file.size, url }],
  } }, { status: 201 });
}
