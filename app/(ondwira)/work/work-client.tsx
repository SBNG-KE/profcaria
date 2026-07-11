'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BriefcaseBusiness, CalendarDays, ChartNoAxesCombined, FileText, MessageCircle, Plus, Users, X } from 'lucide-react';

type Organization = { role: string; organizations: { id: string; name: string } };
type Group = { id: string; name: string; group_type: string; auto_membership: boolean; conversation_id: string };
type Member = { id: string; name: string; role: string };
const tools = [
  ['Meetings', 'Team meetings, agendas, and notes.', '/work/meetings', CalendarDays],
  ['People', 'Members and workspace groups.', '/work/people', Users],
  ['Jobs', 'Create, publish, and monitor jobs.', '/work/jobs', BriefcaseBusiness],
  ['Applications', 'Review candidates and decisions.', '/work/applications', FileText],
  ['Contracts', 'Review and sign agreements on screen.', '/work/contracts', FileText],
  ['Reports', 'Hiring and workforce analytics.', '/work/reports', ChartNoAxesCombined],
] as const;

export default function WorkClient() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  useEffect(() => { fetch('/api/work/organizations').then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error); return data; }).then(data => { setOrganizations(data.organizations ?? []); setOrganizationId(data.organizations?.[0]?.organizations.id ?? ''); }).catch(e => setNotice(e.message)); }, []);
  useEffect(() => { if (!organizationId) return; Promise.all([fetch(`/api/work/groups?organizationId=${organizationId}`).then(r => r.json()), fetch(`/api/work/members?organizationId=${organizationId}`).then(r => r.json())]).then(([groupData, memberData]) => { setGroups(groupData.groups ?? []); setMembers(memberData.members ?? []); }).catch(() => setNotice('Workspace details could not be loaded.')); }, [organizationId]);
  async function createGroup() { const response = await fetch('/api/work/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ organizationId, name, memberIds: selectedMembers }) }); const data = await response.json(); if (!response.ok) return setNotice(data.error || 'Group could not be created.'); setGroups(current => [...current, data.group]); setName(''); setSelectedMembers([]); setCreating(false); }
  const selected = organizations.find(item => item.organizations.id === organizationId);
  return <section className="mx-auto max-w-6xl p-5 sm:p-8"><div className="rounded-[32px] bg-[#183d31] p-7 text-white sm:p-10"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#f6c85f]">Work mode</p><h1 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-5xl">Your organisations and teams.</h1><div className="mt-7 flex flex-wrap gap-3">{organizations.map(item => <button key={item.organizations.id} onClick={() => setOrganizationId(item.organizations.id)} className={`rounded-2xl px-4 py-3 text-sm font-black ${organizationId === item.organizations.id ? 'bg-[#f6c85f] text-[#183d31]' : 'bg-white/10'}`}>{item.organizations.name}</button>)}</div>{!organizations.length && <p className="mt-5 text-sm text-white/65">No active organisation yet. A workspace is created automatically when employment begins.</p>}</div>{notice && <p className="mt-4 rounded-2xl bg-[#fff0c8] p-4 text-sm text-[#72520a]">{notice}</p>}{selected && <div className="mt-6 rounded-[26px] bg-white p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-[#7a827c]">{selected.organizations.name}</p><h2 className="mt-1 text-xl font-black">Work groups</h2></div>{['owner', 'admin', 'manager'].includes(selected.role) && <button onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-2xl bg-[#183d31] px-4 py-3 text-sm font-bold text-white"><Plus size={17} /> New group</button>}</div><div className="mt-5 grid gap-3 sm:grid-cols-2">{groups.map(group => <Link href={`/work/chat/${group.conversation_id}`} key={group.id} className="flex items-center gap-3 rounded-2xl bg-[#f0eee8] p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d9e3db]"><MessageCircle size={18} /></span><div><p className="font-black">{group.name}</p><p className="text-xs text-[#747d77]">{group.auto_membership ? 'Automatic company group' : 'Custom group'}</p></div></Link>)}</div></div>}<div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{tools.map(([title, text, href, Icon]) => <Link key={title} href={href} className="rounded-[26px] border border-[#18251f]/10 bg-white p-6"><Icon /><h2 className="mt-7 text-lg font-black">{title}</h2><p className="mt-2 text-sm text-[#6c756f]">{text}</p></Link>)}</div>{creating && <div className="fixed inset-0 z-50 grid place-items-center bg-[#17231d]/50 p-4"><div className="w-full max-w-md rounded-[28px] bg-white p-6"><div className="flex justify-between"><h2 className="text-xl font-black">Create work group</h2><button onClick={() => setCreating(false)} aria-label="Close"><X /></button></div><input autoFocus value={name} onChange={e => setName(e.target.value)} maxLength={120} className="mt-5 w-full rounded-2xl bg-[#eeebe4] px-4 py-3 outline-none" placeholder="Team or project name" /><p className="mt-4 text-xs font-black uppercase tracking-wider text-[#747d77]">Add people</p><div className="mt-2 max-h-40 overflow-y-auto">{members.map(member => <label key={member.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-[#f0eee8]"><input type="checkbox" checked={selectedMembers.includes(member.id)} onChange={() => setSelectedMembers(current => current.includes(member.id) ? current.filter(id => id !== member.id) : [...current, member.id])} /><span className="text-sm font-bold">{member.name}</span><span className="ml-auto text-xs text-[#747d77]">{member.role}</span></label>)}</div><button onClick={createGroup} disabled={!name.trim()} className="mt-4 w-full rounded-2xl bg-[#183d31] px-4 py-3 font-black text-white disabled:opacity-40">Create group</button></div></div>}</section>;
}
