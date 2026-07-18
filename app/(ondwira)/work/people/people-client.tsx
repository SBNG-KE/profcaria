'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive, AtSign, BriefcaseBusiness, Check, ChevronDown, Clock3, Crown,
  MessageCircle, Plus, Search, ShieldCheck, UserCheck, UserMinus, UserRoundCog,
  UsersRound, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Organization = { role: string; organizations: { id: string; name: string } };
type Employment = { title: string; status: string; started_at: string | null; ended_at: string | null; verification_status: string | null };
type Member = { id: string; name: string; username: string; avatarUrl: string | null; role: string; status: string; joinedAt: string | null; endedAt: string | null; groupIds: string[]; employment: Employment | null };
type Group = { id: string; name: string; groupType: string; autoMembership: boolean; conversationId: string | null; createdAt: string; memberIds: string[] };
type SentInvitation = { id: string; accountId: string; name: string; username: string; role: string; expiresAt: string; createdAt: string };
type ReceivedInvitation = { id: string; organizationId: string; organizationName: string; role: string; invitedBy: string; expiresAt: string; createdAt: string };
type Directory = { organization: { id: string; name: string }; viewer: { id: string; role: string; canManagePeople: boolean; canManageGroups: boolean }; members: Member[]; groups: Group[]; invitations: SentInvitation[] };

const roleLabels: Record<string, string> = { owner: 'Owner', admin: 'Administrator', manager: 'Manager', member: 'Member' };
const statusLabels: Record<string, string> = { active: 'Active', suspended: 'Suspended', removed: 'Removed', left: 'Left' };

export default function PeopleClient() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [directory, setDirectory] = useState<Directory | null>(null);
  const [receivedInvitations, setReceivedInvitations] = useState<ReceivedInvitation[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState('team');
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [managingGroup, setManagingGroup] = useState<Group | null>(null);

  const loadInvitations = useCallback(async () => {
    const response = await fetch('/api/work/invitations', { cache: 'no-store' });
    const data = await response.json();
    if (response.ok) setReceivedInvitations(data.invitations ?? []);
  }, []);

  const loadDirectory = useCallback(async (id: string) => {
    if (!id) { setDirectory(null); setLoading(false); return; }
    setLoading(true);
    const response = await fetch(`/api/work/people?organizationId=${encodeURIComponent(id)}`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) setError(data.error || 'The organisation directory could not be loaded.');
    else setDirectory(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/work/organizations', { cache: 'no-store' }).then(response => response.json()),
      fetch('/api/work/invitations', { cache: 'no-store' }).then(response => response.json()),
    ]).then(([organizationData, invitationData]) => {
      const items = organizationData.organizations ?? [];
      setOrganizations(items);
      setOrganizationId(items[0]?.organizations.id ?? '');
      setReceivedInvitations(invitationData.invitations ?? []);
      if (organizationData.error) setError(organizationData.error);
    }).catch(() => setError('Work access could not be loaded.'));
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => { void loadDirectory(organizationId); });
    return () => window.cancelAnimationFrame(frame);
  }, [loadDirectory, organizationId]);

  const filteredMembers = useMemo(() => {
    const search = query.trim().toLowerCase().replace(/^@/, '');
    return (directory?.members ?? []).filter(member => {
      const statusMatches = statusFilter === 'all' || member.status === statusFilter;
      return statusMatches && (!search || member.name.toLowerCase().includes(search) || member.username.includes(search) || member.employment?.title.toLowerCase().includes(search));
    });
  }, [directory?.members, query, statusFilter]);

  const activeMembers = directory?.members.filter(member => member.status === 'active') ?? [];
  const stats = {
    active: activeMembers.length,
    managers: activeMembers.filter(member => ['owner', 'admin', 'manager'].includes(member.role)).length,
    groups: directory?.groups.length ?? 0,
    pending: directory?.invitations.length ?? 0,
  };
  const statCards: Array<{ label: string; value: number; icon: LucideIcon }> = [
    { label: 'Active people', value: stats.active, icon: UserCheck },
    { label: 'Leads', value: stats.managers, icon: ShieldCheck },
    { label: 'Work groups', value: stats.groups, icon: UsersRound },
    { label: 'Pending', value: stats.pending, icon: Clock3 },
  ];

  function clearFeedback() { setError(''); setNotice(''); }

  async function sendInvitation() {
    if (!directory || !inviteUsername.trim() || busy) return;
    clearFeedback(); setBusy(true);
    const response = await fetch('/api/work/people', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ organizationId, username: inviteUsername, role: inviteRole }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setError(data.error || 'The invitation could not be sent.');
    setInviteOpen(false); setInviteUsername(''); setInviteRole('member'); setNotice(`Invitation sent to @${data.invitation.username}.`); await loadDirectory(organizationId);
  }

  async function answerInvitation(invitationId: string, action: 'accept' | 'decline') {
    if (busy) return;
    clearFeedback(); setBusy(true);
    const response = await fetch('/api/work/invitations', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invitationId, action }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setError(data.error || 'The invitation could not be updated.');
    await loadInvitations();
    if (action === 'accept') {
      const organizationResponse = await fetch('/api/work/organizations', { cache: 'no-store' });
      const organizationData = await organizationResponse.json();
      setOrganizations(organizationData.organizations ?? []); setOrganizationId(data.organizationId); setNotice('Work access accepted. Automatic company groups are ready.');
    } else setNotice('Invitation declined.');
  }

  async function updateMember(userId: string, action: string, role?: string) {
    if (busy) return;
    clearFeedback(); setBusy(true);
    const response = await fetch('/api/work/people', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ organizationId, userId, action, role }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setError(data.error || 'The member could not be updated.');
    setNotice(action === 'set_role' ? 'Organisation role updated.' : `Member access ${data.status}.`); await loadDirectory(organizationId);
  }

  async function createGroup() {
    if (!directory || groupName.trim().length < 2 || busy) return;
    clearFeedback(); setBusy(true);
    const response = await fetch('/api/work/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ organizationId, name: groupName, groupType, memberIds: groupMembers }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setError(data.error || 'The work group could not be created.');
    setGroupOpen(false); setGroupName(''); setGroupType('team'); setGroupMembers([]); setNotice('Work group and its private chat were created.'); await loadDirectory(organizationId);
  }

  async function updateGroup(group: Group, action: 'add_member' | 'remove_member' | 'archive', userId?: string) {
    if (busy) return;
    clearFeedback(); setBusy(true);
    const response = await fetch(`/api/work/groups/${group.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, userId }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setError(data.error || 'The work group could not be updated.');
    if (action === 'archive') setManagingGroup(null);
    setNotice(action === 'archive' ? 'Work group archived.' : 'Group membership and work chat synchronized.');
    await loadDirectory(organizationId);
    if (action !== 'archive') setManagingGroup(current => current ? { ...current, memberIds: action === 'add_member' ? [...new Set([...current.memberIds, userId!])] : current.memberIds.filter(id => id !== userId) } : null);
  }

  return <section className="relative mx-auto min-h-full w-full max-w-7xl px-4 pb-28 pt-5 sm:px-7 sm:pb-12 sm:pt-8 lg:px-10">
    <header className="overflow-hidden rounded-[30px] border border-[var(--border-secondary)] bg-[var(--surface-raised)]/92 backdrop-blur-sm">
      <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
        <div className="relative p-6 sm:p-9 lg:p-12"><div className="absolute inset-x-0 top-0 h-1 bg-[var(--accent-primary)]" /><p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--accent-primary)]">Work · people ledger</p><h1 className="font-editorial mt-5 max-w-3xl text-5xl leading-[0.92] sm:text-7xl">Every person, permission and room in its proper place.</h1><p className="mt-6 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">Invite an Ondwira account by username, assign only the access their work needs, and let employment changes open or close automatic company groups.</p></div>
        <div className="border-t border-[var(--border-secondary)] bg-[var(--surface-muted)]/55 p-6 sm:p-8 lg:border-l lg:border-t-0"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--text-muted)]">Organisation in view</p>{organizations.length ? <div className="relative mt-4"><select value={organizationId} onChange={event => setOrganizationId(event.target.value)} className="w-full appearance-none rounded-2xl border border-[var(--border-secondary)] bg-[var(--surface-raised)] px-4 py-4 pr-11 font-black outline-none focus:border-[var(--accent-primary)]">{organizations.map(item => <option key={item.organizations.id} value={item.organizations.id}>{item.organizations.name} · {roleLabels[item.role] || item.role}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-4 text-[var(--accent-primary)]" size={20} /></div> : <div className="mt-5"><p className="text-sm leading-6 text-[var(--text-secondary)]">You do not have an active organisation yet.</p><Link href="/work" className="mt-4 inline-flex rounded-full bg-[var(--accent-primary)] px-5 py-3 text-xs font-black uppercase tracking-wider text-[var(--text-inverse)]">Create an organisation</Link></div>}{directory?.viewer.canManagePeople && <button onClick={() => { clearFeedback(); setInviteOpen(true); }} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--accent-primary)] px-4 py-3 text-sm font-black text-[var(--accent-primary)]"><AtSign size={17} /> Invite by username</button>}</div>
      </div>
    </header>

    {receivedInvitations.length > 0 && <section className="mt-5 rounded-[26px] border border-[var(--accent-primary)] bg-[var(--accent-soft)]/80 p-5 sm:p-6"><div className="flex items-center gap-3"><Clock3 className="text-[var(--accent-primary)]" /><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-primary)]">Waiting for you</p><h2 className="font-editorial text-2xl">Work invitations</h2></div></div><div className="mt-4 grid gap-3 lg:grid-cols-2">{receivedInvitations.map(invitation => <article key={invitation.id} className="rounded-[20px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-4"><p className="font-black">{invitation.organizationName}</p><p className="mt-1 text-xs text-[var(--text-secondary)]">Invited by {invitation.invitedBy} · {roleLabels[invitation.role]}</p><div className="mt-4 flex gap-2"><button disabled={busy} onClick={() => answerInvitation(invitation.id, 'accept')} className="rounded-full bg-[var(--accent-primary)] px-4 py-2 text-xs font-black text-[var(--text-inverse)]">Accept</button><button disabled={busy} onClick={() => answerInvitation(invitation.id, 'decline')} className="rounded-full border border-[var(--border-primary)] px-4 py-2 text-xs font-black">Decline</button></div></article>)}</div></section>}

    {(error || notice) && <p className={`mt-5 rounded-2xl border p-4 text-sm ${error ? 'border-red-500/25 bg-red-500/10 text-red-600' : 'border-[var(--accent-primary)]/25 bg-[var(--accent-soft)] text-[var(--accent-strong)]'}`} role="status">{error || notice}</p>}
    {loading && <div className="mt-6 rounded-[28px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-12 text-center text-sm text-[var(--text-secondary)]">Opening the people ledger…</div>}

    {directory && !loading && <>
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{statCards.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-[22px] border border-[var(--border-secondary)] bg-[var(--surface-raised)]/90 p-4 sm:p-5"><Icon size={18} className="text-[var(--accent-primary)]" /><p className="font-editorial mt-4 text-4xl">{value}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p></article>)}</div>

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent-primary)]">Directory</p><h2 className="font-editorial mt-2 text-4xl">People and access</h2></div><div className="flex flex-col gap-2 sm:flex-row"><label className="flex min-w-64 items-center gap-3 rounded-2xl border border-[var(--border-secondary)] bg-[var(--surface-raised)] px-4 py-3"><Search size={17} className="text-[var(--text-muted)]" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, @username or role" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="rounded-2xl border border-[var(--border-secondary)] bg-[var(--surface-raised)] px-4 py-3 text-sm font-bold"><option value="active">Active</option>{directory.viewer.canManagePeople && <><option value="suspended">Suspended</option><option value="removed">Removed</option><option value="all">All records</option></>}</select></div></div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">{filteredMembers.map(member => {
        const protectedMember = member.role === 'owner' || member.id === directory.viewer.id || (directory.viewer.role === 'admin' && member.role === 'admin');
        const canEdit = directory.viewer.canManagePeople && !protectedMember;
        return <article key={member.id} className="rounded-[24px] border border-[var(--border-secondary)] bg-[var(--surface-raised)]/92 p-5"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[var(--accent-soft)] font-editorial text-xl text-[var(--accent-primary)]">{member.name[0]}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-black">{member.name}{member.id === directory.viewer.id ? ' · You' : ''}</h3><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${member.status === 'active' ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)]' : 'bg-[var(--surface-muted)] text-[var(--text-muted)]'}`}>{statusLabels[member.status] || member.status}</span></div><p className="mt-1 truncate text-xs text-[var(--accent-primary)]">@{member.username || 'username-pending'}</p></div>{member.role === 'owner' && <Crown size={18} className="shrink-0 text-[var(--accent-primary)]" />}</div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-y border-[var(--border-secondary)] py-4 text-xs"><div><p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Organisation role</p>{canEdit ? <select value={member.role} onChange={event => updateMember(member.id, 'set_role', event.target.value)} disabled={busy} className="mt-1 max-w-full bg-transparent font-black outline-none">{directory.viewer.role === 'owner' && <option value="admin">Administrator</option>}<option value="manager">Manager</option><option value="member">Member</option></select> : <p className="mt-1 font-black">{roleLabels[member.role] || member.role}</p>}</div><div><p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Rooms</p><p className="mt-1 font-black">{member.groupIds.length} work group{member.groupIds.length === 1 ? '' : 's'}</p></div></div>
          {member.employment ? <div className="mt-4 flex gap-3 rounded-2xl bg-[var(--surface-muted)] p-3"><BriefcaseBusiness size={17} className="mt-0.5 shrink-0 text-[var(--accent-primary)]" /><div><p className="text-sm font-black">{member.employment.title}</p><p className="mt-0.5 text-[10px] text-[var(--text-secondary)]">{member.employment.status} · {member.employment.verification_status === 'verified' ? 'verified by Ondwira' : 'recorded employment'}</p></div></div> : <p className="mt-4 text-xs text-[var(--text-muted)]">Workspace access without an active Ondwira employment record.</p>}
          {canEdit && <div className="mt-4 flex flex-wrap gap-2">{member.status === 'active' ? <button disabled={busy} onClick={() => updateMember(member.id, 'suspend')} className="rounded-full border border-[var(--border-primary)] px-3 py-2 text-[10px] font-black uppercase tracking-wider">Suspend access</button> : <button disabled={busy} onClick={() => updateMember(member.id, 'reactivate')} className="rounded-full border border-[var(--accent-primary)] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[var(--accent-primary)]">Reactivate</button>}<button disabled={busy} onClick={() => updateMember(member.id, 'remove')} className="rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-wider text-red-600"><UserMinus size={13} className="mr-1 inline" />Remove</button></div>}
        </article>;
      })}{!filteredMembers.length && <div className="rounded-[24px] border border-dashed border-[var(--border-primary)] p-10 text-center text-sm text-[var(--text-secondary)] lg:col-span-2">No people match this view.</div>}</div>

      {directory.invitations.length > 0 && <section className="mt-8"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent-primary)]">Awaiting response</p><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{directory.invitations.map(invitation => <article key={invitation.id} className="rounded-[20px] border border-dashed border-[var(--border-primary)] p-4"><p className="font-black">{invitation.name}</p><p className="mt-1 text-xs text-[var(--accent-primary)]">@{invitation.username}</p><p className="mt-3 text-[10px] text-[var(--text-muted)]">Invited as {roleLabels[invitation.role]} · expires {new Date(invitation.expiresAt).toLocaleDateString()}</p></article>)}</div></section>}

      <section className="mt-10"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent-primary)]">Rooms of work</p><h2 className="font-editorial mt-2 text-4xl">Groups and automatic access</h2></div>{directory.viewer.canManageGroups && <button onClick={() => { clearFeedback(); setGroupOpen(true); }} className="flex items-center justify-center gap-2 rounded-full bg-[var(--accent-primary)] px-5 py-3 text-xs font-black uppercase tracking-wider text-[var(--text-inverse)]"><Plus size={16} /> New group</button>}</div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{directory.groups.map(group => <article key={group.id} className="rounded-[24px] border border-[var(--border-secondary)] bg-[var(--surface-raised)]/92 p-5"><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">{group.autoMembership ? <ShieldCheck /> : <UsersRound />}</span><span className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">{group.groupType}</span></div><h3 className="font-editorial mt-6 text-2xl">{group.name}</h3><p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{group.autoMembership ? 'Everyone with active organisation access joins automatically and leaves when access ends.' : `${group.memberIds.length} selected member${group.memberIds.length === 1 ? '' : 's'} and a synchronized private work chat.`}</p><div className="mt-5 flex gap-2 border-t border-[var(--border-secondary)] pt-4">{group.conversationId && <Link href={`/work/chat/${group.conversationId}`} className="flex items-center gap-2 rounded-full border border-[var(--border-primary)] px-3 py-2 text-[10px] font-black uppercase tracking-wider"><MessageCircle size={14} /> Open chat</Link>}{directory.viewer.canManageGroups && !group.autoMembership && <button onClick={() => setManagingGroup(group)} className="flex items-center gap-2 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[var(--accent-primary)]"><UserRoundCog size={14} /> Manage</button>}</div></article>)}</div></section>
    </>}

    {inviteOpen && <Modal title="Invite an Ondwira account" eyebrow="People · exact username" close={() => setInviteOpen(false)}><p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">The person chooses whether to join. Their email and phone remain private.</p><label className="mt-5 flex items-center rounded-2xl bg-[var(--surface-muted)] px-4"><AtSign size={18} className="text-[var(--accent-primary)]" /><input autoFocus value={inviteUsername} onChange={event => setInviteUsername(event.target.value.replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="unique_username" className="min-w-0 flex-1 bg-transparent py-4 outline-none" /></label><label className="mt-4 block text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Organisation role<select value={inviteRole} onChange={event => setInviteRole(event.target.value)} className="mt-2 w-full rounded-2xl bg-[var(--surface-muted)] p-4 text-sm font-bold normal-case tracking-normal outline-none">{directory?.viewer.role === 'owner' && <option value="admin">Administrator</option>}<option value="manager">Manager</option><option value="member">Member</option></select></label><button disabled={busy || inviteUsername.length < 3} onClick={sendInvitation} className="mt-5 w-full rounded-2xl bg-[var(--accent-primary)] p-4 text-sm font-black text-[var(--text-inverse)] disabled:opacity-40">{busy ? 'Sending…' : 'Send private invitation'}</button></Modal>}

    {groupOpen && <Modal title="Create a work group" eyebrow="People · a new room" close={() => setGroupOpen(false)}><input autoFocus value={groupName} onChange={event => setGroupName(event.target.value)} maxLength={120} placeholder="Group name" className="mt-5 w-full rounded-2xl bg-[var(--surface-muted)] p-4 outline-none" /><select value={groupType} onChange={event => setGroupType(event.target.value)} className="mt-3 w-full rounded-2xl bg-[var(--surface-muted)] p-4 text-sm font-bold"><option value="team">Team</option><option value="project">Project</option><option value="custom">Custom room</option></select><p className="mt-5 text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Opening members</p><div className="ondwira-scrollbar mt-2 max-h-52 overflow-y-auto rounded-2xl border border-[var(--border-secondary)] p-2">{activeMembers.map(member => <label key={member.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-[var(--surface-muted)]"><input type="checkbox" checked={groupMembers.includes(member.id)} onChange={() => setGroupMembers(current => current.includes(member.id) ? current.filter(id => id !== member.id) : [...current, member.id])} /><span className="min-w-0 flex-1 truncate text-sm font-bold">{member.name}</span><span className="text-[10px] text-[var(--text-muted)]">@{member.username}</span></label>)}</div><button disabled={busy || groupName.trim().length < 2} onClick={createGroup} className="mt-5 w-full rounded-2xl bg-[var(--accent-primary)] p-4 text-sm font-black text-[var(--text-inverse)] disabled:opacity-40">{busy ? 'Creating…' : 'Create group and chat'}</button></Modal>}

    {managingGroup && <Modal title={managingGroup.name} eyebrow="Group membership" close={() => setManagingGroup(null)}><p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">Changes here immediately update the private work chat.</p><div className="ondwira-scrollbar mt-4 max-h-72 overflow-y-auto rounded-2xl border border-[var(--border-secondary)] p-2">{activeMembers.map(member => { const included = managingGroup.memberIds.includes(member.id); return <div key={member.id} className="flex items-center gap-3 rounded-xl p-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-sm font-black text-[var(--accent-primary)]">{member.name[0]}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{member.name}</p><p className="truncate text-[10px] text-[var(--text-muted)]">@{member.username}</p></div><button disabled={busy || (included && member.id === directory?.viewer.id)} onClick={() => updateGroup(managingGroup, included ? 'remove_member' : 'add_member', member.id)} className={`grid h-8 w-8 place-items-center rounded-full border ${included ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--text-inverse)]' : 'border-[var(--border-primary)]'} disabled:opacity-35`} aria-label={included ? `Remove ${member.name}` : `Add ${member.name}`}>{included && <Check size={15} />}</button></div>; })}</div><button disabled={busy} onClick={() => updateGroup(managingGroup, 'archive')} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 p-3 text-xs font-black uppercase tracking-wider text-red-600"><Archive size={15} /> Archive this group</button></Modal>}
  </section>;
}

function Modal({ title, eyebrow, close, children }: { title: string; eyebrow: string; close: () => void; children: React.ReactNode }) {
  return <div className="ondwira-scrollbar fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/65 p-3 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label={title}><section className="my-auto w-full max-w-lg rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-raised)] p-5 shadow-2xl sm:p-6"><header className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-primary)]">{eyebrow}</p><h2 className="font-editorial mt-1 text-3xl">{title}</h2></div><button onClick={close} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-[var(--border-secondary)]"><X size={18} /></button></header>{children}</section></div>;
}
