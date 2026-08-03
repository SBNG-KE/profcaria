import { NextResponse } from 'next/server';
import { getPublicJobs } from '@/lib/profcaria-jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').trim().toLowerCase().slice(0, 120);
    const locationType = url.searchParams.get('locationType');
    const employmentType = url.searchParams.get('employmentType');
    let jobs = await getPublicJobs(200);
    if (locationType) jobs = jobs.filter(job => job.locationType === locationType);
    if (employmentType) jobs = jobs.filter(job => job.employmentType === employmentType);
    if (q) jobs = jobs.filter(job => [job.title, job.organization.name, job.summary, job.location, job.roleCategory, ...job.skills].join(' ').toLowerCase().includes(q));
    return NextResponse.json({ jobs, market: 'KE', currency: 'KES', generatedAt: new Date().toISOString() }, {
      headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120', 'X-Robots-Tag': 'index, follow' },
    });
  } catch (error) {
    console.error('[PROFCARIA] Public jobs feed failed', error);
    return NextResponse.json({ error: 'Open jobs are temporarily unavailable.' }, { status: 503 });
  }
}
