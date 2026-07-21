import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { resolveOndwiraAccounts } from '@/lib/ondwira-contacts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ConversationListRow = {
  conversation_id: string;
  role: string;
  membership_status: string;
  archived_at: string | null;
  locked_at: string | null;
  muted_until: string | null;
  conversations: { id: string; kind: 'direct' | 'group'; title: string | null; created_at: string; updated_at: string; disappearing_seconds: number | null };
};

export async function GET() {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .schema('ondwira')
    .from('conversation_members')
    .select('conversation_id, role, membership_status, archived_at, locked_at, muted_until, conversations!inner(id, kind, title, created_at, updated_at, disappearing_seconds)')
    .eq('user_id', session.uid)
    .eq('membership_status', 'accepted')
    .eq('conversations.context', 'social')
    .order('joined_at', { ascending: false });

  if (error) {
    console.error('[ONDWIRA] conversation list failed', error);
    return NextResponse.json({ error: 'Unable to load conversations' }, { status: 500 });
  }

  const conversations = (data ?? []) as unknown as ConversationListRow[];
  const directIds = conversations
    .filter(item => item.conversations.kind === 'direct')
    .map(item => item.conversation_id);
  if (!directIds.length) return NextResponse.json({ conversations });

  const { data: directMembers, error: membersError } = await supabaseAdmin.schema('ondwira')
    .from('conversation_members')
    .select('conversation_id, user_id')
    .in('conversation_id', directIds)
    .eq('membership_status', 'accepted')
    .neq('user_id', session.uid);
  if (membersError) {
    console.error('[ONDWIRA] direct conversation members failed', membersError);
    return NextResponse.json({ error: 'Unable to resolve conversation members' }, { status: 500 });
  }

  const directMemberRows = (directMembers ?? []) as unknown as Array<{ conversation_id: string; user_id: string }>;
  const peerIds = [...new Set<string>(directMemberRows.map(member => member.user_id))];
  const [profiles, accountsResult] = await Promise.all([
    resolveOndwiraAccounts(peerIds),
    peerIds.length
      ? supabaseAdmin.schema('ondwira').from('accounts').select('id, username').in('id', peerIds)
      : Promise.resolve({ data: [] }),
  ]);
  const usernames = new Map<string, string>(((accountsResult.data ?? []) as Array<{ id: string; username: string }>).map(account => [account.id, account.username]));
  const peerByConversation = new Map<string, string>(directMemberRows.map(member => [member.conversation_id, member.user_id]));

  return NextResponse.json({
    conversations: conversations.map(item => {
      const peerId = item.conversations?.kind === 'direct' ? peerByConversation.get(item.conversation_id) : null;
      const profile = peerId ? profiles.get(peerId) : null;
      const username = peerId ? usernames.get(peerId) : null;
      return {
        ...item,
        displayTitle: item.conversations?.kind === 'group' ? item.conversations.title || 'Untitled group' : profile?.name || username || 'Ondwira member',
        displaySubtitle: item.conversations?.kind === 'group' ? 'Social group' : username ? `@${username}` : 'Direct conversation',
        avatarUrl: profile?.avatarUrl || null,
        peerUsername: username || null,
      };
    }),
  });
}

export async function POST(request: Request) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const input = await request.json().catch(() => null) as { kind?: string; title?: string; members?: Array<{ id: string; type: 'professional' | 'employer' }> } | null;
  if (!input || (input.kind !== 'direct' && input.kind !== 'group') || !Array.isArray(input.members)) {
    return NextResponse.json({ error: 'Invalid conversation request' }, { status: 400 });
  }
  if (input.members.length > 100) {
    return NextResponse.json({ error: 'A group can include up to 100 people during this rollout.' }, { status: 400 });
  }

  const requestedIds = [...new Set(input.members.map(member => member.id).filter(id => typeof id === 'string' && id !== session.uid))];
  const [{ data: activeAccounts }, { data: identities }] = await Promise.all([
    requestedIds.length
      ? supabaseAdmin.schema('ondwira').from('accounts').select('id').in('id', requestedIds).eq('status', 'active')
      : Promise.resolve({ data: [] }),
    requestedIds.length
      ? supabaseAdmin.schema('ondwira').from('account_identities').select('account_id, identity_type').in('account_id', requestedIds).in('identity_type', ['professional', 'employer'])
      : Promise.resolve({ data: [] }),
  ]);
  const activeIds = new Set((activeAccounts ?? []).map((account: { id: string }) => account.id));
  const verifiedTypes = new Map<string, 'professional' | 'employer'>();
  (identities ?? []).forEach((identity: { account_id: string; identity_type: string }) => {
    if (activeIds.has(identity.account_id) && (identity.identity_type === 'professional' || !verifiedTypes.has(identity.account_id))) {
      verifiedTypes.set(identity.account_id, identity.identity_type as 'professional' | 'employer');
    }
  });
  if (verifiedTypes.size !== requestedIds.length) {
    return NextResponse.json({ error: 'One or more selected accounts are unavailable.' }, { status: 400 });
  }

  const uniqueMembers = new Map([...verifiedTypes].map(([id, type]) => [id, { id, type }]));
  uniqueMembers.set(session.uid, { id: session.uid, type: session.schema });
  if ((input.kind === 'direct' && uniqueMembers.size !== 2) || (input.kind === 'group' && uniqueMembers.size < 2)) {
    return NextResponse.json({ error: 'Choose valid conversation members' }, { status: 400 });
  }

  const { data: conversation, error: conversationError } = await supabaseAdmin
    .schema('ondwira')
    .from('conversations')
    .insert({ kind: input.kind, context: 'social', title: input.kind === 'group' ? input.title?.trim().slice(0, 120) || null : null, created_by: session.uid })
    .select('id, kind, title, created_at')
    .single();

  if (conversationError || !conversation) {
    console.error('[ONDWIRA] conversation creation failed', conversationError);
    return NextResponse.json({ error: 'Unable to create conversation' }, { status: 500 });
  }

  const members = [...uniqueMembers.values()].map((member) => ({
    conversation_id: conversation.id,
    user_id: member.id,
    account_type: member.type,
    role: member.id === session.uid ? 'owner' : 'member',
    membership_status: member.id === session.uid ? 'accepted' : input.kind === 'group' ? 'pending' : 'accepted',
  }));
  const { error: membersError } = await supabaseAdmin.schema('ondwira').from('conversation_members').insert(members);
  if (membersError) {
    await supabaseAdmin.schema('ondwira').from('conversations').delete().eq('id', conversation.id);
    console.error('[ONDWIRA] conversation members failed', membersError);
    return NextResponse.json({ error: 'Unable to add conversation members' }, { status: 500 });
  }

  return NextResponse.json({ conversation }, { status: 201 });
}
