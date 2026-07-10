import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { decryptData, encryptData } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function canAccess(conversationId: string, userId: string) {
  const { data } = await supabaseAdmin
    .schema('ondwira')
    .from('conversation_members')
    .select('conversation_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .eq('membership_status', 'accepted')
    .maybeSingle();
  return Boolean(data);
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getOndwiraSession();
  const { id } = await params;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await canAccess(id, session.uid))) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .schema('ondwira')
    .from('messages')
    .select('id, sender_id, sender_type, body, message_type, reply_to_id, expires_at, created_at, edited_at')
    .eq('conversation_id', id)
    .is('deleted_at', null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) return NextResponse.json({ error: 'Unable to load messages' }, { status: 500 });

  return NextResponse.json({ viewerId: session.uid, messages: (data ?? []).map((message: { body: string; [key: string]: unknown }) => ({ ...message, body: decryptData(message.body) })) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getOndwiraSession();
  const { id } = await params;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await canAccess(id, session.uid))) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const input = await request.json().catch(() => null) as { body?: string; messageType?: 'text' | 'image' | 'file' | 'audio'; replyToId?: string } | null;
  const body = input?.body?.trim();
  if (!body || body.length > 8000) return NextResponse.json({ error: 'Message must be between 1 and 8,000 characters' }, { status: 400 });

  const { data: conversation } = await supabaseAdmin
    .schema('ondwira')
    .from('conversations')
    .select('disappearing_seconds')
    .eq('id', id)
    .single();
  const expiresAt = conversation?.disappearing_seconds
    ? new Date(Date.now() + conversation.disappearing_seconds * 1000).toISOString()
    : null;

  const { data, error } = await supabaseAdmin
    .schema('ondwira')
    .from('messages')
    .insert({
      conversation_id: id,
      sender_id: session.uid,
      sender_type: session.schema,
      body: encryptData(body),
      message_type: input?.messageType ?? 'text',
      reply_to_id: input?.replyToId ?? null,
      expires_at: expiresAt,
    })
    .select('id, sender_id, sender_type, message_type, expires_at, created_at')
    .single();
  if (error || !data) return NextResponse.json({ error: 'Unable to send message' }, { status: 500 });

  await supabaseAdmin.schema('ondwira').from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', id);
  return NextResponse.json({ message: { ...data, body } }, { status: 201 });
}
