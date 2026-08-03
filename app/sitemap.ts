import { MetadataRoute } from 'next';
import { getPublicJobs } from '@/lib/profcaria-jobs';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.profcaria.com';
  const core: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'hourly', priority: 1 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];
  try {
    const jobs = await getPublicJobs(200);
    return [...core, ...jobs.map(job => ({ url: `${baseUrl}/jobs/${job.id}`, lastModified: new Date(job.publishedAt), changeFrequency: 'daily' as const, priority: 0.9 }))];
  } catch { return core; }
}
