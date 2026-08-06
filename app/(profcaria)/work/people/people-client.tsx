'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  Clock3,
  Mail,
  Search,
  ShieldCheck,
  UserCheck,
  UserMinus,
  Users,
  X,
} from 'lucide-react';

type Organization = { role: string; organizations: { id: string; name: string } };
type Member = {
  id: string;
  name: string;
  role: string;
  status: string;
  joinedAt: string | null;
};
type SentInvitation = {
  id: string;
  name: string;
  role: string;
  expiresAt: string;
  createdAt: string;
};
type ReceivedInvitation = {
  id: string;
  organizationId: string;
  organizationName: string;
  role: string;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
};
type Directory = {
  organization: { id: string; name: string };
  viewer: { id: string; role: string; canManagePeople: boolean };
  members: Member[];
  invitations: SentInvitation[];
};

const roleLabels: Record<string, string> = {
  owner: 'Owner',
  admin: 'Administrator',
  manager: 'Hiring manager',
  member: 'Recruiter (view only)',
};

const roleDescriptions: Record<string, string> = {
  owner: 'Full company and hiring control',
  admin: 'Manage hiring and recruiter access',
  manager: 'Manage jobs, applicants and interviews',
  member: 'View company hiring records',
};

export default function PeopleClient() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [directory, setDirectory] = useState<Directory | null>(null);
  const [receivedInvitations, setReceivedInvitations] = useState<ReceivedInvitation[]>([]);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('manager');

  const loadInvitations = useCallback(async () => {
    const response = await fetch('/api/work/invitations', { cache: 'no-store' });
    const data = await response.json();
    if (response.ok) setReceivedInvitations(data.invitations ?? []);
  }, []);

  const loadDirectory = useCallback(async (id: string) => {
    if (!id) {
      setDirectory(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    const response = await fetch(`/api/work/people?organizationId=${encodeURIComponent(id)}`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) setError(data.error || 'Recruiter access could not be loaded.');
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
    }).catch(() => {
      setError('Company access could not be loaded.');
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => { void loadDirectory(organizationId); });
    return () => window.cancelAnimationFrame(frame);
  }, [loadDirectory, organizationId]);

  const filteredMembers = useMemo(() => {
    const search = query.trim().toLowerCase();
    return (directory?.members ?? []).filter(member =>
      !search || member.name.toLowerCase().includes(search) || (roleLabels[member.role] || member.role).toLowerCase().includes(search),
    );
  }, [directory?.members, query]);

  const activeMembers = directory?.members.filter(member => member.status === 'active') ?? [];
  const managers = activeMembers.filter(member => ['owner', 'admin', 'manager'].includes(member.role)).length;

  function clearFeedback() {
    setError('');
    setNotice('');
  }

  async function sendInvitation() {
    if (!directory || !inviteEmail.trim() || busy) return;
    clearFeedback();
    setBusy(true);
    const response = await fetch('/api/work/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId, email: inviteEmail.trim(), role: inviteRole }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) return setError(data.error || 'The recruiter invitation could not be sent.');
    setInviteOpen(false);
    setInviteEmail('');
    setInviteRole('manager');
    setNotice(`Invitation sent to ${data.invitation.email}.`);
    await loadDirectory(organizationId);
  }

  async function answerInvitation(invitationId: string, action: 'accept' | 'decline') {
    if (busy) return;
    clearFeedback();
    setBusy(true);
    const response = await fetch('/api/work/invitations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitationId, action }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) return setError(data.error || 'The invitation could not be updated.');
    await loadInvitations();
    if (action === 'decline') return setNotice('Invitation declined.');

    const organizationResponse = await fetch('/api/work/organizations', { cache: 'no-store' });
    const organizationData = await organizationResponse.json();
    setOrganizations(organizationData.organizations ?? []);
    setOrganizationId(data.organizationId);
    setNotice('Company access accepted.');
  }

  async function updateMember(userId: string, action: string, role?: string) {
    if (busy) return;
    clearFeedback();
    setBusy(true);
    const response = await fetch('/api/work/people', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId, userId, action, role }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) return setError(data.error || 'Recruiter access could not be updated.');
    setNotice(action === 'set_role' ? 'Recruiter permissions updated.' : `Recruiter access ${data.status}.`);
    await loadDirectory(organizationId);
  }

  return <section className="mx-auto w-full max-w-7xl px-4 pb-28 pt-5 sm:px-7 sm:pb-12 sm:pt-8 lg:px-10">
    <header className="flex flex-col justify-between gap-5 border-b border-[var(--border-primary)] pb-7 lg:flex-row lg:items-end">
      <div><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--accent-primary)]">Company hiring · access</p><h1 className="font-editorial mt-2 text-4xl leading-none sm:text-6xl">Recruiters and permissions</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">Invite only the people who run hiring, then control whether they can manage recruiters, make hiring decisions or view records.</p></div>
      <div className="flex flex-wrap gap-2">{organizations.length > 0 && <div className="relative"><select value={organizationId} onChange={event => setOrganizationId(event.target.value)} className="h-11 appearance-none border border-[var(--border-primary)] bg-[var(--surface-raised)] px-4 pr-10 text-sm font-bold outline-none">{organizations.map(item => <option key={item.organizations.id} value={item.organizations.id}>{item.organizations.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 text-[var(--accent-primary)]" size={16} /></div>}{directory?.viewer.canManagePeople && <button onClick={() => { clearFeedback(); setInviteOpen(true); }} className="flex h-11 items-center gap-2 bg-[var(--accent-primary)] px-5 text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-inverse)]"><Mail size={15} /> Invite recruiter</button>}</div>
    </header>

    {receivedInvitations.length > 0 && <section className="mt-5 border border-[var(--accent-primary)] bg-[var(--accent-soft)] p-5"><div className="flex items-center gap-3"><Clock3 size={18} className="text-[var(--accent-primary)]" /><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent-primary)]">Company invitations</p><p className="text-sm font-bold">Confirm the company you are joining.</p></div></div><div className="mt-4 grid gap-3 lg:grid-cols-2">{receivedInvitations.map(invitation => <article key={invitation.id} className="border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-4"><p className="font-bold">{invitation.organizationName}</p><p className="mt-1 text-xs text-[var(--text-secondary)]">{roleLabels[invitation.role] || invitation.role} · invited by {invitation.invitedBy}</p><div className="mt-4 flex gap-2"><button disabled={busy} onClick={() => answerInvitation(invitation.id, 'accept')} className="flex items-center gap-1.5 bg-[var(--accent-primary)] px-4 py-2 text-xs font-bold text-[var(--text-inverse)]"><Check size={13} /> Accept</button><button disabled={busy} onClick={() => answerInvitation(invitation.id, 'decline')} className="border border-[var(--border-primary)] px-4 py-2 text-xs font-bold">Decline</button></div></article>)}</div></section>}

    {(error || notice) && <div className={`mt-5 flex items-start justify-between border-l-2 p-4 text-sm ${error ? 'border-red-500 bg-red-500/10 text-red-600' : 'border-[var(--accent-primary)] bg-[var(--accent-soft)] text-[var(--accent-strong)]'}`} role="status"><span>{error || notice}</span><button onClick={clearFeedback} aria-label="Dismiss"><X size={15} /></button></div>}

    {!loading && organizations.length === 0 && <div className="mt-7 border border-[var(--border-primary)] bg-[var(--surface-raised)] p-10 text-center"><Users className="mx-auto text-[var(--text-muted)]" /><h2 className="font-editorial mt-5 text-3xl">Create a company first.</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">Recruiter access becomes available after the company workspace exists.</p><Link href="/work" className="mt-5 inline-block bg-[var(--accent-primary)] px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-inverse)]">Return to overview</Link></div>}
    {loading && <div className="mt-6 border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-12 text-center text-sm text-[var(--text-secondary)]">Loading recruiter access…</div>}

    {directory && !loading && <>
      <div className="mt-6 grid gap-px border border-[var(--border-primary)] bg-[var(--border-primary)] sm:grid-cols-3"><Metric label="Active recruiters" value={activeMembers.length} icon={UserCheck} /><Metric label="Hiring decision makers" value={managers} icon={ShieldCheck} /><Metric label="Pending invitations" value={directory.invitations.length} icon={Clock3} /></div>

      <section className="mt-7 border border-[var(--border-primary)] bg-[var(--surface-raised)]">
        <div className="flex flex-col justify-between gap-3 border-b border-[var(--border-primary)] p-5 sm:flex-row sm:items-center"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Authorised team</p><h2 className="font-editorial mt-1 text-3xl">Company hiring access</h2></div><label className="flex h-11 min-w-64 items-center gap-2 border border-[var(--border-primary)] px-3"><Search size={15} className="text-[var(--text-muted)]" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name or permission" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label></div>
        <div className="divide-y divide-[var(--border-secondary)]">{filteredMembers.map(member => {
          const protectedMember = member.role === 'owner' || member.id === directory.viewer.id || (directory.viewer.role === 'admin' && member.role === 'admin');
          const canEdit = directory.viewer.canManagePeople && !protectedMember;
          return <article key={member.id} className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_minmax(190px,.55fr)_auto] md:items-center"><div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center bg-[var(--accent-soft)] font-editorial text-xl text-[var(--accent-primary)]">{member.name.slice(0, 1).toUpperCase()}</span><span className="min-w-0"><span className="block truncate text-sm font-bold">{member.name}{member.id === directory.viewer.id ? ' · You' : ''}</span><span className="mt-1 block text-xs text-[var(--text-secondary)]">{member.status === 'active' ? roleDescriptions[member.role] : `Access ${member.status}`}</span></span></div><div>{canEdit ? <select value={member.role} onChange={event => updateMember(member.id, 'set_role', event.target.value)} disabled={busy} className="w-full border border-[var(--border-secondary)] bg-[var(--bg-primary)] px-3 py-2 text-xs font-bold outline-none">{directory.viewer.role === 'owner' && <option value="admin">Administrator</option>}<option value="manager">Hiring manager</option><option value="member">Recruiter (view only)</option></select> : <span className="inline-block bg-[var(--surface-muted)] px-3 py-2 text-xs font-bold">{roleLabels[member.role] || member.role}</span>}</div><div className="flex flex-wrap justify-start gap-2 md:justify-end">{canEdit && (member.status === 'active' ? <button disabled={busy} onClick={() => updateMember(member.id, 'suspend')} className="border border-[var(--border-primary)] px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Suspend</button> : <button disabled={busy} onClick={() => updateMember(member.id, 'reactivate')} className="border border-[var(--accent-primary)] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-primary)]">Reactivate</button>)}{canEdit && <button disabled={busy} onClick={() => updateMember(member.id, 'remove')} className="flex items-center gap-1 px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-red-600"><UserMinus size={13} /> Remove</button>}</div></article>;
        })}{!filteredMembers.length && <p className="p-10 text-center text-sm text-[var(--text-secondary)]">No recruiters match this search.</p>}</div>
      </section>

      {directory.invitations.length > 0 && <section className="mt-7"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Awaiting acceptance</p><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{directory.invitations.map(invitation => <article key={invitation.id} className="border border-[var(--border-primary)] bg-[var(--surface-raised)] p-4"><Mail size={16} className="text-[var(--accent-primary)]" /><p className="mt-4 text-sm font-bold">{invitation.name || 'Invited recruiter'}</p><p className="mt-1 text-xs text-[var(--text-secondary)]">{roleLabels[invitation.role] || invitation.role}</p><p className="mt-3 text-[10px] text-[var(--text-muted)]">Expires {new Date(invitation.expiresAt).toLocaleDateString()}</p></article>)}</div></section>}
    </>}

    {inviteOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Invite recruiter"><div className="relative w-full max-w-md border border-[var(--border-primary)] bg-[var(--surface-raised)] p-6 shadow-2xl"><button onClick={() => setInviteOpen(false)} className="absolute right-5 top-5" aria-label="Close"><X size={18} /></button><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Recruiter access</p><h2 className="font-editorial mt-2 text-3xl">Invite by work email</h2><p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">The email must already belong to a Profcaria account. The person chooses whether to join.</p><label className="mt-5 block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Work email<input autoFocus type="email" value={inviteEmail} onChange={event => setInviteEmail(event.target.value)} placeholder="recruiter@company.com" className="mt-2 w-full border border-[var(--border-primary)] bg-[var(--bg-primary)] px-4 py-3 text-sm font-normal normal-case tracking-normal outline-none" /></label><label className="mt-4 block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Hiring permission<select value={inviteRole} onChange={event => setInviteRole(event.target.value)} className="mt-2 w-full border border-[var(--border-primary)] bg-[var(--bg-primary)] p-3 text-sm font-bold normal-case tracking-normal outline-none">{directory?.viewer.role === 'owner' && <option value="admin">Administrator · manage recruiters and hiring</option>}<option value="manager">Hiring manager · manage jobs and applicants</option><option value="member">Recruiter · view only</option></select></label><button disabled={busy || !/^\S+@\S+\.\S+$/.test(inviteEmail)} onClick={sendInvitation} className="mt-5 w-full bg-[var(--accent-primary)] p-4 text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-inverse)] disabled:opacity-40">{busy ? 'Sending…' : 'Send invitation'}</button></div></div>}
  </section>;
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof UserCheck }) {
  return <article className="bg-[var(--surface-raised)] p-5"><div className="flex items-start justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p><Icon size={17} className="text-[var(--accent-primary)]" /></div><p className="font-editorial mt-5 text-5xl leading-none">{value}</p></article>;
}
