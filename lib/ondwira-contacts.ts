/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import type { OndwiraSession } from '@/lib/ondwira-auth';

export type OndwiraContact = {
  id: string;
  type: 'professional' | 'employer';
  name: string;
  avatarUrl: string | null;
};

export async function getOndwiraContacts(session: OndwiraSession): Promise<OndwiraContact[]> {
  if (session.schema === 'professional') {
    const { data: applications, error } = await supabaseAdmin
      .schema('employer')
      .from('applications')
      .select('jobs!inner(company_id)')
      .eq('user_id', session.uid)
      .in('status', ['accepted', 'hired', 'employed', 'offered', 'pending_termination', 'pending_resignation']);
    if (error) throw error;

    const companyIds = [...new Set((applications ?? []).map((item: any) => item.jobs?.company_id).filter(Boolean))] as string[];
    if (!companyIds.length) return [];
    const { data: companies, error: companiesError } = await supabaseAdmin
      .schema('employer').from('companies').select('id, enc_company_name, enc_logo_url').in('id', companyIds);
    if (companiesError) throw companiesError;
    return (companies ?? []).map((company: any) => ({
      id: company.id,
      type: 'employer',
      name: decryptData(company.enc_company_name) || 'Company',
      avatarUrl: decryptData(company.enc_logo_url) || null,
    }));
  }

  const { data: jobs, error: jobsError } = await supabaseAdmin.schema('employer').from('jobs').select('id').eq('company_id', session.uid);
  if (jobsError) throw jobsError;
  const jobIds = (jobs ?? []).map((job: { id: string }) => job.id);
  if (!jobIds.length) return [];

  const { data: applications, error: applicationsError } = await supabaseAdmin
    .schema('employer').from('applications').select('user_id').in('job_id', jobIds)
    .in('status', ['accepted', 'hired', 'employed', 'offered', 'pending_termination', 'pending_resignation']);
  if (applicationsError) throw applicationsError;
  const userIds = [...new Set((applications ?? []).map((item: { user_id: string }) => item.user_id))];
  if (!userIds.length) return [];

  const { data: people, error: peopleError } = await supabaseAdmin
    .schema('professional').from('users').select('id, enc_first_name, enc_last_name, enc_profile_image_url').in('id', userIds);
  if (peopleError) throw peopleError;
  return (people ?? []).map((person: any) => ({
    id: person.id,
    type: 'professional',
    name: `${decryptData(person.enc_first_name) || ''} ${decryptData(person.enc_last_name) || ''}`.trim() || 'Ondwira member',
    avatarUrl: decryptData(person.enc_profile_image_url) || null,
  }));
}

export async function resolveOndwiraPeople(rows: Array<{ user_id: string; account_type: string }>) {
  const professionalIds = [...new Set(rows.filter(row => row.account_type === 'professional').map(row => row.user_id))];
  const employerIds = [...new Set(rows.filter(row => row.account_type === 'employer').map(row => row.user_id))];
  const [{ data: people }, { data: companies }] = await Promise.all([
    professionalIds.length
      ? supabaseAdmin.schema('professional').from('users').select('id, enc_first_name, enc_last_name, enc_profile_image_url').in('id', professionalIds)
      : Promise.resolve({ data: [] }),
    employerIds.length
      ? supabaseAdmin.schema('employer').from('companies').select('id, enc_company_name, enc_logo_url').in('id', employerIds)
      : Promise.resolve({ data: [] }),
  ]);
  const result = new Map<string, { name: string; avatarUrl: string | null }>();
  (people ?? []).forEach((person: any) => result.set(person.id, {
    name: `${decryptData(person.enc_first_name) || ''} ${decryptData(person.enc_last_name) || ''}`.trim() || 'Ondwira member',
    avatarUrl: decryptData(person.enc_profile_image_url) || null,
  }));
  (companies ?? []).forEach((company: any) => result.set(company.id, {
    name: decryptData(company.enc_company_name) || 'Organisation',
    avatarUrl: decryptData(company.enc_logo_url) || null,
  }));
  return result;
}
