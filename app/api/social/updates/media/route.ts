import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { getOndwiraContacts } from '@/lib/ondwira-contacts';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const allowedMime = /^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm|quicktime))$/;
const textStyles = new Set(['editorial', 'modern', 'heritage', 'quiet', 'statement']);
const backgrounds = new Set(['parchment', 'terracotta', 'ink', 'olive', 'gold', 'rose']);

export async function POST(request: Request) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const files = (form?.getAll('files') ?? []).filter((item): item is File => item instanceof File);
  if (!files.length || files.length > 4) return NextResponse.json({ error: 'Choose one video or up to four photos' }, { status: 400 });
  const videos = files.filter(file => file.type.startsWith('video/'));
  if (videos.length > 1 || (videos.length && files.length > 1)) return NextResponse.json({ error: 'A video update can contain one video' }, { status: 400 });
  if (files.some(file => !file.size || file.size > 100 * 1024 * 1024 || !allowedMime.test(file.type))) return NextResponse.json({ error: 'Use supported photos or videos smaller than 100 MB each' }, { status: 400 });

  const contacts = await getOndwiraContacts(session).catch(() => []);
  const contactIds = new Set(contacts.map(contact => contact.id));
  const mode = form?.get('audienceMode') === 'selected' ? 'selected' : 'all_contacts';
  const requestedAudience = JSON.parse(String(form?.get('audienceIds') || '[]')) as string[];
  const audienceIds = [...new Set(requestedAudience)].filter(id => id !== session.uid && contactIds.has(id)).slice(0, 500);
  if (mode === 'selected' && !audienceIds.length) return NextResponse.json({ error: 'Choose at least one approved contact' }, { status: 400 });

  const body = String(form?.get('body') || '').trim().slice(0, 4000);
  const prompt = String(form?.get('prompt') || '').trim().slice(0, 180);
  const moodEmoji = String(form?.get('moodEmoji') || '').trim().slice(0, 16);
  const durationHours = Math.min(Math.max(Number(form?.get('durationHours')) || 24, 1), 168);
  const requestedTextStyle = String(form?.get('textStyle') || '');
  const requestedBackground = String(form?.get('backgroundStyle') || '');
  const contentType = videos.length ? 'video' : 'photo';
  const { data: update, error } = await supabaseAdmin.schema('ondwira').from('social_updates').insert({
    author_id: session.uid,
    author_type: session.schema,
    enc_body: body ? encryptData(body) : null,
    enc_prompt: prompt ? encryptData(prompt) : null,
    mood_emoji: moodEmoji || null,
    content_type: contentType,
    text_style: textStyles.has(requestedTextStyle) ? requestedTextStyle : 'editorial',
    background_style: backgrounds.has(requestedBackground) ? requestedBackground : 'ink',
    audience_mode: mode,
    allow_replies: form?.get('allowReplies') !== 'false',
    expires_at: new Date(Date.now() + durationHours * 3600000).toISOString(),
  }).select('id').single();
  if (error || !update) return NextResponse.json({ error: 'Unable to prepare the update' }, { status: 500 });

  const uploaded: string[] = [];
  try {
    const mediaRows = [];
    for (const [position, file] of files.entries()) {
      const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || (file.type.startsWith('video/') ? 'mp4' : 'jpg');
      const path = `${session.uid}/${new Date().toISOString().slice(0, 10)}/${update.id}/${randomUUID()}.${extension}`;
      const { error: uploadError } = await supabaseAdmin.storage.from('ondwira-updates').upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      uploaded.push(path);
      mediaRows.push({ update_id: update.id, storage_path: path, media_type: file.type.startsWith('video/') ? 'video' : 'photo', mime_type: file.type, byte_size: file.size, position });
    }
    const { error: mediaError } = await supabaseAdmin.schema('ondwira').from('social_update_media').insert(mediaRows);
    if (mediaError) throw mediaError;
    if (mode === 'selected') {
      const { error: audienceError } = await supabaseAdmin.schema('ondwira').from('social_update_audience').insert(audienceIds.map(userId => ({ update_id: update.id, user_id: userId })));
      if (audienceError) throw audienceError;
    }
    return NextResponse.json({ update: { id: update.id } }, { status: 201 });
  } catch {
    if (uploaded.length) await supabaseAdmin.storage.from('ondwira-updates').remove(uploaded);
    await supabaseAdmin.schema('ondwira').from('social_updates').delete().eq('id', update.id);
    return NextResponse.json({ error: 'The media update could not be published' }, { status: 500 });
  }
}
