import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { getOndwiraContacts } from '@/lib/ondwira-contacts';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData } from '@/lib/security';

export const dynamic = 'force-dynamic';

async function canView(updateId: string, userId: string, contactIds: string[]) {
  const { data: update } = await supabaseAdmin.schema('ondwira').from('social_updates')
    .select('id, author_id, audience_mode, allow_replies, expires_at, deleted_at').eq('id', updateId).maybeSingle();
  if (!update || update.deleted_at || Date.parse(update.expires_at) <= Date.now()) return null;
  if (update.author_id === userId) return update;
  if (update.audience_mode === 'all_contacts' && contactIds.includes(update.author_id)) return update;
  const { data: audience } = await supabaseAdmin.schema('ondwira').from('social_update_audience').select('update_id').eq('update_id', updateId).eq('user_id', userId).maybeSingle();
  return audience ? update : null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getOndwiraSession();
  const { id } = await params;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const contacts = await getOndwiraContacts(session).catch(() => []);
  const update = await canView(id, session.uid, contacts.map(contact => contact.id));
  if (!update) return NextResponse.json({ error: 'Update not found' }, { status: 404 });
  const input = await request.json().catch(() => null) as { action?: string; emoji?: string; body?: string; completion?: number } | null;

  if (input?.action === 'view') {
    const completion = Math.min(100, Math.max(0, Number(input.completion) || 0));
    const now = new Date().toISOString();
    await supabaseAdmin.schema('ondwira').from('social_update_views').upsert({
      update_id: id, viewer_id: session.uid, last_viewed_at: now, completion_percent: completion,
    }, { onConflict: 'update_id,viewer_id' });
    return NextResponse.json({ viewed: true });
  }

  if (input?.action === 'react') {
    const emoji = input.emoji?.trim().slice(0, 16);
    if (!emoji) {
      await supabaseAdmin.schema('ondwira').from('social_update_reactions').delete().eq('update_id', id).eq('user_id', session.uid);
      return NextResponse.json({ reaction: null });
    }
    await supabaseAdmin.schema('ondwira').from('social_update_reactions').upsert({ update_id: id, user_id: session.uid, emoji }, { onConflict: 'update_id,user_id' });
    return NextResponse.json({ reaction: emoji });
  }

  if (input?.action === 'reply') {
    if (!update.allow_replies || update.author_id === session.uid) return NextResponse.json({ error: 'Replies are closed for this update' }, { status: 403 });
    const body = input.body?.trim();
    if (!body || body.length > 2000) return NextResponse.json({ error: 'Write a reply up to 2,000 characters' }, { status: 400 });
    const { error } = await supabaseAdmin.schema('ondwira').from('social_update_replies').insert({ update_id: id, author_id: session.uid, enc_body: encryptData(body) });
    if (error) return NextResponse.json({ error: 'Reply could not be sent' }, { status: 500 });
    return NextResponse.json({ replied: true });
  }
  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
