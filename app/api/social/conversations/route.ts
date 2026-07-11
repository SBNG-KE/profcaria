import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getOndwiraSession } from '@/lib/ondwira-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  return NextResponse.json({ conversations: data ?? [] });
}

export async function POST(request: Request) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const input = await request.json().catch(() => null) as { kind?: string; title?: string; members?: Array<{ id: string; type: 'professional' | 'employer' }> } | null;
  if (!input || (input.kind !== 'direct' && input.kind !== 'group') || !Array.isArray(input.members)) {
    return NextResponse.json({ error: 'Invalid conversation request' }, { status: 400 });
  }

  const uniqueMembers = new Map(input.members.map((member) => [member.id, member]));
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
