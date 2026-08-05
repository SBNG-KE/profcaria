import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getProfcariaSession } from '@/lib/profcaria-auth';
import { decryptData, encryptData } from '@/lib/security';
import { createAttachmentUrl, getConversationAccess, isConversationBlocked, safeJson } from '@/lib/profcaria-chat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RichPayload = {
  question?: string;
  options?: string[];
  allowsMultiple?: boolean;
  closesAt?: string;
  title?: string;
  description?: string;
  location?: string;
  startsAt?: string;
  endsAt?: string;
  meetingUrl?: string;
  name?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  prompt?: string;
};

type MessageInput = {
  body?: string;
  messageType?: 'text' | 'location' | 'contact' | 'poll' | 'event' | 'meeting' | 'ai_action';
  replyToId?: string;
  viewOnce?: boolean;
  payload?: RichPayload;
};

type RawMessage = {
  id: string;
  sender_id: string;
  sender_type: string;
  body: string;
  message_type: string;
  reply_to_id: string | null;
  expires_at: string | null;
  created_at: string;
  edited_at: string | null;
  view_once: boolean;
  payload_ciphertext: string | null;
};

type AttachmentRow = { id: string; message_id: string; storage_path: string; attachment_type: string; encrypted_name: string; mime_type: string; byte_size: number; width: number | null; height: number | null; duration_seconds: number | null; scan_status: string };
type ReactionRow = { message_id: string; user_id: string; emoji: string; created_at: string };
type PollRow = { id: string; message_id: string; encrypted_question: string; allows_multiple: boolean; closes_at: string | null };
type PollOptionRow = { id: string; poll_id: string; encrypted_label: string; position: number };
type VoteRow = { poll_id: string; option_id: string; user_id: string };
type EventRow = { id: string; message_id: string; event_kind: string; encrypted_title: string; encrypted_description: string | null; encrypted_location: string | null; starts_at: string; ends_at: string | null; meeting_url: string | null };
type ReceiptRow = { message_id: string; user_id: string; delivered_at: string | null; read_at: string | null; viewed_at: string | null };

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getProfcariaSession();
  const { id } = await params;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const access = await getConversationAccess(id, session.uid);
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .schema('profcaria')
    .from('messages')
    .select('id, sender_id, sender_type, body, message_type, reply_to_id, expires_at, created_at, edited_at, view_once, payload_ciphertext')
    .eq('conversation_id', id)
    .is('deleted_at', null)
    .is('deleted_for_everyone_at', null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: true })
    .limit(300);
  if (error) return NextResponse.json({ error: 'Unable to load messages' }, { status: 500 });

  const rawMessages = (data ?? []) as RawMessage[];
  const messageIds = rawMessages.map(message => message.id);
  const now = new Date().toISOString();
  const incoming = rawMessages.filter(message => message.sender_id !== session.uid);

  if (incoming.length) {
    await supabaseAdmin.schema('profcaria').from('message_receipts').upsert(
      incoming.map(message => ({ message_id: message.id, user_id: session.uid, delivered_at: now })),
      { onConflict: 'message_id,user_id' },
    );
    await supabaseAdmin.schema('profcaria').from('conversation_members').update({ last_read_at: now }).eq('conversation_id', id).eq('user_id', session.uid);
  }

  if (!messageIds.length) {
    return NextResponse.json({ viewerId: session.uid, context: access.conversation.context, messages: [] });
  }

  const [attachmentsResult, reactionsResult, pollsResult, eventsResult, receiptsResult, membersResult] = await Promise.all([
    supabaseAdmin.schema('profcaria').from('message_attachments').select('id, message_id, storage_path, attachment_type, encrypted_name, mime_type, byte_size, width, height, duration_seconds, scan_status').in('message_id', messageIds).eq('scan_status', 'passed'),
    supabaseAdmin.schema('profcaria').from('message_reactions').select('message_id, user_id, emoji, created_at').in('message_id', messageIds),
    supabaseAdmin.schema('profcaria').from('message_polls').select('id, message_id, encrypted_question, allows_multiple, closes_at').in('message_id', messageIds),
    supabaseAdmin.schema('profcaria').from('message_events').select('id, message_id, event_kind, encrypted_title, encrypted_description, encrypted_location, starts_at, ends_at, meeting_url').in('message_id', messageIds),
    supabaseAdmin.schema('profcaria').from('message_receipts').select('message_id, user_id, delivered_at, read_at, viewed_at').in('message_id', messageIds),
    supabaseAdmin.schema('profcaria').from('conversation_members').select('user_id').eq('conversation_id', id).eq('membership_status', 'accepted'),
  ]);

  const attachmentRows = (attachmentsResult.data ?? []) as AttachmentRow[];
  const reactionRows = (reactionsResult.data ?? []) as ReactionRow[];
  const pollRows = (pollsResult.data ?? []) as PollRow[];
  const eventRows = (eventsResult.data ?? []) as EventRow[];
  const receiptRows = (receiptsResult.data ?? []) as ReceiptRow[];
  const conversationMemberRows = (membersResult.data ?? []) as Array<{ user_id: string }>;
  const pollIds = pollRows.map(row => row.id);
  const [optionsResult, votesResult] = pollIds.length ? await Promise.all([
    supabaseAdmin.schema('profcaria').from('message_poll_options').select('id, poll_id, encrypted_label, position').in('poll_id', pollIds).order('position'),
    supabaseAdmin.schema('profcaria').from('message_poll_votes').select('poll_id, option_id, user_id').in('poll_id', pollIds),
  ]) : [{ data: [] }, { data: [] }];

  const pollOptionRows = (optionsResult.data ?? []) as PollOptionRow[];
  const voteRows = (votesResult.data ?? []) as VoteRow[];
  const attachmentMessageIds = new Set(rawMessages
    .filter(message => !message.view_once || message.sender_id === session.uid)
    .map(message => message.id));
  const attachments = await Promise.all(attachmentRows.filter(attachment => attachmentMessageIds.has(attachment.message_id)).map(async attachment => ({
    id: attachment.id,
    messageId: attachment.message_id,
    type: attachment.attachment_type,
    name: decryptData(attachment.encrypted_name),
    mimeType: attachment.mime_type,
    byteSize: attachment.byte_size,
    width: attachment.width,
    height: attachment.height,
    durationSeconds: attachment.duration_seconds,
    url: await createAttachmentUrl(attachment.storage_path),
  })));

  const receipts = receiptRows;
  const memberIds = conversationMemberRows.map(member => member.user_id);
  const responseMessages = rawMessages.map(message => {
    const myReceipt = receipts.find(receipt => receipt.message_id === message.id && receipt.user_id === session.uid);
    const incomingViewOnce = message.view_once && message.sender_id !== session.uid;
    const viewOnceState = incomingViewOnce ? (myReceipt?.viewed_at ? 'consumed' : 'locked') : null;
    const concealed = viewOnceState === 'locked' || viewOnceState === 'consumed';
    const recipients = memberIds.filter(userId => userId !== message.sender_id);
    const recipientReceipts = receipts.filter(receipt => receipt.message_id === message.id && recipients.includes(receipt.user_id));
    let deliveryStatus: 'sent' | 'delivered' | 'read' | 'viewed' = 'sent';
    if (recipients.length && recipients.every(userId => recipientReceipts.some(receipt => receipt.user_id === userId && receipt.viewed_at))) deliveryStatus = 'viewed';
    else if (recipients.length && recipients.every(userId => recipientReceipts.some(receipt => receipt.user_id === userId && receipt.read_at))) deliveryStatus = 'read';
    else if (recipients.length && recipients.every(userId => recipientReceipts.some(receipt => receipt.user_id === userId && receipt.delivered_at))) deliveryStatus = 'delivered';

    const poll = pollRows.find(row => row.message_id === message.id);
    const event = eventRows.find(row => row.message_id === message.id);
    const payloadText = message.payload_ciphertext ? decryptData(message.payload_ciphertext) : null;
    return {
      id: message.id,
      sender_id: message.sender_id,
      sender_type: message.sender_type,
      body: concealed ? '' : decryptData(message.body),
      message_type: message.message_type,
      reply_to_id: message.reply_to_id,
      expires_at: message.expires_at,
      created_at: message.created_at,
      edited_at: message.edited_at,
      view_once: message.view_once,
      hidden: viewOnceState === 'consumed',
      view_once_state: viewOnceState,
      read_by_viewer: Boolean(myReceipt?.read_at),
      delivery_status: deliveryStatus,
      payload: concealed ? null : safeJson<RichPayload>(payloadText),
      attachments: concealed ? [] : attachments.filter(attachment => attachment.messageId === message.id),
      reactions: reactionRows.filter(reaction => reaction.message_id === message.id).map(reaction => ({ emoji: reaction.emoji, userId: reaction.user_id, mine: reaction.user_id === session.uid })),
      poll: poll ? {
        id: poll.id,
        question: decryptData(poll.encrypted_question),
        allowsMultiple: poll.allows_multiple,
        closesAt: poll.closes_at,
        options: pollOptionRows.filter(option => option.poll_id === poll.id).map(option => ({
          id: option.id,
          label: decryptData(option.encrypted_label),
          votes: voteRows.filter(vote => vote.option_id === option.id).length,
          mine: voteRows.some(vote => vote.option_id === option.id && vote.user_id === session.uid),
        })),
      } : null,
      event: event ? {
        id: event.id,
        kind: event.event_kind,
        title: decryptData(event.encrypted_title),
        description: event.encrypted_description ? decryptData(event.encrypted_description) : null,
        location: event.encrypted_location ? decryptData(event.encrypted_location) : null,
        startsAt: event.starts_at,
        endsAt: event.ends_at,
        meetingUrl: event.meeting_url ? decryptData(event.meeting_url) : null,
      } : null,
    };
  });

  return NextResponse.json({ viewerId: session.uid, context: access.conversation.context, messages: responseMessages });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getProfcariaSession();
  const { id } = await params;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const access = await getConversationAccess(id, session.uid);
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (access.conversation.context === 'social' && access.conversation.kind === 'direct' && await isConversationBlocked(id, session.uid)) {
    return NextResponse.json({ error: 'Messaging is unavailable for this blocked contact' }, { status: 403 });
  }

  const input = await request.json().catch(() => null) as MessageInput | null;
  const messageType = input?.messageType ?? 'text';
  if (messageType !== 'text') return NextResponse.json({ error: 'Profcaria chat accepts text, HTTPS links, checked documents and checked pictures only.' }, { status: 400 });

  const body = input?.body?.trim() || '';
  if (!body || body.length > 8000) return NextResponse.json({ error: 'Message must be between 1 and 8,000 characters' }, { status: 400 });

  const expiresAt = access.conversation.disappearing_seconds
    ? new Date(Date.now() + access.conversation.disappearing_seconds * 1000).toISOString()
    : null;
  const { data, error } = await supabaseAdmin
    .schema('profcaria')
    .from('messages')
    .insert({
      conversation_id: id,
      sender_id: session.uid,
      sender_type: session.schema,
      body: encryptData(body),
      message_type: messageType,
      reply_to_id: input?.replyToId ?? null,
      expires_at: expiresAt,
      view_once: false,
      payload_ciphertext: null,
    })
    .select('id, sender_id, sender_type, message_type, reply_to_id, expires_at, created_at, view_once')
    .single();
  if (error || !data) return NextResponse.json({ error: 'Unable to send message' }, { status: 500 });

  await supabaseAdmin.schema('profcaria').from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', id);
  return NextResponse.json({ message: { ...data, body, payload: null, delivery_status: 'sent', reactions: [], attachments: [], poll: null, event: null } }, { status: 201 });
}
