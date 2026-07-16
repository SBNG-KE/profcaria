/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { decryptJob } from '@/lib/ondwira-recruitment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function matchJob(job: any, evidence: string) {
  const terms = [...(job.skill_tags ?? []), decryptData(job.enc_title) || '', job.role_category || '']
    .flatMap(value => String(value).toLowerCase().split(/[^a-z0-9+#.]+/))
    .filter(term => term.length > 2);
  const matched = [...new Set(terms.filter(term => evidence.includes(term)))];
  const score = terms.length ? Math.min(98, Math.round(38 + (matched.length / terms.length) * 60)) : 50;
  return {
    score,
    reasons: matched.length
      ? [`Your saved work evidence matches ${matched.slice(0, 4).join(', ')}.`]
      : ['This role is open to your account; add skills and verified history to improve matching.'],
  };
}

export async function GET(request: Request) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(request.url);
  const search = (url.searchParams.get('q') || '').trim().toLowerCase().slice(0, 120);
  const locationType = url.searchParams.get('locationType');
  const employmentType = url.searchParams.get('employmentType');

  const [{ data: memberships }, { data: history }, { data: documents }] = await Promise.all([
    supabaseAdmin.schema('ondwira').from('organization_members')
      .select('organization_id').eq('user_id', session.uid).eq('status', 'active'),
    supabaseAdmin.schema('ondwira').from('employment_records')
      .select('title, verification_status').eq('user_id', session.uid),
    supabaseAdmin.schema('ondwira').from('documents')
      .select('enc_title, enc_content, document_kind').eq('owner_id', session.uid).is('archived_at', null).limit(50),
  ]);
  const organizationIds = new Set((memberships ?? []).map((row: any) => row.organization_id));
  const evidence = [
    ...(history ?? []).map((row: any) => row.title),
    ...(documents ?? []).flatMap((row: any) => [decryptData(row.enc_title), decryptData(row.enc_content), row.document_kind]),
  ].filter(Boolean).join(' ').toLowerCase();

  let query = supabaseAdmin.schema('ondwira').from('jobs')
    .select('*, organizations(id, name)')
    .eq('status', 'published').order('published_at', { ascending: false }).limit(100);
  if (locationType) query = query.eq('location_type', locationType);
  if (employmentType) query = query.eq('employment_type', employmentType);
  const { data: rows, error } = await query;
  if (error) return NextResponse.json({ error: 'Unable to load open roles.' }, { status: 500 });

  const visible = (rows ?? []).filter((row: any) => {
    if (row.closes_at && new Date(row.closes_at) <= new Date()) return false;
    if (row.application_limit && row.application_count >= row.application_limit) return false;
    if (row.visibility === 'link_only') return false;
    if (row.visibility === 'organization' && !organizationIds.has(row.organization_id)) return false;
    if (!search) return true;
    const haystack = [
      decryptData(row.enc_title), decryptData(row.enc_summary), decryptData(row.enc_description),
      decryptData(row.enc_location), row.organizations?.name, ...(row.skill_tags ?? []),
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(search);
  });
  const jobIds = visible.map((row: any) => row.id);
  const { data: applications } = jobIds.length
    ? await supabaseAdmin.schema('ondwira').from('applications')
      .select('job_id, status, submitted_at').eq('applicant_id', session.uid).in('job_id', jobIds)
    : { data: [] };
  const applicationMap = new Map((applications ?? []).map((row: any) => [row.job_id, row]));

  return NextResponse.json({
    jobs: visible.map((row: any) => ({
      ...decryptJob(row),
      match: matchJob(row, evidence),
      application: applicationMap.get(row.id) ?? null,
    })),
  });
}
