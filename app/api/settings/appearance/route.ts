import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
const themes = new Set(['system', 'light', 'dark']);
const fonts = new Set(['modern', 'heritage', 'editorial', 'accessible', 'system']);

export async function GET() {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin.schema('ondwira').from('account_preferences')
    .select('theme, font_family, text_scale, reduced_motion, compact_mode').eq('account_id', session.uid).maybeSingle();
  if (error) return NextResponse.json({ error: 'Unable to load appearance' }, { status: 500 });
  return NextResponse.json({ theme: data?.theme || 'system', fontFamily: data?.font_family || 'modern', textScale: Number(data?.text_scale || 1), reducedMotion: Boolean(data?.reduced_motion), compactMode: Boolean(data?.compact_mode) });
}

export async function PATCH(request: Request) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const input = await request.json().catch(() => null) as { theme?: string; fontFamily?: string } | null;
  const update: Record<string, unknown> = { account_id: session.uid, updated_at: new Date().toISOString() };
  if (input?.theme !== undefined) {
    if (!themes.has(input.theme)) return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    update.theme = input.theme;
  }
  if (input?.fontFamily !== undefined) {
    if (!fonts.has(input.fontFamily)) return NextResponse.json({ error: 'Invalid font' }, { status: 400 });
    update.font_family = input.fontFamily;
  }
  if (Object.keys(update).length === 2) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  const { error } = await supabaseAdmin.schema('ondwira').from('account_preferences').upsert(update, { onConflict: 'account_id' });
  if (error) return NextResponse.json({ error: 'Unable to save appearance' }, { status: 500 });
  return NextResponse.json({ success: true });
}
