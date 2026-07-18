'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BriefcaseBusiness, CalendarDays, ChartNoAxesCombined, FileText, MessageCircle, Plus, Users, X } from 'lucide-react';

type Organization = { role: string; organizations: { id: string; name: string } };
type Group = { id: string; name: string; group_type: string; auto_membership: boolean; conversation_id: string };
type Member = { id: string; name: string; role: string };
const tools = [
  ['Meetings', 'Team meetings, agendas, and notes.', '/work/meetings', CalendarDays],
  ['People', 'Directory, roles, invitations and work groups.', '/work/people', Users],
  ['Jobs', 'Create, publish, and monitor jobs.', '/work/jobs', BriefcaseBusiness],
  ['Applications', 'Review candidates and decisions.', '/work/applications', FileText],
  ['Contracts', 'Review and sign agreements on screen.', '/work/contracts', FileText],
  ['Reports', 'Hiring and workforce analytics.', '/work/reports', ChartNoAxesCombined],
] as const;

export default function WorkClient() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [creatingOrganization, setCreatingOrganization] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/work/organizations').then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; })
      .then(data => { setOrganizations(data.organizations ?? []); setOrganizationId(data.organizations?.[0]?.organizations.id ?? ''); })
      .catch(error => setNotice(error.message));
  }, []);

  useEffect(() => {
    if (!organizationId) return;
    Promise.all([
      fetch(`/api/work/groups?organizationId=${organizationId}`).then(response => response.json()),
      fetch(`/api/work/members?organizationId=${organizationId}`).then(response => response.json()),
    ]).then(([groupData, memberData]) => { setGroups(groupData.groups ?? []); setMembers(memberData.members ?? []); })
      .catch(() => setNotice('Workspace details could not be loaded.'));
  }, [organizationId]);

  async function createOrganization() {
    if (organizationName.trim().length < 2 || busy) return;
    setBusy(true); setNotice('');
    const response = await fetch('/api/work/organizations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: organizationName }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setNotice(data.error || 'Organisation could not be created.');
    setOrganizations(current => [...current, data.organization]);
    setOrganizationId(data.organization.organizations.id);
    setGroups([data.group]);
    setOrganizationName(''); setCreatingOrganization(false);
  }

  async function createGroup() {
    if (!groupName.trim() || busy) return;
    setBusy(true); setNotice('');
    const response = await fetch('/api/work/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ organizationId, name: groupName, memberIds: selectedMembers }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setNotice(data.error || 'Group could not be created.');
    setGroups(current => [...current, data.group]); setGroupName(''); setSelectedMembers([]); setCreatingGroup(false);
  }

  const selected = organizations.find(item => item.organizations.id === organizationId);
  return <section className="mx-auto max-w-6xl p-5 sm:p-8">
    <div className="rounded-[32px] bg-[var(--accent-primary)] p-7 text-[var(--text-inverse)] sm:p-10">
      <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70">Work mode</p>
      <h1 className="font-editorial mt-3 text-5xl leading-none sm:text-7xl">Your organisations and teams.</h1>
      <div className="mt-7 flex flex-wrap gap-3">{organizations.map(item => <button key={item.organizations.id} onClick={() => setOrganizationId(item.organizations.id)} className={`rounded-2xl px-4 py-3 text-sm font-black ${organizationId === item.organizations.id ? 'bg-[var(--bg-primary)] text-[var(--accent-primary)]' : 'bg-white/10'}`}>{item.organizations.name}</button>)}<button onClick={() => setCreatingOrganization(true)} className="rounded-2xl border border-current/25 px-4 py-3 text-sm font-black">Create organisation</button></div>
      {!organizations.length && <p className="mt-5 max-w-xl text-sm leading-6 opacity-70">Create a work account for an organisation you own, or wait for an invitation from an employer. Your personal Ondwira identity remains unchanged.</p>}
    </div>
    {notice && <p className="mt-4 rounded-2xl bg-[var(--accent-soft)] p-4 text-sm text-[var(--accent-strong)]">{notice}</p>}

    {selected && <div className="mt-6 rounded-[26px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">{selected.organizations.name}</p><h2 className="mt-1 text-xl font-black">Work groups</h2></div>{['owner', 'admin', 'manager'].includes(selected.role) && <button onClick={() => setCreatingGroup(true)} className="flex items-center gap-2 rounded-2xl bg-[var(--accent-primary)] px-4 py-3 text-sm font-bold text-[var(--text-inverse)]"><Plus size={17} /> New group</button>}</div><div className="mt-5 grid gap-3 sm:grid-cols-2">{groups.map(group => <Link href={`/work/chat/${group.conversation_id}`} key={group.id} className="flex items-center gap-3 rounded-2xl bg-[var(--surface-muted)] p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><MessageCircle size={18} /></span><div><p className="font-black">{group.name}</p><p className="text-xs text-[var(--text-secondary)]">{group.auto_membership ? 'Automatic company group' : 'Custom group'}</p></div></Link>)}</div></div>}

    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{tools.map(([title, text, href, Icon]) => <Link key={title} href={href} className="rounded-[26px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-6 transition hover:border-[var(--accent-primary)]"><Icon className="text-[var(--accent-primary)]" /><h2 className="mt-7 text-lg font-black">{title}</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">{text}</p></Link>)}</div>

    {creatingOrganization && <Modal title="Create an organisation" eyebrow="New work account" close={() => setCreatingOrganization(false)}><p className="text-sm leading-6 text-[var(--text-secondary)]">You remain signed in as yourself. This creates a workplace you can administer and invite people into.</p><input autoFocus value={organizationName} onChange={event => setOrganizationName(event.target.value)} maxLength={120} className="mt-5 w-full rounded-2xl bg-[var(--surface-muted)] px-4 py-3 outline-none" placeholder="Organisation name" /><button onClick={createOrganization} disabled={organizationName.trim().length < 2 || busy} className="mt-4 w-full rounded-2xl bg-[var(--accent-primary)] px-4 py-3 font-black text-[var(--text-inverse)] disabled:opacity-40">{busy ? 'Creating…' : 'Create organisation'}</button></Modal>}
    {creatingGroup && <Modal title="Create work group" eyebrow="Team or project" close={() => setCreatingGroup(false)}><input autoFocus value={groupName} onChange={event => setGroupName(event.target.value)} maxLength={120} className="mt-5 w-full rounded-2xl bg-[var(--surface-muted)] px-4 py-3 outline-none" placeholder="Group name" /><p className="mt-4 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">Add people</p><div className="mt-2 max-h-40 overflow-y-auto">{members.map(member => <label key={member.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-[var(--surface-muted)]"><input type="checkbox" checked={selectedMembers.includes(member.id)} onChange={() => setSelectedMembers(current => current.includes(member.id) ? current.filter(id => id !== member.id) : [...current, member.id])} /><span className="text-sm font-bold">{member.name}</span><span className="ml-auto text-xs text-[var(--text-muted)]">{member.role}</span></label>)}</div><button onClick={createGroup} disabled={!groupName.trim() || busy} className="mt-4 w-full rounded-2xl bg-[var(--accent-primary)] px-4 py-3 font-black text-[var(--text-inverse)] disabled:opacity-40">{busy ? 'Creating…' : 'Create group'}</button></Modal>}
  </section>;
}

function Modal({ title, eyebrow, close, children }: { title: string; eyebrow: string; close: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-raised)] p-6"><div className="flex justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">{eyebrow}</p><h2 className="mt-1 text-xl font-black">{title}</h2></div><button onClick={close} aria-label="Close"><X /></button></div>{children}</div></div>;
}
