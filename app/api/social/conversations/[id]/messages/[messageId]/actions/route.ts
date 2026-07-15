import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { getConversationAccess } from '@/lib/ondwira-chat';

export const dynamic = 'force-dynamic';

type ActionInput = {
  action?: 'react' | 'view' | 'poll_vote' | 'event_response';
  emoji?: string;
  optionId?: string;
  response?: 'going' | 'maybe' | 'declined';
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; messageId: string }> }) {
  const session = await getOndwiraSession();
  const { id, messageId } = await params;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await getConversationAccess(id, session.uid))) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { data: message } = await supabaseAdmin.schema('ondwira').from('messages').select('id, sender_id, view_once').eq('id', messageId).eq('conversation_id', id).is('deleted_at', null).maybeSingle();
  if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

  const input = await request.json().catch(() => null) as ActionInput | null;
  if (input?.action === 'react') {
    const emoji = input.emoji?.trim().slice(0, 16);
    if (!emoji) return NextResponse.json({ error: 'Choose a reaction' }, { status: 400 });
    const { data: existing } = await supabaseAdmin.schema('ondwira').from('message_reactions').select('message_id').eq('message_id', messageId).eq('user_id', session.uid).eq('emoji', emoji).maybeSingle();
    if (existing) await supabaseAdmin.schema('ondwira').from('message_reactions').delete().eq('message_id', messageId).eq('user_id', session.uid).eq('emoji', emoji);
    else await supabaseAdmin.schema('ondwira').from('message_reactions').insert({ message_id: messageId, user_id: session.uid, emoji });
    return NextResponse.json({ active: !existing });
  }

  if (input?.action === 'view') {
    if (message.sender_id === session.uid) return NextResponse.json({ viewed: true });
    const now = new Date().toISOString();
    await supabaseAdmin.schema('ondwira').from('message_receipts').upsert({ message_id: messageId, user_id: session.uid, delivered_at: now, read_at: now, viewed_at: now }, { onConflict: 'message_id,user_id' });
    return NextResponse.json({ viewed: true, viewOnce: message.view_once });
  }

  if (input?.action === 'poll_vote' && input.optionId) {
    const { data: option } = await supabaseAdmin.schema('ondwira').from('message_poll_options').select('id, poll_id, message_polls!inner(message_id, allows_multiple)').eq('id', input.optionId).eq('message_polls.message_id', messageId).maybeSingle();
    if (!option) return NextResponse.json({ error: 'Poll option not found' }, { status: 404 });
    const { data: existing } = await supabaseAdmin.schema('ondwira').from('message_poll_votes').select('option_id').eq('poll_id', option.poll_id).eq('option_id', input.optionId).eq('user_id', session.uid).maybeSingle();
    if (existing) await supabaseAdmin.schema('ondwira').from('message_poll_votes').delete().eq('poll_id', option.poll_id).eq('option_id', input.optionId).eq('user_id', session.uid);
    else {
      const poll = Array.isArray(option.message_polls) ? option.message_polls[0] : option.message_polls;
      if (!poll?.allows_multiple) await supabaseAdmin.schema('ondwira').from('message_poll_votes').delete().eq('poll_id', option.poll_id).eq('user_id', session.uid);
      await supabaseAdmin.schema('ondwira').from('message_poll_votes').insert({ poll_id: option.poll_id, option_id: input.optionId, user_id: session.uid });
    }
    return NextResponse.json({ active: !existing });
  }

  if (input?.action === 'event_response' && input.response) {
    const { data: event } = await supabaseAdmin.schema('ondwira').from('message_events').select('id').eq('message_id', messageId).maybeSingle();
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    await supabaseAdmin.schema('ondwira').from('message_event_responses').upsert({ event_id: event.id, user_id: session.uid, response: input.response, responded_at: new Date().toISOString() }, { onConflict: 'event_id,user_id' });
    return NextResponse.json({ response: input.response });
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
