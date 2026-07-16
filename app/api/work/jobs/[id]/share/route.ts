import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { cleanText, makeShareCode, requireOrganizationManager } from '@/lib/ondwira-recruitment';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { data: job } = await supabaseAdmin.schema('ondwira').from('jobs')
    .select('id, organization_id, status, visibility').eq('id', id).maybeSingle();
  if (!job || !(await requireOrganizationManager(job.organization_id, session.uid))) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  if (job.status !== 'published') return NextResponse.json({ error: 'Publish the job before sharing it.' }, { status: 409 });
  const input = await request.json().catch(() => null) as { channel?: string; referrerId?: string; expiresAt?: string } | null;
  const channels = new Set(['copy', 'email', 'message', 'social', 'qr', 'referral', 'internal']);
  const channel = channels.has(cleanText(input?.channel, 20)) ? cleanText(input?.channel, 20) : 'copy';
  const shareCode = makeShareCode();
  const { data: share, error } = await supabaseAdmin.schema('ondwira').from('job_shares').insert({
    job_id: id,
    share_code: shareCode,
    channel,
    created_by: session.uid,
    referrer_id: input?.referrerId || null,
    expires_at: input?.expiresAt ? new Date(input.expiresAt).toISOString() : null,
  }).select('id, share_code, channel, expires_at').single();
  if (error || !share) return NextResponse.json({ error: 'Share link could not be created.' }, { status: 500 });
  await supabaseAdmin.schema('ondwira').from('job_events').insert({
    job_id: id, organization_id: job.organization_id, actor_id: session.uid,
    share_id: share.id, event_type: 'shared', metadata: { channel },
  });
  const origin = new URL(request.url).origin;
  return NextResponse.json({ share, link: `${origin}/find-work/${id}?ref=${encodeURIComponent(shareCode)}` }, { status: 201 });
}
