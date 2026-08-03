/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';

export const JOBS_SCHEMA = 'profcaria';

export type PublicJobRecord = {
  id: string; code: string; title: string; organization: { id: string; name: string };
  summary: string; description: string; requirements: string; benefits: string; compensation: string;
  location: string; locationType: string; employmentType: string; seniority: string; roleCategory: string;
  skills: string[]; applicationCount: number; applicationLimit: number | null; publishedAt: string;
  closesAt: string | null; countryCode: string;
};

export function toPublicJob(row: any): PublicJobRecord {
  return {
    id: row.id,
    code: row.job_code,
    title: decryptData(row.enc_title) || 'Untitled role',
    organization: { id: row.organization_id, name: row.organizations?.name || 'Verified company' },
    summary: decryptData(row.enc_summary) || '',
    description: decryptData(row.enc_description) || '',
    requirements: decryptData(row.enc_requirements) || '',
    benefits: decryptData(row.enc_benefits) || '',
    compensation: decryptData(row.enc_compensation) || '',
    location: decryptData(row.enc_location) || '',
    locationType: row.location_type,
    employmentType: row.employment_type,
    seniority: row.seniority,
    roleCategory: row.role_category || 'Other',
    skills: row.skill_tags || [],
    applicationCount: Number(row.application_count || 0),
    applicationLimit: row.application_limit,
    publishedAt: row.published_at || row.created_at,
    closesAt: row.closes_at,
    countryCode: row.country_code || 'KE',
  };
}

export function isPubliclyOpen(row: any) {
  if (row.status !== 'published' || row.visibility !== 'public') return false;
  if (row.country_code && row.country_code !== 'KE') return false;
  if (row.closes_at && new Date(row.closes_at) <= new Date()) return false;
  if (row.application_limit && Number(row.application_count || 0) >= Number(row.application_limit)) return false;
  return true;
}

export async function getPublicJobs(limit = 100): Promise<PublicJobRecord[]> {
  const { data, error } = await supabaseAdmin.schema(JOBS_SCHEMA).from('jobs')
    .select('*, organizations(id, name)')
    .eq('status', 'published')
    .eq('visibility', 'public')
    .order('published_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 200));
  if (error) throw error;
  return (data || []).filter(isPubliclyOpen).map(toPublicJob);
}

export async function getPublicJob(id: string) {
  const { data, error } = await supabaseAdmin.schema(JOBS_SCHEMA).from('jobs')
    .select('*, organizations(id, name)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data && isPubliclyOpen(data) ? { row: data, job: toPublicJob(data) } : null;
}
