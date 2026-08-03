import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicJob } from '@/lib/profcaria-jobs';
import JobApplicationClient from './job-application-client';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await getPublicJob(id).catch(() => null);
  if (!result) return { title: 'Job unavailable | Profcaria', robots: { index: false } };
  return {
    title: `${result.job.title} at ${result.job.organization.name}`,
    description: result.job.summary || `Apply for ${result.job.title} in Kenya on Profcaria.`,
    alternates: { canonical: `/jobs/${id}` },
  };
}

export default async function PublicJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getPublicJob(id).catch(() => null);
  if (!result) notFound();
  const job = result.job;
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'JobPosting',
    title: job.title, description: job.description || job.summary,
    datePosted: job.publishedAt, validThrough: job.closesAt || undefined,
    employmentType: job.employmentType.toUpperCase(),
    hiringOrganization: { '@type': 'Organization', name: job.organization.name },
    jobLocationType: job.locationType === 'remote' ? 'TELECOMMUTE' : undefined,
    jobLocation: job.locationType === 'remote' ? undefined : { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: job.location, addressCountry: 'KE' } },
    applicantLocationRequirements: { '@type': 'Country', name: 'Kenya' },
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} /><JobApplicationClient jobId={id} initialJob={job} /></>;
}
