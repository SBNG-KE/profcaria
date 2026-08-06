import { getPublicJobs } from '@/lib/profcaria-jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const generatedAt = new Date().toISOString();
  try {
    const jobs = await getPublicJobs(200);
    return Response.json({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Profcaria open jobs in Kenya',
      home_page_url: 'https://www.profcaria.com',
      feed_url: 'https://www.profcaria.com/jobs/feed',
      description: 'Public, currently open roles. Private accounts, applications and messages are never included.',
      language: 'en-KE',
      generated_at: generatedAt,
      items: jobs.map(job => ({
        id: job.id,
        url: `https://www.profcaria.com/jobs/${job.id}`,
        title: job.title,
        summary: job.summary,
        date_published: job.publishedAt,
        date_modified: job.publishedAt,
        tags: [job.roleCategory, job.employmentType, job.locationType, ...job.skills].filter(Boolean),
        organization: job.organization.name,
        location: job.location,
        country_code: job.countryCode,
        closes_at: job.closesAt,
      })),
    }, { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300', 'X-Robots-Tag': 'index, follow' } });
  } catch (error) {
    console.error('[PROFCARIA] Public JSON feed failed', error);
    return Response.json({ error: 'Open jobs are temporarily unavailable.', generated_at: generatedAt }, { status: 503, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
