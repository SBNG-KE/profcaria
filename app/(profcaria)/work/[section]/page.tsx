import { notFound } from 'next/navigation';

const sections: Record<string, { title: string; description: string }> = {
  meetings: { title: 'Meetings', description: 'Schedule team meetings, calls, agendas, and notes.' },
  people: { title: 'People', description: 'Employees and groups are managed by workspace membership.' },
  jobs: { title: 'Jobs', description: 'Create, publish, share, and manage your organisation’s jobs.' },
  applications: { title: 'Applications', description: 'Review applications and coordinate decisions with your team.' },
  reports: { title: 'Reports', description: 'Understand hiring, workforce, and workspace activity.' },
};

export default async function WorkSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = sections[section];
  if (!item) notFound();
  return <section className="mx-auto max-w-6xl p-5 sm:p-8"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#6F878A]">Work mode</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">{item.title}</h1><p className="mt-2 text-[#6F878A]">{item.description}</p><div className="mt-8 rounded-[28px] border border-dashed border-[#006B76]/25 bg-white/65 p-10 text-center"><p className="font-bold text-[#006B76]">No workspace selected</p><p className="mt-2 text-sm text-[#6F878A]">Choose an organisation to see its {item.title.toLowerCase()}.</p><button className="mt-5 rounded-2xl bg-[#006B76] px-5 py-3 text-sm font-bold text-white">Choose workspace</button></div></section>;
}
