import { supabaseAdmin } from '@/lib/supabase';

export type ChatContext = 'social' | 'work';

export async function getConversationAccess(conversationId: string, userId: string) {
  const { data: member } = await supabaseAdmin
    .schema('ondwira')
    .from('conversation_members')
    .select('conversation_id, role, muted_until, locked_at')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .eq('membership_status', 'accepted')
    .maybeSingle();

  if (!member) return null;

  const { data: conversation } = await supabaseAdmin
    .schema('ondwira')
    .from('conversations')
    .select('id, context, kind, title, disappearing_seconds, view_once_default')
    .eq('id', conversationId)
    .maybeSingle();

  if (!conversation) return null;
  return { member, conversation };
}

export async function createAttachmentUrl(storagePath: string) {
  const { data } = await supabaseAdmin.storage.from('ondwira-chat').createSignedUrl(storagePath, 60 * 10);
  return data?.signedUrl ?? null;
}

export async function isConversationBlocked(conversationId: string, userId: string) {
  const { data: members } = await supabaseAdmin
    .schema('ondwira')
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('membership_status', 'accepted')
    .neq('user_id', userId);
  const otherIds = ((members ?? []) as Array<{ user_id: string }>).map(member => member.user_id);
  if (!otherIds.length) return false;

  const [blockedByMe, blockedByThem] = await Promise.all([
    supabaseAdmin.schema('ondwira').from('blocked_accounts').select('id').eq('blocker_id', userId).in('blocked_id', otherIds).limit(1),
    supabaseAdmin.schema('ondwira').from('blocked_accounts').select('id').in('blocker_id', otherIds).eq('blocked_id', userId).limit(1),
  ]);
  return Boolean(blockedByMe.data?.length || blockedByThem.data?.length);
}

export function safeJson<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
