'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  FileText,
  Plus,
  UserCheck,
  UserCog,
  Users,
  WalletCards,
  X,
} from 'lucide-react';

type Organization = { role: string; organizations: { id: string; name: string } };
type Member = { id: string; name: string; role: string };
type Report = {
  metrics: Record<string, number>;
  funnel: Array<{ name: string; value: number }>;
  jobs: Array<{ id: string; title: string; status: string; applications: number; hires: number }>;
};

const operations = [
  { title: 'Manage vacancies', text: 'Create, publish, pause and close company roles.', href: '/work/jobs', icon: BriefcaseBusiness, roles: ['owner', 'admin', 'manager'] },
  { title: 'Review applicants', text: 'Screen applications, shortlist people and record decisions.', href: '/work/applications', icon: FileText, roles: ['owner', 'admin', 'manager'] },
  { title: 'Interviews', text: 'Coordinate interview times and candidate responses.', href: '/work/meetings', icon: CalendarClock, roles: ['owner', 'admin', 'manager'] },
  { title: 'Recruiter access', text: 'Invite hiring staff and control exactly what each person can do.', href: '/work/people', icon: UserCog, roles: ['owner', 'admin'] },
  { title: 'Hiring reports', text: 'Monitor applications, response time, interviews and hires.', href: '/work/reports', icon: BarChart3, roles: ['owner', 'admin', 'manager'] },
  { title: 'Billing', text: 'Manage hiring funds, usage and company payments.', href: '/work/billing', icon: WalletCards, roles: ['owner', 'admin'] },
] as const;

export default function WorkClient() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [creatingOrganization, setCreatingOrganization] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/work/organizations', { cache: 'no-store' })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) { router.replace('/?auth=login&intent=company'); return null; }
        if (!response.ok) throw new Error(data.error || 'Company access could not be loaded.');
        return data;
      })
      .then(data => {
        if (!data) return;
        setOrganizations(data.organizations ?? []);
        setOrganizationId(data.organizations?.[0]?.organizations.id ?? '');
      })
      .catch(error => setNotice(error instanceof Error ? error.message : 'Company access could not be loaded.'))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!organizationId) return;
    Promise.all([
      fetch(`/api/work/recruitment/report?organizationId=${encodeURIComponent(organizationId)}`, { cache: 'no-store' }).then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; }),
      fetch(`/api/work/members?organizationId=${encodeURIComponent(organizationId)}`, { cache: 'no-store' }).then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; }),
    ]).then(([reportData, memberData]) => { setReport(reportData); setMembers(memberData.members ?? []); })
      .catch(error => setNotice(error instanceof Error ? error.message : 'Hiring activity could not be loaded.'));
  }, [organizationId]);

  async function createOrganization() {
    if (organizationName.trim().length < 2 || busy) return;
    setBusy(true);
    setNotice('');
    const response = await fetch('/api/work/organizations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: organizationName }) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setNotice(data.error || 'The organisation could not be created.');
    setOrganizations(current => current.some(item => item.organizations.id === data.organization.organizations.id) ? current : [...current, data.organization]);
    setOrganizationId(data.organization.organizations.id);
    setOrganizationName('');
    setCreatingOrganization(false);
  }

  const selected = organizations.find(item => item.organizations.id === organizationId);
  const visibleOperations = selected ? operations.filter(item => (item.roles as readonly string[]).includes(selected.role)) : [];
  const metrics = report?.metrics || {};
  const metricCards = [
    ['Active jobs', metrics.activeJobs || 0, BriefcaseBusiness],
    ['Applications', metrics.totalApplications || 0, FileText],
    ['Interviews', metrics.interviews || 0, CalendarClock],
    ['Hires', metrics.hires || 0, UserCheck],
  ] as const;

  return <section className="mx-auto max-w-[1360px] p-5 sm:p-8 lg:p-10">
    <header className="flex flex-col justify-between gap-5 border-b border-[var(--border-primary)] pb-7 lg:flex-row lg:items-end">
      <div><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--accent-primary)]">Company hiring</p><h1 className="font-editorial mt-2 text-4xl leading-none sm:text-6xl">Hiring overview</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">Monitor open roles, incoming applications, interviews and recruiter activity from one company workspace.</p></div>
      <div className="flex flex-wrap items-center gap-2">{organizations.length > 1 && <select value={organizationId} onChange={event => setOrganizationId(event.target.value)} className="h-11 border border-[var(--border-primary)] bg-[var(--surface-raised)] px-4 text-sm font-semibold outline-none">{organizations.map(item => <option key={item.organizations.id} value={item.organizations.id}>{item.organizations.name}</option>)}</select>}<button onClick={() => setCreatingOrganization(true)} className="grid h-11 w-11 place-items-center border border-[var(--border-primary)] bg-[var(--surface-raised)]" aria-label="Add company"><Plus size={17} /></button>{selected && <Link href={`/work/jobs?organizationId=${encodeURIComponent(organizationId)}`} className="flex h-11 items-center gap-2 bg-[var(--accent-primary)] px-5 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-inverse)]">Post a job <ArrowRight size={15} /></Link>}</div>
    </header>

    {notice && <p className="mt-5 border-l-2 border-[var(--accent-primary)] bg-[var(--accent-soft)] p-4 text-sm text-[var(--accent-strong)]">{notice}</p>}

    {!loading && !selected && <div className="mt-7 border border-[var(--border-primary)] bg-[var(--surface-raised)] p-8 sm:p-10"><Building2 className="text-[var(--accent-primary)]" /><h2 className="font-editorial mt-6 text-4xl">Set up the company that will post jobs.</h2><p className="mt-3 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">Use the legal or trading name candidates should recognise. You become the owner and can invite authorised recruiters after setup.</p><button onClick={() => setCreatingOrganization(true)} className="mt-6 bg-[var(--accent-primary)] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-inverse)]">Create company workspace</button></div>}

    {selected && <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold">{selected.organizations.name}</p><p className="mt-1 text-xs capitalize text-[var(--text-muted)]">Your access: {selected.role}</p></div><Link href="/work/people" className="flex items-center gap-2 text-xs font-bold text-[var(--accent-primary)]"><Users size={15} />{members.length} authorised {members.length === 1 ? 'recruiter' : 'recruiters'}</Link></div>

      <div className="mt-5 grid gap-px border border-[var(--border-primary)] bg-[var(--border-primary)] sm:grid-cols-2 xl:grid-cols-4">{metricCards.map(([label, value, Icon]) => <article key={label} className="bg-[var(--surface-raised)] p-5"><div className="flex items-start justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p><Icon size={17} className="text-[var(--accent-primary)]" /></div><p className="font-editorial mt-5 text-5xl leading-none">{value}</p></article>)}</div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
        <section className="border border-[var(--border-primary)] bg-[var(--surface-raised)]"><div className="flex items-center justify-between border-b border-[var(--border-primary)] px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Vacancies</p><h2 className="font-editorial mt-1 text-2xl">Role performance</h2></div><Link href="/work/jobs" className="text-xs font-bold text-[var(--accent-primary)]">Manage all</Link></div><div>{report?.jobs.slice(0, 5).map(job => <Link href="/work/jobs" key={job.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 border-b border-[var(--border-secondary)] px-5 py-4 last:border-0 hover:bg-[var(--surface-muted)]"><span className="min-w-0"><span className="block truncate text-sm font-bold">{job.title}</span><span className="mt-1 block text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{job.status}</span></span><span className="text-center"><span className="block text-lg font-bold">{job.applications}</span><span className="text-[9px] uppercase text-[var(--text-muted)]">Applicants</span></span><ArrowRight size={15} /></Link>)}{!report?.jobs.length && <div className="px-6 py-12 text-center"><BriefcaseBusiness className="mx-auto text-[var(--text-muted)]" /><p className="mt-4 text-sm font-bold">No roles posted yet.</p><Link href="/work/jobs" className="mt-3 inline-block text-xs font-bold text-[var(--accent-primary)]">Create the first job</Link></div>}</div></section>

        <section className="border border-[var(--border-primary)] bg-[var(--surface-raised)] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Application pipeline</p><div className="mt-5 space-y-3">{(report?.funnel || []).filter(stage => stage.value > 0).slice(0, 6).map(stage => <div key={stage.name} className="flex items-center justify-between border-b border-[var(--border-secondary)] pb-3"><span className="text-sm capitalize">{stage.name.replaceAll('_', ' ')}</span><span className="font-editorial text-2xl">{stage.value}</span></div>)}{!(report?.funnel || []).some(stage => stage.value > 0) && <p className="py-8 text-sm leading-6 text-[var(--text-secondary)]">Applications will appear here as candidates enter your hiring process.</p>}</div><Link href="/work/applications" className="mt-5 flex items-center justify-between bg-[var(--accent-primary)] px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-inverse)]">Open applicants <ArrowRight size={15} /></Link></section>
      </div>

      <section className="mt-7"><div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Operations</p><h2 className="font-editorial mt-1 text-3xl">Run the hiring process</h2></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{visibleOperations.map(({ title, text, href, icon: Icon }) => <Link key={title} href={title === 'Billing' ? `${href}?organizationId=${encodeURIComponent(organizationId)}` : href} className="group border border-[var(--border-primary)] bg-[var(--surface-raised)] p-5 transition hover:border-[var(--accent-primary)]"><Icon size={19} className="text-[var(--accent-primary)]" /><div className="mt-5 flex items-center justify-between"><h3 className="font-bold">{title}</h3><ArrowRight size={15} className="transition group-hover:translate-x-1" /></div><p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{text}</p></Link>)}</div></section>
    </>}

    {creatingOrganization && <Modal close={() => setCreatingOrganization(false)}><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Company setup</p><h2 className="font-editorial mt-2 text-3xl">Add a company workspace</h2><p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">Use the company name applicants should see on every vacancy.</p><input autoFocus value={organizationName} onChange={event => setOrganizationName(event.target.value)} maxLength={120} className="mt-5 w-full border border-[var(--border-primary)] bg-[var(--bg-primary)] px-4 py-3 outline-none" placeholder="Legal or trading name" /><button onClick={createOrganization} disabled={organizationName.trim().length < 2 || busy} className="mt-4 w-full bg-[var(--accent-primary)] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-inverse)] disabled:opacity-40">{busy ? 'Creating...' : 'Create workspace'}</button></Modal>}
  </section>;
}

function Modal({ close, children }: { close: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm"><div className="relative w-full max-w-md border border-[var(--border-primary)] bg-[var(--surface-raised)] p-6 shadow-2xl"><button onClick={close} className="absolute right-5 top-5" aria-label="Close"><X size={18} /></button>{children}</div></div>;
}
