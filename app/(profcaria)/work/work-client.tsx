'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  ChartNoAxesCombined,
  FileText,
  MessageCircle,
  Plus,
  Settings2,
  ShieldCheck,
  Users,
  WalletCards,
  X,
} from 'lucide-react';

type Organization = { role: string; organizations: { id: string; name: string } };
type Group = { id: string; name: string; group_type: string; auto_membership: boolean; conversation_id: string };
type Member = { id: string; name: string; role: string };

const companyTools = [
  { title: 'Publish jobs', text: 'Draft, review, publish and automatically close genuine vacancies.', href: '/work/jobs', icon: BriefcaseBusiness, roles: ['owner', 'admin', 'manager'] },
  { title: 'Review applicants', text: 'Screen answers, shortlist candidates and keep human decisions accountable.', href: '/work/applications', icon: FileText, roles: ['owner', 'admin', 'manager'] },
  { title: 'Team & access', text: 'Invite recruiters and managers, then control who can act for the company.', href: '/work/people', icon: Users, roles: ['owner', 'admin'] },
  { title: 'Hiring reports', text: 'See vacancy, application and hiring activity across the organisation.', href: '/work/reports', icon: ChartNoAxesCombined, roles: ['owner', 'admin', 'manager'] },
  { title: 'Wallet & billing', text: 'Manage the company wallet, usage and secure Paystack top-ups in KES.', href: '/work/billing', icon: WalletCards, roles: ['owner', 'admin'] },
  { title: 'Identity & security', text: 'Protect the owner account, recovery methods and personal sign-in.', href: '/settings', icon: ShieldCheck, roles: ['owner', 'admin', 'manager', 'member'] },
] as const;

export default function WorkClient() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [creatingOrganization, setCreatingOrganization] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/work/organizations', { cache: 'no-store' })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          router.replace('/?auth=login&intent=company');
          return null;
        }
        if (!response.ok) throw new Error(data.error || 'Company workspaces could not be loaded.');
        return data;
      })
      .then(data => {
        if (!data) return;
        setOrganizations(data.organizations ?? []);
        setOrganizationId(data.organizations?.[0]?.organizations.id ?? '');
      })
      .catch(error => setNotice(error instanceof Error ? error.message : 'Company workspaces could not be loaded.'))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!organizationId) return;
    Promise.all([
      fetch(`/api/work/groups?organizationId=${organizationId}`, { cache: 'no-store' }).then(response => response.json()),
      fetch(`/api/work/members?organizationId=${organizationId}`, { cache: 'no-store' }).then(response => response.json()),
    ]).then(([groupData, memberData]) => {
      setGroups(groupData.groups ?? []);
      setMembers(memberData.members ?? []);
    }).catch(() => setNotice('Company access details could not be loaded.'));
  }, [organizationId]);

  async function createOrganization() {
    if (organizationName.trim().length < 2 || busy) return;
    setBusy(true);
    setNotice('');
    const response = await fetch('/api/work/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: organizationName }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setNotice(data.error || 'The organisation could not be created.');
    setOrganizations(current => current.some(item => item.organizations.id === data.organization.organizations.id) ? current : [...current, data.organization]);
    setOrganizationId(data.organization.organizations.id);
    setGroups(data.group ? [data.group] : []);
    setOrganizationName('');
    setCreatingOrganization(false);
  }

  const selected = organizations.find(item => item.organizations.id === organizationId);
  const companyRoom = groups.find(group => group.auto_membership && group.conversation_id);
  const visibleTools = selected ? companyTools.filter(tool => (tool.roles as readonly string[]).includes(selected.role)) : [];

  return <section className="mx-auto max-w-6xl p-5 sm:p-8">
    <div className="overflow-hidden rounded-[32px] bg-[var(--accent-primary)] text-[var(--text-inverse)]">
      <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1fr_330px]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70">Company hiring</p>
          <h1 className="font-editorial mt-3 max-w-3xl text-5xl leading-none sm:text-7xl">Your hiring desk, with clear authority.</h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 opacity-75">Publish real vacancies, review applicants, invite the right hiring team and continue candidate conversations from one accountable company workspace.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            {organizations.map(item => <button key={item.organizations.id} onClick={() => setOrganizationId(item.organizations.id)} className={`rounded-2xl px-4 py-3 text-sm font-black ${organizationId === item.organizations.id ? 'bg-[var(--bg-primary)] text-[var(--accent-primary)]' : 'bg-white/10'}`}>{item.organizations.name}</button>)}
            <button onClick={() => setCreatingOrganization(true)} className="flex items-center gap-2 rounded-2xl border border-current/25 px-4 py-3 text-sm font-black"><Plus size={16} /> Add company</button>
          </div>
        </div>
        <div className="rounded-[24px] border border-white/20 bg-black/10 p-6">
          <Building2 />
          <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] opacity-65">How company access works</p>
          <p className="mt-3 text-sm leading-6 opacity-85">You always sign in as yourself. A company is a separate workspace with owner, administrator, manager and member permissions.</p>
          <p className="mt-4 text-xs leading-5 opacity-65">Candidates never receive company powers. Team members only get the access an owner or administrator assigns.</p>
        </div>
      </div>
    </div>

    {notice && <p className="mt-4 rounded-2xl bg-[var(--accent-soft)] p-4 text-sm text-[var(--accent-strong)]">{notice}</p>}

    {!loading && !selected && <div className="mt-6 rounded-[28px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-7 sm:p-9">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--accent-primary)]">Company setup</p>
      <h2 className="font-editorial mt-2 text-4xl">Create the workspace that will hire.</h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">Use the legal or trading name candidates should recognise. You will become the first owner and can invite recruiters or managers after setup.</p>
      <button onClick={() => setCreatingOrganization(true)} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[var(--accent-primary)] px-5 py-4 text-sm font-black text-[var(--text-inverse)]">Create company workspace <ArrowRight size={17} /></button>
    </div>}

    {selected && <>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.72fr]">
        <div className="rounded-[26px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">{selected.organizations.name}</p><h2 className="mt-1 text-2xl font-black">Start hiring</h2></div>
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[var(--accent-primary)]">{selected.role}</span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/work/jobs" className="flex items-center justify-between rounded-2xl bg-[var(--accent-primary)] p-4 font-black text-[var(--text-inverse)]">Create or manage a job <ArrowRight size={17} /></Link>
            <Link href="/work/applications" className="flex items-center justify-between rounded-2xl bg-[var(--surface-muted)] p-4 font-black">Review applicants <ArrowRight size={17} /></Link>
          </div>
        </div>
        <div className="rounded-[26px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-6">
          <p className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">Workspace readiness</p>
          <div className="mt-5 space-y-4 text-sm">
            <ReadinessRow done label="Company workspace created" />
            <ReadinessRow done={members.length > 1} label={members.length > 1 ? `${members.length} authorised team members` : 'Invite your hiring team'} href="/work/people" />
            <ReadinessRow done={Boolean(companyRoom)} label="Private company room" href={companyRoom ? `/work/chat/${companyRoom.conversation_id}` : '/work/people'} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleTools.map(({ title, text, href, icon: Icon }) => <Link key={title} href={title === 'Wallet & billing' ? `${href}?organizationId=${encodeURIComponent(organizationId)}` : href} className="group rounded-[26px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-6 transition hover:border-[var(--accent-primary)]"><Icon className="text-[var(--accent-primary)]" /><div className="mt-7 flex items-center justify-between gap-4"><h2 className="text-lg font-black">{title}</h2><ArrowRight size={17} className="opacity-0 transition group-hover:opacity-100" /></div><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{text}</p></Link>)}</div>

      {companyRoom && <Link href={`/work/chat/${companyRoom.conversation_id}`} className="mt-6 flex flex-col justify-between gap-4 rounded-[26px] border border-[var(--border-secondary)] bg-[var(--surface-muted)] p-6 sm:flex-row sm:items-center"><div className="flex items-center gap-4"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><MessageCircle size={19} /></span><div><p className="font-black">{companyRoom.name}</p><p className="mt-1 text-xs text-[var(--text-secondary)]">A private room for active company members.</p></div></div><span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">Open company room <ArrowRight size={15} /></span></Link>}
    </>}

    {creatingOrganization && <Modal title="Create a company workspace" eyebrow="Company setup" close={() => setCreatingOrganization(false)}><p className="text-sm leading-6 text-[var(--text-secondary)]">Your personal login remains yours. This creates a separate company workspace that you own and can grant to authorised hiring staff.</p><input autoFocus value={organizationName} onChange={event => setOrganizationName(event.target.value)} maxLength={120} className="mt-5 w-full rounded-2xl bg-[var(--surface-muted)] px-4 py-3 outline-none" placeholder="Legal or trading name" /><button onClick={createOrganization} disabled={organizationName.trim().length < 2 || busy} className="mt-4 w-full rounded-2xl bg-[var(--accent-primary)] px-4 py-3 font-black text-[var(--text-inverse)] disabled:opacity-40">{busy ? 'Creating…' : 'Create company workspace'}</button></Modal>}
  </section>;
}

function ReadinessRow({ done, label, href }: { done: boolean; label: string; href?: string }) {
  const content = <><span className={`grid h-7 w-7 place-items-center rounded-full ${done ? 'bg-[var(--accent-primary)] text-[var(--text-inverse)]' : 'border border-[var(--border-primary)] text-[var(--text-muted)]'}`}>{done ? <ShieldCheck size={14} /> : <Settings2 size={14} />}</span><span className="flex-1 font-bold">{label}</span>{href && <ArrowRight size={15} />}</>;
  return href ? <Link href={href} className="flex items-center gap-3">{content}</Link> : <div className="flex items-center gap-3">{content}</div>;
}

function Modal({ title, eyebrow, close, children }: { title: string; eyebrow: string; close: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-raised)] p-6"><div className="flex justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">{eyebrow}</p><h2 className="mt-1 text-xl font-black">{title}</h2></div><button onClick={close} aria-label="Close"><X /></button></div>{children}</div></div>;
}
