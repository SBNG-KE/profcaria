import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { getConversationAccess } from '@/lib/ondwira-chat';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getOndwiraSession();
  const { id } = await params;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await getConversationAccess(id, session.uid))) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const input = await request.json().catch(() => null) as { messageIds?: string[] } | null;
  const requestedIds = [...new Set((input?.messageIds ?? []).filter(value => typeof value === 'string'))].slice(0, 300);
  if (!requestedIds.length) return NextResponse.json({ read: 0 });

  const { data: messages } = await supabaseAdmin
    .schema('ondwira')
    .from('messages')
    .select('id')
    .eq('conversation_id', id)
    .neq('sender_id', session.uid)
    .in('id', requestedIds)
    .is('deleted_at', null);
  const messageIds = ((messages ?? []) as Array<{ id: string }>).map(message => message.id);
  if (!messageIds.length) return NextResponse.json({ read: 0 });

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.schema('ondwira').from('message_receipts').upsert(
    messageIds.map(messageId => ({ message_id: messageId, user_id: session.uid, delivered_at: now, read_at: now })),
    { onConflict: 'message_id,user_id' },
  );
  if (error) return NextResponse.json({ error: 'Unable to update message receipts' }, { status: 500 });
  return NextResponse.json({ read: messageIds.length });
}
