/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { getOndwiraContacts, resolveOndwiraPeople } from '@/lib/ondwira-contacts';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData, encryptData } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type UpdateInput = {
  body?: string;
  prompt?: string;
  moodEmoji?: string;
  textStyle?: string;
  backgroundStyle?: string;
  audienceMode?: string;
  audienceIds?: string[];
  durationHours?: number;
  allowReplies?: boolean;
};

const textStyles = new Set(['editorial', 'modern', 'heritage', 'quiet', 'statement']);
const backgrounds = new Set(['parchment', 'terracotta', 'ink', 'olive', 'gold', 'rose']);

async function signedUpdateUrl(path: string) {
  const { data } = await supabaseAdmin.storage.from('ondwira-updates').createSignedUrl(path, 60 * 20);
  return data?.signedUrl ?? null;
}

async function visibleUpdateRows(userId: string, contactIds: string[]) {
  const now = new Date().toISOString();
  const { data: selectedRows } = await supabaseAdmin.schema('ondwira').from('social_update_audience').select('update_id').eq('user_id', userId);
  const selectedIds = (selectedRows ?? []).map((row: { update_id: string }) => row.update_id);
  const select = 'id, author_id, author_type, enc_body, enc_prompt, mood_emoji, content_type, text_style, background_style, audience_mode, allow_replies, expires_at, created_at';
  const queries = [
    supabaseAdmin.schema('ondwira').from('social_updates').select(select).eq('author_id', userId).gt('expires_at', now).is('deleted_at', null),
    selectedIds.length
      ? supabaseAdmin.schema('ondwira').from('social_updates').select(select).in('id', selectedIds).gt('expires_at', now).is('deleted_at', null)
      : Promise.resolve({ data: [], error: null }),
    contactIds.length
      ? supabaseAdmin.schema('ondwira').from('social_updates').select(select).eq('audience_mode', 'all_contacts').in('author_id', contactIds).gt('expires_at', now).is('deleted_at', null)
      : Promise.resolve({ data: [], error: null }),
  ];
  const results = await Promise.all(queries);
  if (results.some(result => result.error)) throw new Error('Unable to load updates');
  return [...new Map(results.flatMap(result => result.data ?? []).map((row: any) => [row.id, row])).values()]
    .sort((a: any, b: any) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, 100);
}

export async function GET() {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const contacts = await getOndwiraContacts(session);
    const updates = await visibleUpdateRows(session.uid, contacts.map(contact => contact.id));
    const updateIds = updates.map((update: any) => update.id);
    if (!updateIds.length) return NextResponse.json({ viewerId: session.uid, updates: [] });

    const [mediaResult, reactionResult, viewResult, replyResult] = await Promise.all([
      supabaseAdmin.schema('ondwira').from('social_update_media').select('id, update_id, storage_path, media_type, mime_type, byte_size, width, height, duration_seconds, position').in('update_id', updateIds).order('position'),
      supabaseAdmin.schema('ondwira').from('social_update_reactions').select('update_id, user_id, emoji').in('update_id', updateIds),
      supabaseAdmin.schema('ondwira').from('social_update_views').select('update_id, viewer_id, completion_percent, last_viewed_at').in('update_id', updateIds),
      supabaseAdmin.schema('ondwira').from('social_update_replies').select('id, update_id, author_id, enc_body, created_at').in('update_id', updateIds).is('deleted_at', null).order('created_at', { ascending: false }),
    ]);
    const media = await Promise.all((mediaResult.data ?? []).map(async (item: any) => ({ ...item, url: await signedUpdateUrl(item.storage_path) })));
    const authorRows = updates.map((update: any) => ({ user_id: update.author_id, account_type: update.author_type }));
    const replyAuthorRows = (replyResult.data ?? []).map((reply: any) => ({ user_id: reply.author_id, account_type: contacts.find(contact => contact.id === reply.author_id)?.type || session.schema }));
    const people = await resolveOndwiraPeople([...authorRows, ...replyAuthorRows]);

    return NextResponse.json({
      viewerId: session.uid,
      updates: updates.map((update: any) => {
        const mine = update.author_id === session.uid;
        const updateReactions = (reactionResult.data ?? []).filter((reaction: any) => reaction.update_id === update.id);
        const updateViews = (viewResult.data ?? []).filter((view: any) => view.update_id === update.id);
        const replies = mine ? (replyResult.data ?? []).filter((reply: any) => reply.update_id === update.id).map((reply: any) => ({
          id: reply.id,
          body: decryptData(reply.enc_body),
          authorId: reply.author_id,
          authorName: people.get(reply.author_id)?.name || 'Ondwira member',
          createdAt: reply.created_at,
        })) : [];
        const reactionCounts = updateReactions.reduce((counts: Record<string, number>, reaction: any) => {
          counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
          return counts;
        }, {});
        return {
          id: update.id,
          authorId: update.author_id,
          authorName: people.get(update.author_id)?.name || (mine ? 'You' : 'Ondwira member'),
          authorAvatar: people.get(update.author_id)?.avatarUrl || null,
          isMine: mine,
          body: decryptData(update.enc_body),
          prompt: decryptData(update.enc_prompt),
          moodEmoji: update.mood_emoji,
          contentType: update.content_type,
          textStyle: update.text_style,
          backgroundStyle: update.background_style,
          allowReplies: update.allow_replies,
          expiresAt: update.expires_at,
          createdAt: update.created_at,
          media: media.filter((item: any) => item.update_id === update.id).map((item: any) => ({
            id: item.id, type: item.media_type, mimeType: item.mime_type, byteSize: item.byte_size, url: item.url,
            width: item.width, height: item.height, durationSeconds: item.duration_seconds,
          })),
          reaction: updateReactions.find((reaction: any) => reaction.user_id === session.uid)?.emoji || null,
          reactionCounts: Object.entries(reactionCounts).map(([emoji, count]) => ({ emoji, count })),
          viewCount: mine ? updateViews.filter((view: any) => view.viewer_id !== session.uid).length : null,
          viewed: updateViews.some((view: any) => view.viewer_id === session.uid),
          replyCount: (replyResult.data ?? []).filter((reply: any) => reply.update_id === update.id).length,
          replies,
        };
      }),
    });
  } catch {
    return NextResponse.json({ error: 'Unable to load updates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const input = await request.json().catch(() => null) as UpdateInput | null;
  const body = input?.body?.trim();
  if (!body || body.length > 4000) return NextResponse.json({ error: 'Write between 1 and 4,000 characters' }, { status: 400 });

  const contacts = await getOndwiraContacts(session).catch(() => []);
  const contactIds = new Set(contacts.map(contact => contact.id));
  const mode = input?.audienceMode === 'selected' ? 'selected' : 'all_contacts';
  const audienceIds = [...new Set(input?.audienceIds ?? [])].filter(id => id !== session.uid && contactIds.has(id)).slice(0, 500);
  if (mode === 'selected' && !audienceIds.length) return NextResponse.json({ error: 'Choose at least one approved contact' }, { status: 400 });
  const hours = Math.min(Math.max(Number(input?.durationHours) || 24, 1), 168);
  const textStyle = textStyles.has(input?.textStyle || '') ? input!.textStyle : 'editorial';
  const backgroundStyle = backgrounds.has(input?.backgroundStyle || '') ? input!.backgroundStyle : 'parchment';

  const { data: update, error } = await supabaseAdmin.schema('ondwira').from('social_updates').insert({
    author_id: session.uid,
    author_type: session.schema,
    enc_body: encryptData(body),
    enc_prompt: input?.prompt?.trim() ? encryptData(input.prompt.trim().slice(0, 180)) : null,
    mood_emoji: input?.moodEmoji?.trim().slice(0, 16) || null,
    content_type: 'text',
    text_style: textStyle,
    background_style: backgroundStyle,
    audience_mode: mode,
    allow_replies: input?.allowReplies !== false,
    expires_at: new Date(Date.now() + hours * 3600000).toISOString(),
  }).select('id, author_id, expires_at, created_at').single();
  if (error || !update) return NextResponse.json({ error: 'Unable to publish update' }, { status: 500 });
  if (mode === 'selected') {
    const { error: audienceError } = await supabaseAdmin.schema('ondwira').from('social_update_audience').insert(audienceIds.map(userId => ({ update_id: update.id, user_id: userId })));
    if (audienceError) {
      await supabaseAdmin.schema('ondwira').from('social_updates').delete().eq('id', update.id);
      return NextResponse.json({ error: 'Unable to save the private audience' }, { status: 500 });
    }
  }
  return NextResponse.json({ update: { id: update.id } }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Update id required' }, { status: 400 });
  const { data: owned } = await supabaseAdmin.schema('ondwira').from('social_updates').select('id').eq('id', id).eq('author_id', session.uid).maybeSingle();
  if (!owned) return NextResponse.json({ error: 'Update not found' }, { status: 404 });
  const { data: media } = await supabaseAdmin.schema('ondwira').from('social_update_media').select('storage_path').eq('update_id', id);
  await supabaseAdmin.schema('ondwira').from('social_updates').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('author_id', session.uid);
  if (media?.length) await supabaseAdmin.storage.from('ondwira-updates').remove(media.map((item: { storage_path: string }) => item.storage_path));
  return NextResponse.json({ success: true });
}
