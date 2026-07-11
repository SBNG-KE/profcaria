import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { supabaseAdmin } from '@/lib/supabase';
export async function GET() { const session = await getOndwiraSession(); if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); const { data, error } = await supabaseAdmin.schema('ondwira').from('employment_records').select('id, title, employment_type, status, started_at, ended_at, end_reason, source, organizations(name)').eq('user_id', session.uid).order('started_at', { ascending: false }); if (error) return NextResponse.json({ error: 'Unable to load job history' }, { status: 500 }); return NextResponse.json({ history: data ?? [] }); }
