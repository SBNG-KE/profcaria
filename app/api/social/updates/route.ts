import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData, encryptData } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getOndwiraSession(); if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const now = new Date().toISOString();
  const { data: selectedRows } = await supabaseAdmin.schema('ondwira').from('social_update_audience').select('update_id').eq('user_id', session.uid);
  const selectedIds = (selectedRows ?? []).map((row: { update_id: string }) => row.update_id);
  let query = supabaseAdmin.schema('ondwira').from('social_updates').select('id, author_id, author_type, enc_body, audience_mode, allow_replies, expires_at, created_at').gt('expires_at', now).is('deleted_at', null).order('created_at', { ascending: false }).limit(100);
  if (selectedIds.length) query = query.or(`author_id.eq.${session.uid},id.in.(${selectedIds.join(',')})`); else query = query.eq('author_id', session.uid);
  const { data, error } = await query; if (error) return NextResponse.json({ error: 'Unable to load updates' }, { status: 500 });
  return NextResponse.json({ updates: (data ?? []).map((update: { enc_body: string; [key: string]: unknown }) => ({ ...update, body: decryptData(update.enc_body), enc_body: undefined })) });
}

export async function POST(request: Request) {
  const session = await getOndwiraSession(); if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const input = await request.json().catch(() => null) as { body?: string; audienceMode?: string; audienceIds?: string[]; durationHours?: number; allowReplies?: boolean } | null;
  const body = input?.body?.trim(); const mode = input?.audienceMode === 'selected' ? 'selected' : 'all_contacts'; const audienceIds = [...new Set(input?.audienceIds ?? [])].filter(id => id !== session.uid).slice(0, 500);
  if (!body || body.length > 4000 || (mode === 'selected' && !audienceIds.length)) return NextResponse.json({ error: 'Write an update and choose its audience' }, { status: 400 });
  const hours = Math.min(Math.max(Number(input?.durationHours) || 24, 1), 168);
  const { data: update, error } = await supabaseAdmin.schema('ondwira').from('social_updates').insert({ author_id: session.uid, author_type: session.schema, enc_body: encryptData(body), audience_mode: mode, allow_replies: input?.allowReplies !== false, expires_at: new Date(Date.now() + hours * 3600000).toISOString() }).select('id, author_id, author_type, audience_mode, allow_replies, expires_at, created_at').single();
  if (error || !update) return NextResponse.json({ error: 'Unable to publish update' }, { status: 500 });
  if (mode === 'selected') await supabaseAdmin.schema('ondwira').from('social_update_audience').insert(audienceIds.map(userId => ({ update_id: update.id, user_id: userId })));
  return NextResponse.json({ update: { ...update, body } }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await getOndwiraSession(); if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('id'); if (!id) return NextResponse.json({ error: 'Update id required' }, { status: 400 });
  await supabaseAdmin.schema('ondwira').from('social_updates').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('author_id', session.uid);
  return NextResponse.json({ success: true });
}
