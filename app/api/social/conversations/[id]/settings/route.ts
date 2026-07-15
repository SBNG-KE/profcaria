import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { encryptData } from '@/lib/security';
import { getConversationAccess } from '@/lib/ondwira-chat';

export const dynamic = 'force-dynamic';

type SettingsInput = {
  action?: 'mute' | 'disappearing' | 'view_once_default' | 'report' | 'block';
  mutedUntil?: string | null;
  seconds?: number | null;
  enabled?: boolean;
  reason?: string;
  accountId?: string;
  messageId?: string;
};

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getOndwiraSession();
  const { id } = await params;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const access = await getConversationAccess(id, session.uid);
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { data: members } = await supabaseAdmin.schema('ondwira').from('conversation_members').select('user_id, role').eq('conversation_id', id).eq('membership_status', 'accepted');
  return NextResponse.json({
    title: access.conversation.title,
    context: access.conversation.context,
    kind: access.conversation.kind,
    disappearingSeconds: access.conversation.disappearing_seconds,
    viewOnceDefault: access.conversation.view_once_default,
    mutedUntil: access.member.muted_until,
    otherMembers: ((members ?? []) as Array<{ user_id: string; role: string }>).filter(member => member.user_id !== session.uid),
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getOndwiraSession();
  const { id } = await params;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const access = await getConversationAccess(id, session.uid);
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const input = await request.json().catch(() => null) as SettingsInput | null;

  if (input?.action === 'mute') {
    const mutedUntil = input.mutedUntil && !Number.isNaN(Date.parse(input.mutedUntil)) ? new Date(input.mutedUntil).toISOString() : null;
    await supabaseAdmin.schema('ondwira').from('conversation_members').update({ muted_until: mutedUntil }).eq('conversation_id', id).eq('user_id', session.uid);
    return NextResponse.json({ mutedUntil });
  }

  if (input?.action === 'disappearing') {
    const allowed = input.seconds === null || [3600, 86400, 604800, 7776000].includes(Number(input.seconds));
    if (!allowed) return NextResponse.json({ error: 'Choose a supported disappearing-message duration' }, { status: 400 });
    if (access.conversation.kind === 'group' && !['owner', 'admin'].includes(access.member.role)) return NextResponse.json({ error: 'Only group admins can change disappearing messages' }, { status: 403 });
    await supabaseAdmin.schema('ondwira').from('conversations').update({ disappearing_seconds: input.seconds }).eq('id', id);
    return NextResponse.json({ seconds: input.seconds });
  }

  if (input?.action === 'view_once_default') {
    await supabaseAdmin.schema('ondwira').from('conversations').update({ view_once_default: Boolean(input.enabled) }).eq('id', id);
    return NextResponse.json({ enabled: Boolean(input.enabled) });
  }

  if (input?.action === 'report') {
    const reason = input.reason?.trim().slice(0, 2000);
    if (!reason) return NextResponse.json({ error: 'Tell us what should be reviewed' }, { status: 400 });
    await supabaseAdmin.schema('ondwira').from('conversation_reports').insert({ conversation_id: id, message_id: input.messageId || null, reporter_id: session.uid, encrypted_reason: encryptData(reason) });
    return NextResponse.json({ reported: true });
  }

  if (input?.action === 'block') {
    if (access.conversation.context !== 'social' || access.conversation.kind !== 'direct' || !input.accountId || input.accountId === session.uid) return NextResponse.json({ error: 'Only a direct Social contact can be blocked' }, { status: 400 });
    const { data: targetMember } = await supabaseAdmin.schema('ondwira').from('conversation_members').select('user_id').eq('conversation_id', id).eq('user_id', input.accountId).eq('membership_status', 'accepted').maybeSingle();
    if (!targetMember) return NextResponse.json({ error: 'That account is not part of this conversation' }, { status: 400 });
    await supabaseAdmin.schema('ondwira').from('blocked_accounts').upsert({ blocker_id: session.uid, blocked_id: input.accountId }, { onConflict: 'blocker_id,blocked_id' });
    return NextResponse.json({ blocked: true });
  }

  return NextResponse.json({ error: 'Unsupported setting' }, { status: 400 });
}
