'use client';

import { useEffect, useState } from 'react';
import { Bot, BriefcaseBusiness, ChevronRight, FileText, KeyRound, LockKeyhole, Palette, Phone, Shield, UserRound } from 'lucide-react';

const sections = [
  { title: 'Account and identity', text: 'Name, photo, phone number, email and linked devices', icon: UserRound },
  { title: 'Privacy and safety', text: 'Blocked people, chat locks, visibility and screen privacy', icon: Shield },
  { title: 'Chats and appearance', text: 'Font, theme, wallpaper, stickers and message defaults', icon: Palette },
  { title: 'CVs and documents', text: 'CV versions, certificates, files and sharing permissions', icon: FileText },
  { title: 'Jobs and applications', text: 'Job preferences, saved work and application history', icon: BriefcaseBusiness },
  { title: 'Agent connections', text: 'Connect ChatGPT, Gemini or another agent with scoped access', icon: Bot },
  { title: 'Security', text: 'Passkeys, two-step verification, sessions and recovery', icon: KeyRound },
];

export default function SettingsClient() {
  const [findWork, setFindWork] = useState(false);
  useEffect(() => setFindWork(localStorage.getItem('ondwira_find_work') === 'true'), []);
  function updateFindWork(enabled: boolean) {
    setFindWork(enabled);
    localStorage.setItem('ondwira_find_work', String(enabled));
    window.dispatchEvent(new Event('ondwira:preferences'));
  }
  return <section className="mx-auto max-w-6xl p-5 sm:p-8"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#7b847e]">Your Ondwira</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">Settings</h1><p className="mt-2 text-[#6c756f]">Your identity, work, files, privacy, and connected agents live here.</p></div><div className="flex items-center gap-2 rounded-full bg-[#e8efe9] px-4 py-2 text-xs font-bold text-[#315548]"><LockKeyhole size={15} /> Private by default</div></div><div className="mt-7 rounded-[28px] bg-[#183d31] p-6 text-white sm:flex sm:items-center sm:justify-between"><div className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10"><BriefcaseBusiness /></span><div><h2 className="font-black">Show Find work</h2><p className="mt-1 text-sm leading-6 text-white/60">Add Find work to Social navigation and allow opportunity discovery.</p></div></div><button onClick={() => updateFindWork(!findWork)} className={`mt-5 flex h-8 w-14 items-center rounded-full p-1 transition sm:mt-0 ${findWork ? 'bg-[#f6c85f]' : 'bg-white/20'}`} aria-pressed={findWork}><span className={`h-6 w-6 rounded-full bg-white shadow transition ${findWork ? 'translate-x-6' : ''}`} /></button></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{sections.map(({ title, text, icon: Icon }) => <button key={title} className="group flex items-center gap-4 rounded-[22px] border border-[#18251f]/10 bg-white p-5 text-left transition hover:border-[#183d31]/25 hover:shadow-lg hover:shadow-[#183d31]/5"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e8efe9] text-[#183d31]"><Icon size={20} /></span><span className="min-w-0 flex-1"><span className="block font-black">{title}</span><span className="mt-1 block text-sm leading-5 text-[#747d77]">{text}</span></span><ChevronRight size={18} className="text-[#a4aaa6] transition group-hover:translate-x-0.5" /></button>)}</div><div className="mt-5 flex items-start gap-3 rounded-[22px] border border-[#d7d3c9] bg-[#eeebe4] p-5 text-sm leading-6 text-[#68716b]"><Phone size={18} className="mt-0.5 shrink-0" /><p>Phone and email belong to one Ondwira account. Workspaces are permissions attached to that account, not a separate employer login.</p></div></section>;
}
