import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData } from '@/lib/security';

export async function GET() {
  const session = await getOndwiraSession(); if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin.schema('ondwira').from('signatures').select('id, label, source, aspect_ratio, is_default, created_at, last_used_at').eq('owner_id', session.uid).is('revoked_at', null).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Unable to load signatures' }, { status: 500 });
  return NextResponse.json({ signatures: data ?? [] });
}

export async function POST(request: Request) {
  const session = await getOndwiraSession(); if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const input = await request.json().catch(() => null) as { label?: string; strokes?: Array<Array<{ x: number; y: number }>>; source?: string; isDefault?: boolean } | null;
  const strokes = input?.strokes; const source = input?.source || 'touch';
  if (!strokes?.length || strokes.length > 100 || !['touch', 'pen', 'mouse', 'upload', 'device'].includes(source)) return NextResponse.json({ error: 'Draw a valid signature first' }, { status: 400 });
  const points = strokes.flat(); if (points.length < 2 || points.length > 10000 || points.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1)) return NextResponse.json({ error: 'Invalid signature geometry' }, { status: 400 });
  const minX = Math.min(...points.map(p => p.x)); const maxX = Math.max(...points.map(p => p.x)); const minY = Math.min(...points.map(p => p.y)); const maxY = Math.max(...points.map(p => p.y));
  const width = Math.max(maxX - minX, 0.001); const height = Math.max(maxY - minY, 0.001);
  const normalized = strokes.map(stroke => stroke.map(point => ({ x: (point.x - minX) / width, y: (point.y - minY) / height })));
  if (input?.isDefault) await supabaseAdmin.schema('ondwira').from('signatures').update({ is_default: false }).eq('owner_id', session.uid).is('revoked_at', null);
  const { data, error } = await supabaseAdmin.schema('ondwira').from('signatures').insert({ owner_id: session.uid, label: input?.label?.trim().slice(0, 80) || 'My signature', enc_vector_data: encryptData(JSON.stringify(normalized)), source, aspect_ratio: width / height, is_default: Boolean(input?.isDefault) }).select('id, label, source, aspect_ratio, is_default, created_at').single();
  if (error || !data) return NextResponse.json({ error: 'Unable to save signature' }, { status: 500 });
  return NextResponse.json({ signature: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await getOndwiraSession(); if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('id'); if (!id) return NextResponse.json({ error: 'Signature id required' }, { status: 400 });
  const { error } = await supabaseAdmin.schema('ondwira').from('signatures').update({ revoked_at: new Date().toISOString(), is_default: false }).eq('id', id).eq('owner_id', session.uid);
  if (error) return NextResponse.json({ error: 'Unable to remove signature' }, { status: 500 });
  return NextResponse.json({ success: true });
}
