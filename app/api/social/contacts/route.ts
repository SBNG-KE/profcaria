import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { getOndwiraSession } from '@/lib/ondwira-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * A privacy-preserving bridge to the existing approved professional network.
 * It intentionally returns only an ID, display name and avatar—not phone numbers,
 * email addresses, or a searchable list of every Ondwira account.
 */
export async function GET() {
  const session = await getOndwiraSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.schema === 'professional') {
    const { data: applications, error } = await supabaseAdmin
      .schema('employer')
      .from('applications')
      .select('jobs!inner(company_id)')
      .eq('user_id', session.uid)
      .in('status', ['accepted', 'hired', 'employed', 'offered', 'pending_termination', 'pending_resignation']);
    if (error) return NextResponse.json({ error: 'Unable to load contacts' }, { status: 500 });

    const companyIds = [...new Set((applications ?? []).map((item: any) => item.jobs?.company_id).filter(Boolean))];
    if (!companyIds.length) return NextResponse.json({ contacts: [] });
    const { data: companies, error: companiesError } = await supabaseAdmin
      .schema('employer').from('companies').select('id, enc_company_name, enc_logo_url').in('id', companyIds);
    if (companiesError) return NextResponse.json({ error: 'Unable to load contacts' }, { status: 500 });

    return NextResponse.json({ contacts: (companies ?? []).map((company: any) => ({
      id: company.id, type: 'employer', name: decryptData(company.enc_company_name) || 'Company', avatarUrl: decryptData(company.enc_logo_url) || null,
    })) });
  }

  const { data: jobs, error: jobsError } = await supabaseAdmin.schema('employer').from('jobs').select('id').eq('company_id', session.uid);
  if (jobsError) return NextResponse.json({ error: 'Unable to load contacts' }, { status: 500 });
  const jobIds = (jobs ?? []).map((job: { id: string }) => job.id);
  if (!jobIds.length) return NextResponse.json({ contacts: [] });

  const { data: applications, error: applicationsError } = await supabaseAdmin
    .schema('employer').from('applications').select('user_id').in('job_id', jobIds)
    .in('status', ['accepted', 'hired', 'employed', 'offered', 'pending_termination', 'pending_resignation']);
  if (applicationsError) return NextResponse.json({ error: 'Unable to load contacts' }, { status: 500 });
  const userIds = [...new Set((applications ?? []).map((item: { user_id: string }) => item.user_id))];
  if (!userIds.length) return NextResponse.json({ contacts: [] });

  const { data: people, error: peopleError } = await supabaseAdmin
    .schema('professional').from('users').select('id, enc_first_name, enc_last_name, enc_profile_image_url').in('id', userIds);
  if (peopleError) return NextResponse.json({ error: 'Unable to load contacts' }, { status: 500 });
  return NextResponse.json({ contacts: (people ?? []).map((person: any) => ({
    id: person.id, type: 'professional', name: `${decryptData(person.enc_first_name) || ''} ${decryptData(person.enc_last_name) || ''}`.trim() || 'Ondwira member', avatarUrl: decryptData(person.enc_profile_image_url) || null,
  })) });
}
