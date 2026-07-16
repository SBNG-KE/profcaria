/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = new URL(request.url).searchParams.get('organizationId');
  const { data: memberships } = await supabaseAdmin.schema('ondwira').from('organization_members')
    .select('organization_id, role, organizations!inner(id, name)').eq('user_id', session.uid).eq('status', 'active')
    .in('role', ['owner', 'admin', 'manager']);
  const allowed = (memberships ?? []).filter((row: any) => !organizationId || row.organization_id === organizationId);
  const ids = allowed.map((row: any) => row.organization_id);
  if (!ids.length) return NextResponse.json({ organizations: [], metrics: {}, funnel: [], jobs: [] });

  const [{ data: jobs }, { data: applications }, { data: events }, { data: interviews }] = await Promise.all([
    supabaseAdmin.schema('ondwira').from('jobs')
      .select('id, enc_title, status, application_count, hired_count, published_at, closed_at').in('organization_id', ids),
    supabaseAdmin.schema('ondwira').from('applications')
      .select('id, job_id, status, submitted_at, first_reviewed_at, hired_at, screening_score').in('organization_id', ids),
    supabaseAdmin.schema('ondwira').from('job_events')
      .select('job_id, event_type, created_at').in('organization_id', ids),
    supabaseAdmin.schema('ondwira').from('recruitment_interviews')
      .select('id, status, starts_at').in('organization_id', ids),
  ]);
  const allApplications = applications ?? [];
  const reviewed = allApplications.filter((row: any) => row.first_reviewed_at);
  const hired = allApplications.filter((row: any) => row.hired_at);
  const averageDays = (rows: any[], end: string) => rows.length
    ? Number((rows.reduce((sum, row) => sum + (new Date(row[end]).getTime() - new Date(row.submitted_at).getTime()) / 86_400_000, 0) / rows.length).toFixed(1))
    : 0;
  const eventCount = (type: string) => (events ?? []).filter((event: any) => event.event_type === type).length;
  const stages = ['submitted', 'screening', 'needs_review', 'on_hold', 'shortlisted', 'interview', 'offer', 'offer_accepted', 'hired', 'rejected', 'withdrawn'];
  const funnel = stages.map(stage => ({ name: stage, value: allApplications.filter((application: any) => application.status === stage).length }));
  const { decryptData } = await import('@/lib/security');
  return NextResponse.json({
    organizations: allowed.map((row: any) => ({ id: row.organization_id, name: row.organizations?.name })),
    metrics: {
      activeJobs: (jobs ?? []).filter((job: any) => job.status === 'published').length,
      totalApplications: allApplications.length,
      views: eventCount('viewed') + eventCount('share_opened'),
      shares: eventCount('shared'),
      interviews: (interviews ?? []).length,
      hires: hired.length,
      averageDaysToReview: averageDays(reviewed, 'first_reviewed_at'),
      averageDaysToHire: averageDays(hired, 'hired_at'),
      screeningCoverage: allApplications.length
        ? Math.round(allApplications.filter((row: any) => row.screening_score != null).length / allApplications.length * 100) : 0,
      responseRate: allApplications.length
        ? Math.round(allApplications.filter((row: any) => !['submitted', 'screening'].includes(row.status)).length / allApplications.length * 100) : 0,
    },
    funnel,
    jobs: (jobs ?? []).map((job: any) => ({
      id: job.id, title: decryptData(job.enc_title), status: job.status,
      applications: job.application_count, hires: job.hired_count,
    })).sort((a: any, b: any) => b.applications - a.applications),
  });
}
