import { NextResponse } from 'next/server';
import { getPublicJobs } from '@/lib/profcaria-jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const publicHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Accept, Content-Type',
  'Cache-Control': 'public, max-age=30, stale-while-revalidate=120',
  'X-Robots-Tag': 'index, follow',
};

const normalize = (value: string | null) => value?.trim().toLowerCase().replace(/[\s-]+/g, '_').replace(/^on_site$/, 'onsite') || '';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: publicHeaders });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').trim().toLowerCase().slice(0, 120);
    const locationType = normalize(url.searchParams.get('locationType'));
    const employmentType = normalize(url.searchParams.get('employmentType'));
    const roleCategory = normalize(url.searchParams.get('category') || url.searchParams.get('roleCategory'));
    let jobs = await getPublicJobs(200);
    if (locationType) jobs = jobs.filter(job => normalize(job.locationType) === locationType);
    if (employmentType) jobs = jobs.filter(job => normalize(job.employmentType) === employmentType);
    if (roleCategory) jobs = jobs.filter(job => normalize(job.roleCategory) === roleCategory);
    if (q) jobs = jobs.filter(job => [job.title, job.organization.name, job.summary, job.location, job.roleCategory, ...job.skills].join(' ').toLowerCase().includes(q));
    return NextResponse.json({ jobs, market: 'KE', currency: 'KES', generatedAt: new Date().toISOString() }, {
      headers: publicHeaders,
    });
  } catch (error) {
    console.error('[PROFCARIA] Public jobs feed failed', error);
    return NextResponse.json({ error: 'Open jobs are temporarily unavailable.' }, { status: 503, headers: publicHeaders });
  }
}
