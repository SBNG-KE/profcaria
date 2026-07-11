'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';
type Field = { id?: string; name?: string; label?: string; required?: boolean };
type Job = { title: string; description: string; location: string; location_type: string; company: { name: string }; formSchema: Field[] };
export default function JobDetailClient({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<Job | null>(null); const [form, setForm] = useState<Record<string, string>>({}); const [notice, setNotice] = useState('');
  useEffect(() => { fetch(`/api/professional/jobs/${jobId}`).then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; }).then(setJob).catch(error => setNotice(error.message)); }, [jobId]);
  async function apply() { const response = await fetch(`/api/professional/jobs/${jobId}/apply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ formData: form, accessList: [] }) }); const data = await response.json(); setNotice(response.ok ? 'Application submitted.' : data.error || 'Application could not be submitted.'); }
  if (!job) return <p className="p-8">{notice || 'Loading role…'}</p>;
  return <section className="mx-auto max-w-4xl p-5 sm:p-8"><Link href="/find-work" className="inline-flex items-center gap-2 text-sm font-bold"><ArrowLeft size={17} /> Find work</Link><div className="mt-6 rounded-[30px] bg-white p-7 sm:p-10"><p className="text-sm font-black text-[#315548]">{job.company.name}</p><h1 className="mt-2 text-3xl font-black">{job.title}</h1><p className="mt-3 text-sm text-[#6c756f]"><MapPin size={15} className="mr-1 inline" />{job.location || job.location_type}</p><p className="mt-7 whitespace-pre-wrap leading-7 text-[#4e5a53]">{job.description}</p>{job.formSchema.map((field, index) => { const key = field.id || field.name || `field_${index}`; return <label key={key} className="mt-5 block text-sm font-bold">{field.label || field.name || 'Application question'}<input value={form[key] || ''} onChange={event => setForm(current => ({ ...current, [key]: event.target.value }))} required={field.required} className="mt-2 w-full rounded-2xl bg-[#f0eee8] px-4 py-3 font-normal outline-none" /></label>; })}{notice && <p className="mt-5 rounded-2xl bg-[#fff0c8] p-3 text-sm">{notice}</p>}<button onClick={apply} className="mt-6 rounded-2xl bg-[#183d31] px-6 py-3 font-black text-white">Submit application</button></div></section>;
}
