/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getOndwiraSession } from '@/lib/ondwira-auth';
import { resolveOndwiraAccounts } from '@/lib/ondwira-contacts';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { decryptJob } from '@/lib/ondwira-recruitment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(request.url);
  const view = url.searchParams.get('view') === 'mine' ? 'mine' : 'hiring';
  const organizationId = url.searchParams.get('organizationId');
  const jobId = url.searchParams.get('jobId');
  const status = url.searchParams.get('status');

  let query = supabaseAdmin.schema('ondwira').from('applications')
    .select('*, jobs(*, organizations(id, name))').order('submitted_at', { ascending: false }).limit(250);
  let organizations: any[] = [];
  if (view === 'mine') {
    query = query.eq('applicant_id', session.uid);
  } else {
    const { data: memberships, error } = await supabaseAdmin.schema('ondwira').from('organization_members')
      .select('organization_id, role, organizations!inner(id, name)')
      .eq('user_id', session.uid).eq('status', 'active').in('role', ['owner', 'admin', 'manager']);
    if (error) return NextResponse.json({ error: 'Unable to load hiring access.' }, { status: 500 });
    organizations = memberships ?? [];
    const ids = organizations.map((membership: any) => membership.organization_id);
    if (!ids.length) return NextResponse.json({ applications: [], organizations: [] });
    query = query.in('organization_id', organizationId && ids.includes(organizationId) ? [organizationId] : ids);
  }
  if (jobId) query = query.eq('job_id', jobId);
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Unable to load applications.' }, { status: 500 });
  const people = await resolveOndwiraAccounts((data ?? []).map((application: any) => application.applicant_id));

  return NextResponse.json({
    viewerId: session.uid,
    view,
    organizations: organizations.map((membership: any) => ({
      id: membership.organization_id,
      name: membership.organizations?.name,
      role: membership.role,
    })),
    applications: (data ?? []).map((application: any) => {
      const snapshot = JSON.parse(decryptData(application.enc_candidate_snapshot) || '{}');
      return {
        id: application.id,
        status: application.status,
        source: application.source,
        submittedAt: application.submitted_at,
        screeningStatus: application.screening_status,
        screeningScore: application.screening_score,
        screeningRecommendation: application.screening_recommendation,
        screeningSummary: decryptData(application.enc_screening_summary),
        candidate: {
          id: application.applicant_id,
          name: people.get(application.applicant_id)?.name || snapshot.name || 'Ondwira member',
          hidden: Boolean(application.jobs?.blind_review)
            && ['submitted', 'screening', 'needs_review', 'on_hold'].includes(application.status),
        },
        job: decryptJob(application.jobs),
      };
    }),
  });
}
