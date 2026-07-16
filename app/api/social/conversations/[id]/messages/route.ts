import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { decryptData, encryptData } from '@/lib/security';
import { createAttachmentUrl, getConversationAccess, isConversationBlocked, safeJson } from '@/lib/ondwira-chat';

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

type AttachmentRow = { id: string; message_id: string; storage_path: string; attachment_type: string; encrypted_name: string; mime_type: string; byte_size: number; width: number | null; height: number | null; duration_seconds: number | null };
type ReactionRow = { message_id: string; user_id: string; emoji: string; created_at: string };
type PollRow = { id: string; message_id: string; encrypted_question: string; allows_multiple: boolean; closes_at: string | null };
type PollOptionRow = { id: string; poll_id: string; encrypted_label: string; position: number };
type VoteRow = { poll_id: string; option_id: string; user_id: string };
type EventRow = { id: string; message_id: string; event_kind: string; encrypted_title: string; encrypted_description: string | null; encrypted_location: string | null; starts_at: string; ends_at: string | null; meeting_url: string | null };
type ReceiptRow = { message_id: string; user_id: string; delivered_at: string | null; read_at: string | null; viewed_at: string | null };

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getOndwiraSession();
  const { id } = await params;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const access = await getConversationAccess(id, session.uid);
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .schema('ondwira')
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
    await supabaseAdmin.schema('ondwira').from('message_receipts').upsert(
      incoming.map(message => ({ message_id: message.id, user_id: session.uid, delivered_at: now })),
      { onConflict: 'message_id,user_id' },
    );
    await supabaseAdmin.schema('ondwira').from('conversation_members').update({ last_read_at: now }).eq('conversation_id', id).eq('user_id', session.uid);
  }

  if (!messageIds.length) {
    return NextResponse.json({ viewerId: session.uid, context: access.conversation.context, messages: [] });
  }

  const [attachmentsResult, reactionsResult, pollsResult, eventsResult, receiptsResult, membersResult] = await Promise.all([
    supabaseAdmin.schema('ondwira').from('message_attachments').select('id, message_id, storage_path, attachment_type, encrypted_name, mime_type, byte_size, width, height, duration_seconds').in('message_id', messageIds),
    supabaseAdmin.schema('ondwira').from('message_reactions').select('message_id, user_id, emoji, created_at').in('message_id', messageIds),
    supabaseAdmin.schema('ondwira').from('message_polls').select('id, message_id, encrypted_question, allows_multiple, closes_at').in('message_id', messageIds),
    supabaseAdmin.schema('ondwira').from('message_events').select('id, message_id, event_kind, encrypted_title, encrypted_description, encrypted_location, starts_at, ends_at, meeting_url').in('message_id', messageIds),
    supabaseAdmin.schema('ondwira').from('message_receipts').select('message_id, user_id, delivered_at, read_at, viewed_at').in('message_id', messageIds),
    supabaseAdmin.schema('ondwira').from('conversation_members').select('user_id').eq('conversation_id', id).eq('membership_status', 'accepted'),
  ]);

  const attachmentRows = (attachmentsResult.data ?? []) as AttachmentRow[];
  const reactionRows = (reactionsResult.data ?? []) as ReactionRow[];
  const pollRows = (pollsResult.data ?? []) as PollRow[];
  const eventRows = (eventsResult.data ?? []) as EventRow[];
  const receiptRows = (receiptsResult.data ?? []) as ReceiptRow[];
  const conversationMemberRows = (membersResult.data ?? []) as Array<{ user_id: string }>;
  const pollIds = pollRows.map(row => row.id);
  const [optionsResult, votesResult] = pollIds.length ? await Promise.all([
    supabaseAdmin.schema('ondwira').from('message_poll_options').select('id, poll_id, encrypted_label, position').in('poll_id', pollIds).order('position'),
    supabaseAdmin.schema('ondwira').from('message_poll_votes').select('poll_id, option_id, user_id').in('poll_id', pollIds),
  ]) : [{ data: [] }, { data: [] }];

  const pollOptionRows = (optionsResult.data ?? []) as PollOptionRow[];
  const voteRows = (votesResult.data ?? []) as VoteRow[];
  const attachments = await Promise.all(attachmentRows.map(async attachment => ({
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
    const hidden = message.view_once && message.sender_id !== session.uid && Boolean(myReceipt?.viewed_at);
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
      body: hidden ? '' : decryptData(message.body),
      message_type: message.message_type,
      reply_to_id: message.reply_to_id,
      expires_at: message.expires_at,
      created_at: message.created_at,
      edited_at: message.edited_at,
      view_once: message.view_once,
      hidden,
      read_by_viewer: Boolean(myReceipt?.read_at),
      delivery_status: deliveryStatus,
      payload: hidden ? null : safeJson<RichPayload>(payloadText),
      attachments: hidden ? [] : attachments.filter(attachment => attachment.messageId === message.id),
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
  const session = await getOndwiraSession();
  const { id } = await params;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const access = await getConversationAccess(id, session.uid);
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (access.conversation.context === 'social' && access.conversation.kind === 'direct' && await isConversationBlocked(id, session.uid)) {
    return NextResponse.json({ error: 'Messaging is unavailable for this blocked contact' }, { status: 403 });
  }

  const input = await request.json().catch(() => null) as MessageInput | null;
  const messageType = input?.messageType ?? 'text';
  const richTypes = ['location', 'contact', 'poll', 'event', 'meeting', 'ai_action'];
  if (messageType === 'meeting' && access.conversation.context !== 'work') return NextResponse.json({ error: 'Meetings can only be created in Work chats' }, { status: 400 });
  if (messageType !== 'text' && !richTypes.includes(messageType)) return NextResponse.json({ error: 'Unsupported message type' }, { status: 400 });

  const payload = input?.payload ?? {};
  const body = input?.body?.trim() || payload.question?.trim() || payload.title?.trim() || (messageType === 'location' ? 'Shared a location' : messageType === 'contact' ? 'Shared a contact' : 'Rich message');
  if (!body || body.length > 8000) return NextResponse.json({ error: 'Message must be between 1 and 8,000 characters' }, { status: 400 });

  if (messageType === 'poll' && (!payload.question?.trim() || !payload.options || payload.options.filter(option => option.trim()).length < 2)) {
    return NextResponse.json({ error: 'A poll needs a question and at least two options' }, { status: 400 });
  }
  if (['event', 'meeting'].includes(messageType) && (!payload.title?.trim() || !payload.startsAt || Number.isNaN(Date.parse(payload.startsAt)))) {
    return NextResponse.json({ error: 'A title and valid start time are required' }, { status: 400 });
  }

  const expiresAt = access.conversation.disappearing_seconds
    ? new Date(Date.now() + access.conversation.disappearing_seconds * 1000).toISOString()
    : null;
  const viewOnce = Boolean(input?.viewOnce ?? access.conversation.view_once_default);
  const { data, error } = await supabaseAdmin
    .schema('ondwira')
    .from('messages')
    .insert({
      conversation_id: id,
      sender_id: session.uid,
      sender_type: session.schema,
      body: encryptData(body),
      message_type: messageType,
      reply_to_id: input?.replyToId ?? null,
      expires_at: expiresAt,
      view_once: viewOnce,
      payload_ciphertext: Object.keys(payload).length ? encryptData(JSON.stringify(payload)) : null,
    })
    .select('id, sender_id, sender_type, message_type, reply_to_id, expires_at, created_at, view_once')
    .single();
  if (error || !data) return NextResponse.json({ error: 'Unable to send message' }, { status: 500 });

  if (messageType === 'poll') {
    const { data: poll, error: pollError } = await supabaseAdmin.schema('ondwira').from('message_polls').insert({
      message_id: data.id,
      encrypted_question: encryptData(payload.question!.trim()),
      allows_multiple: Boolean(payload.allowsMultiple),
      closes_at: payload.closesAt && !Number.isNaN(Date.parse(payload.closesAt)) ? new Date(payload.closesAt).toISOString() : null,
    }).select('id').single();
    if (pollError || !poll) {
      await supabaseAdmin.schema('ondwira').from('messages').delete().eq('id', data.id);
      return NextResponse.json({ error: 'Unable to create poll' }, { status: 500 });
    }
    await supabaseAdmin.schema('ondwira').from('message_poll_options').insert(payload.options!.map(option => option.trim()).filter(Boolean).slice(0, 20).map((option, position) => ({ poll_id: poll.id, encrypted_label: encryptData(option), position })));
  }

  if (messageType === 'event' || messageType === 'meeting') {
    const { error: eventError } = await supabaseAdmin.schema('ondwira').from('message_events').insert({
      message_id: data.id,
      event_kind: messageType === 'meeting' ? 'meeting' : access.conversation.context === 'work' ? 'work_event' : 'social_event',
      encrypted_title: encryptData(payload.title!.trim()),
      encrypted_description: payload.description?.trim() ? encryptData(payload.description.trim()) : null,
      encrypted_location: payload.location?.trim() ? encryptData(payload.location.trim()) : null,
      starts_at: new Date(payload.startsAt!).toISOString(),
      ends_at: payload.endsAt && !Number.isNaN(Date.parse(payload.endsAt)) ? new Date(payload.endsAt).toISOString() : null,
      meeting_url: payload.meetingUrl?.trim() ? encryptData(payload.meetingUrl.trim().slice(0, 2000)) : null,
    });
    if (eventError) {
      await supabaseAdmin.schema('ondwira').from('messages').delete().eq('id', data.id);
      return NextResponse.json({ error: 'Unable to create event' }, { status: 500 });
    }
    if (messageType === 'meeting') {
      const { data: group } = await supabaseAdmin.schema('ondwira').from('work_groups')
        .select('id, organization_id').eq('conversation_id', id).is('archived_at', null).maybeSingle();
      if (group) {
        const startsAt = new Date(payload.startsAt!);
        const endsAt = payload.endsAt && !Number.isNaN(Date.parse(payload.endsAt))
          ? new Date(payload.endsAt)
          : new Date(startsAt.getTime() + 60 * 60000);
        const { data: meeting } = await supabaseAdmin.schema('ondwira').from('work_meetings').insert({
          organization_id: group.organization_id,
          work_group_id: group.id,
          conversation_id: id,
          organizer_id: session.uid,
          enc_title: encryptData(payload.title!.trim()),
          enc_agenda: payload.description?.trim() ? encryptData(payload.description.trim()) : null,
          enc_location: payload.location?.trim() ? encryptData(payload.location.trim()) : null,
          enc_meeting_url: payload.meetingUrl?.trim() ? encryptData(payload.meetingUrl.trim().slice(0, 2000)) : null,
          provider: 'custom',
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          timezone: 'Africa/Nairobi',
          reminder_minutes: [10],
        }).select('id').single();
        if (meeting) {
          const { data: members } = await supabaseAdmin.schema('ondwira').from('conversation_members').select('user_id').eq('conversation_id', id).eq('membership_status', 'accepted');
          const participantIds = (members ?? []).map((member: { user_id: string }) => member.user_id);
          await supabaseAdmin.schema('ondwira').from('work_meeting_participants').insert(participantIds.map((userId: string) => ({
            meeting_id: meeting.id,
            user_id: userId,
            participant_role: userId === session.uid ? 'host' : 'required',
            response: userId === session.uid ? 'accepted' : 'pending',
            responded_at: userId === session.uid ? new Date().toISOString() : null,
          })));
          await supabaseAdmin.schema('ondwira').from('work_meeting_reminders').insert(participantIds.map((userId: string) => ({ meeting_id: meeting.id, user_id: userId, reminder_minutes: 10 })));
        }
      }
    }
  }

  await supabaseAdmin.schema('ondwira').from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', id);
  return NextResponse.json({ message: { ...data, body, payload, delivery_status: 'sent', reactions: [], attachments: [], poll: null, event: null } }, { status: 201 });
}
