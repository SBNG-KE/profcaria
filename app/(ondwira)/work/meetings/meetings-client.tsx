'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { OndwiraMark } from '@/app/components/brand/OndwiraLogo';
import {
  AlarmClock,
  ArrowRight,
  BellRing,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Clock3,
  Copy,
  ExternalLink,
  Link2,
  MapPin,
  MessageCircle,
  MonitorUp,
  Sparkles,
  UsersRound,
  Video,
  X,
} from 'lucide-react';

type OrganizationMembership = { organization_id: string; role: string; organizations: { id: string; name: string } };
type Group = { id: string; name: string; conversation_id: string | null };
type Member = { id: string; name: string; role: string };
type MeetingParticipant = { userId: string; name: string; role: string; response: string };
type MeetingReminder = { reminder_minutes: number; delivered_at: string | null; dismissed_at: string | null };
type Meeting = {
  id: string;
  organizationId: string;
  groupId: string | null;
  groupName: string | null;
  organizerId: string;
  isOrganizer: boolean;
  title: string;
  agenda: string | null;
  location: string | null;
  meetingUrl: string | null;
  provider: Provider;
  startsAt: string;
  endsAt: string;
  timezone: string;
  reminderMinutes: number[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  nativeRoomReady: boolean;
  participants: MeetingParticipant[];
  viewerResponse: string;
  reminders: MeetingReminder[];
};
type Provider = 'google_meet' | 'zoom' | 'teams' | 'jitsi' | 'custom' | 'ondwira';

const providerDetails: Record<Provider, { name: string; short: string; launch?: string }> = {
  google_meet: { name: 'Google Meet', short: 'G', launch: 'https://meet.google.com/new' },
  zoom: { name: 'Zoom', short: 'Z', launch: 'https://zoom.us/start/videomeeting' },
  teams: { name: 'Microsoft Teams', short: 'T', launch: 'https://teams.microsoft.com/l/meeting/new' },
  jitsi: { name: 'Jitsi room', short: 'J' },
  custom: { name: 'Other meeting app', short: '↗' },
  ondwira: { name: 'Ondwira video', short: 'D' },
};

export default function MeetingsClient() {
  const [organizations, setOrganizations] = useState<OrganizationMembership[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedDay, setSelectedDay] = useState(startOfDay(new Date()));
  const [composerOpen, setComposerOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [clockNow, setClockNow] = useState(() => Date.now());

  const load = useCallback(async (selectedOrganization?: string) => {
    const query = selectedOrganization ? `?organizationId=${selectedOrganization}` : '';
    const response = await fetch(`/api/work/meetings${query}`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Meetings could not be loaded.');
    setOrganizations(data.organizations ?? []);
    setMeetings(data.meetings ?? []);
    if (!selectedOrganization && data.organizations?.[0]?.organization_id) setOrganizationId(data.organizations[0].organization_id);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => load().catch(error => setNotice(error.message)).finally(() => setLoading(false)), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    if (!organizationId) return;
    const timer = window.setTimeout(() => {
      Promise.all([
        fetch(`/api/work/groups?organizationId=${organizationId}`, { cache: 'no-store' }).then(response => response.json()),
        fetch(`/api/work/members?organizationId=${organizationId}`, { cache: 'no-store' }).then(response => response.json()),
        load(organizationId),
      ]).then(([groupData, memberData]) => { setGroups(groupData.groups ?? []); setMembers(memberData.members ?? []); }).catch(() => setNotice('Meeting workspace details could not be loaded.'));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [organizationId, load]);

  useEffect(() => {
    const checkReminders = () => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      meetings.forEach(meeting => meeting.reminders.filter(reminder => !reminder.delivered_at && !reminder.dismissed_at).forEach(reminder => {
        const until = Date.parse(meeting.startsAt) - Date.now();
        const threshold = reminder.reminder_minutes * 60000;
        if (until > 0 && until <= threshold + 30000) {
          new Notification(`Ondwira · ${meeting.title}`, { body: `${formatStart(meeting.startsAt)}${meeting.meetingUrl ? ' · Your joining link is ready.' : ''}`, tag: `${meeting.id}-${reminder.reminder_minutes}` });
          fetch(`/api/work/meetings/${meeting.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reminder_delivered', reminderMinutes: reminder.reminder_minutes }) }).catch(() => undefined);
        }
      }));
    };
    checkReminders();
    const timer = window.setInterval(checkReminders, 30000);
    return () => window.clearInterval(timer);
  }, [meetings]);
  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const days = useMemo(() => Array.from({ length: 14 }, (_, index) => addDays(startOfDay(new Date()), index)), []);
  const dayMeetings = meetings.filter(meeting => sameDay(new Date(meeting.startsAt), selectedDay) && meeting.status !== 'cancelled');
  const upcoming = meetings.filter(meeting => Date.parse(meeting.endsAt) > clockNow && meeting.status !== 'cancelled').sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const nextMeeting = upcoming[0];
  const selectedOrganization = organizations.find(item => item.organization_id === organizationId);

  async function enableNotifications() {
    if (typeof Notification === 'undefined') return setNotice('This device does not support browser reminders.');
    const permission = await Notification.requestPermission();
    setNotice(permission === 'granted' ? 'Meeting reminders are enabled on this device.' : 'Notification permission was not granted.');
  }

  return <section className="relative min-h-full overflow-hidden px-4 pb-28 pt-5 sm:px-7 sm:pb-10 sm:pt-8">
    <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(var(--pixel-color) 0.7px, transparent 0.7px)', backgroundSize: '5px 5px' }} />
    <div className="relative mx-auto max-w-7xl">
      <header className="grid gap-5 border-b border-[var(--border-primary)] pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div><p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--accent-primary)]">Work · meeting ledger</p><h1 className="font-editorial mt-3 max-w-4xl text-5xl leading-[0.95] sm:text-7xl">Time, people and purpose in one room.</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">Schedule into a work group, share the agenda in chat, choose the meeting app, add it to your calendar, and let Ondwira remember the time.</p></div>
        <div className="flex flex-wrap gap-2"><button onClick={enableNotifications} className="flex items-center gap-2 rounded-full border border-[var(--border-primary)] bg-[var(--surface-raised)] px-4 py-3 text-xs font-black"><BellRing size={16} /> Enable device reminders</button><button onClick={() => setComposerOpen(true)} disabled={!organizationId} className="flex items-center gap-2 rounded-full bg-[var(--accent-primary)] px-5 py-3 text-xs font-black text-[var(--text-inverse)] disabled:opacity-40"><CirclePlus size={17} /> Schedule meeting</button></div>
      </header>

      {notice && <div className="mt-5 flex items-start justify-between rounded-2xl border border-[var(--border-secondary)] bg-[var(--accent-soft)] p-4 text-sm text-[var(--accent-strong)]"><span>{notice}</span><button onClick={() => setNotice('')}><X size={15} /></button></div>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2">{organizations.map(item => <button key={item.organization_id} onClick={() => setOrganizationId(item.organization_id)} className={`rounded-full px-4 py-2.5 text-xs font-black ${organizationId === item.organization_id ? 'bg-[var(--accent-primary)] text-[var(--text-inverse)]' : 'border border-[var(--border-primary)] bg-[var(--surface-raised)]'}`}>{item.organizations.name}</button>)}</div><p className="text-xs text-[var(--text-muted)]">{selectedOrganization ? `${selectedOrganization.organizations.name} · ${selectedOrganization.role}` : 'Choose a work account'}</p></div>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="relative min-h-[350px] overflow-hidden rounded-[34px] bg-[var(--accent-primary)] p-6 text-[var(--text-inverse)] sm:p-9">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-current/15" /><div className="absolute -right-5 -top-8 h-44 w-44 rounded-full border border-current/15" />
          {nextMeeting ? <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between gap-5"><div><p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-65">Next in your ledger</p><p className="mt-3 text-sm font-bold opacity-75">{formatLongDate(nextMeeting.startsAt)}</p></div><ProviderMark provider={nextMeeting.provider} /></div>
            <div className="mt-16"><h2 className="font-editorial max-w-3xl text-4xl leading-none sm:text-6xl">{nextMeeting.title}</h2><div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold opacity-75"><span className="flex items-center gap-2"><Clock3 size={15} />{formatTimeRange(nextMeeting.startsAt, nextMeeting.endsAt)}</span>{nextMeeting.groupName && <span className="flex items-center gap-2"><MessageCircle size={15} />{nextMeeting.groupName}</span>}<span className="flex items-center gap-2"><UsersRound size={15} />{nextMeeting.participants.length} invited</span></div></div>
            <div className="mt-8 flex flex-wrap gap-2">{nextMeeting.meetingUrl ? <a href={nextMeeting.meetingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full bg-[var(--bg-primary)] px-5 py-3 text-xs font-black text-[var(--accent-primary)]">Join with {providerDetails[nextMeeting.provider].name} <ArrowRight size={15} /></a> : <span className="rounded-full border border-current/25 px-5 py-3 text-xs font-black">Joining link pending</span>}<CalendarButtons meeting={nextMeeting} compact /></div>
          </div> : <div className="relative grid h-full min-h-[290px] place-items-center text-center"><div><CalendarCheck className="mx-auto" /><h2 className="font-editorial mt-5 text-4xl">Your time is open.</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 opacity-70">Schedule a meeting and Ondwira will place it in the group conversation and your calendar flow.</p><button onClick={() => setComposerOpen(true)} disabled={!organizationId} className="mt-6 rounded-full bg-[var(--bg-primary)] px-5 py-3 text-xs font-black text-[var(--accent-primary)] disabled:opacity-40">Schedule the first meeting</button></div></div>}
        </div>

        <div className="relative overflow-hidden rounded-[34px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-6">
          <span className="absolute right-5 top-5 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[9px] font-black uppercase tracking-wider text-[var(--accent-strong)]">Coming soon</span>
          <Video className="text-[var(--accent-primary)]" size={25} /><h2 className="font-editorial mt-12 text-4xl leading-none">Ondwira rooms.</h2><p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">Native video meetings, screen sharing, hand raising, live captions and meeting notes will open directly here. External apps remain fully usable now.</p>
          <div className="mt-7 grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]"><span className="rounded-xl bg-[var(--surface-muted)] p-3"><MonitorUp className="mb-2" size={16} /> Screen share</span><span className="rounded-xl bg-[var(--surface-muted)] p-3"><Sparkles className="mb-2" size={16} /> Live notes</span></div>
          <button disabled className="mt-5 w-full rounded-2xl border border-dashed border-[var(--border-primary)] p-3 text-xs font-black text-[var(--text-muted)]">Native room unavailable for now</button>
        </div>
      </section>

      <section className="mt-7">
        <div className="flex items-end justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)]">Fourteen-day table</p><h2 className="font-editorial mt-1 text-3xl">Choose a day.</h2></div><div className="hidden items-center gap-2 text-xs text-[var(--text-muted)] sm:flex"><ChevronLeft size={15} /> Today onward <ChevronRight size={15} /></div></div>
        <div className="ondwira-scrollbar mt-4 flex snap-x gap-2 overflow-x-auto pb-3">{days.map(day => { const count = meetings.filter(meeting => sameDay(new Date(meeting.startsAt), day) && meeting.status !== 'cancelled').length; const active = sameDay(day, selectedDay); return <button key={day.toISOString()} onClick={() => setSelectedDay(day)} className={`w-[74px] shrink-0 snap-start rounded-[22px] border p-3 text-center transition ${active ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--text-inverse)]' : 'border-[var(--border-secondary)] bg-[var(--surface-raised)]'}`}><span className="block text-[9px] font-black uppercase tracking-wider opacity-65">{day.toLocaleDateString([], { weekday: 'short' })}</span><span className="font-editorial mt-1 block text-3xl">{day.getDate()}</span><span className="mt-1 block text-[9px] font-black">{count ? `${count} meeting${count === 1 ? '' : 's'}` : 'Open'}</span></button>; })}</div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        {dayMeetings.map(meeting => <MeetingCard key={meeting.id} meeting={meeting} onChanged={() => load(organizationId)} onNotice={setNotice} />)}
        {!loading && !dayMeetings.length && <div className="col-span-full rounded-[30px] border border-dashed border-[var(--border-primary)] bg-[var(--surface-raised)]/60 p-10 text-center"><CalendarDays className="mx-auto text-[var(--text-muted)]" /><h3 className="font-editorial mt-4 text-3xl">No claim on this day.</h3><p className="mt-2 text-sm text-[var(--text-secondary)]">Keep it open or schedule a focused room.</p></div>}
      </section>
    </div>

    {composerOpen && <MeetingComposer organizationId={organizationId} organizationName={selectedOrganization?.organizations.name || 'Organisation'} groups={groups} members={members} onClose={() => setComposerOpen(false)} onCreated={async () => { setComposerOpen(false); await load(organizationId); }} onNotice={setNotice} />}
  </section>;
}

function MeetingCard({ meeting, onChanged, onNotice }: { meeting: Meeting; onChanged: () => void; onNotice: (message: string) => void }) {
  async function rsvp(response: string) {
    const result = await fetch(`/api/work/meetings/${meeting.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'rsvp', response }) });
    if (!result.ok) onNotice('Your response could not be saved.'); else onChanged();
  }
  async function cancel() {
    const result = await fetch(`/api/work/meetings/${meeting.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cancel' }) });
    if (!result.ok) onNotice('This meeting could not be cancelled.'); else onChanged();
  }
  return <article className="rounded-[30px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-5 shadow-sm sm:p-6">
    <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><ProviderMark provider={meeting.provider} /><div><p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">{providerDetails[meeting.provider].name}</p><p className="mt-1 text-xs font-bold text-[var(--accent-primary)]">{formatTimeRange(meeting.startsAt, meeting.endsAt)}</p></div></div><span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider ${meeting.viewerResponse === 'accepted' ? 'bg-emerald-500/15 text-emerald-600' : meeting.viewerResponse === 'declined' ? 'bg-red-500/15 text-red-500' : 'bg-[var(--surface-muted)] text-[var(--text-muted)]'}`}>{meeting.viewerResponse}</span></div>
    <h3 className="font-editorial mt-6 text-3xl leading-tight">{meeting.title}</h3>
    {meeting.agenda && <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">{meeting.agenda}</p>}
    <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--text-muted)]">{meeting.groupName && <span className="flex items-center gap-1.5"><MessageCircle size={14} />{meeting.groupName}</span>}{meeting.location && <span className="flex items-center gap-1.5"><MapPin size={14} />{meeting.location}</span>}<span className="flex items-center gap-1.5"><AlarmClock size={14} />{meeting.reminderMinutes.map(formatReminder).join(', ')}</span></div>
    <div className="mt-5 flex -space-x-2">{meeting.participants.slice(0, 6).map(participant => <span key={participant.userId} title={`${participant.name} · ${participant.response}`} className="grid h-8 w-8 place-items-center rounded-full border-2 border-[var(--surface-raised)] bg-[var(--accent-soft)] text-[10px] font-black text-[var(--accent-primary)]">{participant.name.slice(0, 1)}</span>)}{meeting.participants.length > 6 && <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[var(--surface-raised)] bg-[var(--surface-strong)] text-[9px] font-black">+{meeting.participants.length - 6}</span>}</div>
    <div className="mt-6 flex flex-wrap gap-2">{meeting.meetingUrl && <a href={meeting.meetingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full bg-[var(--accent-primary)] px-4 py-2.5 text-xs font-black text-[var(--text-inverse)]"><Video size={14} /> Join</a>}<CalendarButtons meeting={meeting} /><button onClick={() => navigator.clipboard?.writeText(meeting.meetingUrl || `${location.origin}/work/meetings`)} className="grid h-9 w-9 place-items-center rounded-full border border-[var(--border-primary)]" title="Copy meeting link"><Copy size={14} /></button></div>
    {!meeting.isOrganizer && <div className="mt-5 flex gap-2 border-t border-[var(--border-secondary)] pt-4"><span className="mr-auto text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Your response</span>{[['accepted', 'Going'], ['tentative', 'Maybe'], ['declined', 'No']].map(([value, label]) => <button key={value} onClick={() => rsvp(value)} className={`rounded-full px-3 py-1.5 text-[10px] font-black ${meeting.viewerResponse === value ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'border border-[var(--border-primary)]'}`}>{label}</button>)}</div>}
    {meeting.isOrganizer && <button onClick={cancel} className="mt-5 text-[10px] font-black uppercase tracking-wider text-red-500">Cancel meeting</button>}
  </article>;
}

function MeetingComposer({ organizationId, organizationName, groups, members, onClose, onCreated, onNotice }: { organizationId: string; organizationName: string; groups: Group[]; members: Member[]; onClose: () => void; onCreated: () => void; onNotice: (message: string) => void }) {
  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [provider, setProvider] = useState<Exclude<Provider, 'ondwira'>>('google_meet');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [locationName, setLocationName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [startsAt, setStartsAt] = useState(defaultDateTime(1));
  const [endsAt, setEndsAt] = useState(defaultDateTime(2));
  const [reminders, setReminders] = useState<number[]>([10, 60]);
  const [busy, setBusy] = useState(false);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Nairobi';

  async function create() {
    if (!title.trim() || !startsAt || !endsAt || busy) return;
    setBusy(true);
    const response = await fetch('/api/work/meetings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ organizationId, workGroupId: groupId || null, title, agenda, provider, meetingUrl, location: locationName, startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString(), timezone, participantIds: participants, reminderMinutes: reminders }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return onNotice(data.error || 'Meeting could not be scheduled.');
    onCreated();
  }

  return <div className="ondwira-scrollbar fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/65 p-3 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true" aria-label="Schedule a Work meeting">
    <div className="my-auto grid w-full max-w-5xl overflow-hidden rounded-[34px] border border-white/10 bg-[var(--surface-raised)] shadow-2xl lg:grid-cols-[0.78fr_1.22fr]">
      <div className="relative overflow-hidden bg-[var(--accent-primary)] p-6 text-[var(--text-inverse)] sm:p-9"><div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full border border-current/15" /><p className="relative text-[10px] font-black uppercase tracking-[0.25em] opacity-65">{organizationName}</p><h2 className="font-editorial relative mt-4 text-5xl leading-none">Reserve a room in everyone’s day.</h2><div className="relative mt-12 space-y-5 text-sm"><PreviewLine icon={CalendarDays} title={startsAt ? new Date(startsAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Choose a time'} text={endsAt ? `Until ${new Date(endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'End time pending'} /><PreviewLine icon={Video} title={providerDetails[provider].name} text={meetingUrl ? 'Joining link attached' : provider === 'jitsi' ? 'A private random room will be generated' : 'Add the joining link when ready'} /><PreviewLine icon={MessageCircle} title={groups.find(group => group.id === groupId)?.name || 'No group selected'} text={groupId ? 'The meeting card will be posted into its chat' : 'Only chosen participants will see it'} /><PreviewLine icon={AlarmClock} title={reminders.map(formatReminder).join(' · ') || 'No reminders'} text="Device notifications appear while Ondwira is open" /></div></div>
      <div className="ondwira-scrollbar max-h-[88dvh] overflow-y-auto p-5 sm:p-8"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--accent-primary)]">New Work meeting</p><h3 className="font-editorial mt-1 text-4xl">Set the purpose first.</h3></div><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--surface-muted)]"><X /></button></div>
        <input autoFocus value={title} onChange={event => setTitle(event.target.value)} maxLength={160} className="mt-6 w-full rounded-2xl bg-[var(--surface-muted)] px-4 py-3.5 text-sm outline-none" placeholder="Meeting title" />
        <textarea value={agenda} onChange={event => setAgenda(event.target.value)} rows={4} maxLength={8000} className="mt-3 w-full resize-none rounded-2xl bg-[var(--surface-muted)] p-4 text-sm leading-6 outline-none" placeholder="Agenda, decisions needed, preparation…" />
        <div className="mt-4 grid grid-cols-2 gap-3"><label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Starts<input type="datetime-local" value={startsAt} onChange={event => setStartsAt(event.target.value)} className="mt-2 w-full rounded-2xl bg-[var(--surface-muted)] p-3 text-sm font-normal normal-case tracking-normal outline-none" /></label><label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Ends<input type="datetime-local" value={endsAt} onChange={event => setEndsAt(event.target.value)} className="mt-2 w-full rounded-2xl bg-[var(--surface-muted)] p-3 text-sm font-normal normal-case tracking-normal outline-none" /></label></div>
        <div className="mt-5"><p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Meeting app</p><div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">{(['google_meet', 'zoom', 'teams', 'jitsi', 'custom'] as const).map(item => <button key={item} onClick={() => setProvider(item)} className={`rounded-2xl border p-3 text-center ${provider === item ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)]' : 'border-[var(--border-secondary)]'}`}><span className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-[var(--surface-muted)] text-xs font-black">{providerDetails[item].short}</span><span className="mt-2 block truncate text-[9px] font-black">{providerDetails[item].name}</span></button>)}</div></div>
        {providerDetails[provider].launch && <a href={providerDetails[provider].launch} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-between rounded-2xl border border-[var(--border-secondary)] p-3 text-xs font-bold"><span>Open {providerDetails[provider].name} to create the room</span><ExternalLink size={14} /></a>}
        {provider !== 'jitsi' && <div className="relative mt-3"><Link2 className="absolute left-4 top-3.5 text-[var(--text-muted)]" size={16} /><input value={meetingUrl} onChange={event => setMeetingUrl(event.target.value)} className="w-full rounded-2xl bg-[var(--surface-muted)] py-3 pl-11 pr-4 text-sm outline-none" placeholder="Paste the joining link (can be added now)" /></div>}
        <div className="relative mt-3"><MapPin className="absolute left-4 top-3.5 text-[var(--text-muted)]" size={16} /><input value={locationName} onChange={event => setLocationName(event.target.value)} className="w-full rounded-2xl bg-[var(--surface-muted)] py-3 pl-11 pr-4 text-sm outline-none" placeholder="Physical room or location (optional)" /></div>
        <label className="mt-4 block text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Work group<select value={groupId} onChange={event => setGroupId(event.target.value)} className="mt-2 w-full rounded-2xl bg-[var(--surface-muted)] p-3 text-sm font-normal normal-case tracking-normal outline-none"><option value="">No group · selected people only</option>{groups.map(group => <option key={group.id} value={group.id}>{group.name} · share in chat</option>)}</select></label>
        <div className="mt-4"><p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Invite people</p><div className="ondwira-scrollbar mt-2 max-h-40 overflow-y-auto rounded-2xl border border-[var(--border-secondary)] p-2">{members.map(member => <label key={member.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-[var(--surface-muted)]"><input type="checkbox" checked={participants.includes(member.id)} onChange={() => setParticipants(current => current.includes(member.id) ? current.filter(id => id !== member.id) : [...current, member.id])} /><span className="text-sm font-bold">{member.name}</span><span className="ml-auto text-[10px] text-[var(--text-muted)]">{member.role}</span></label>)}</div></div>
        <div className="mt-4"><p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Remind me</p><div className="mt-2 flex flex-wrap gap-2">{[[10, '10 min'], [30, '30 min'], [60, '1 hour'], [1440, '1 day']].map(([value, label]) => <button key={value} onClick={() => setReminders(current => current.includes(Number(value)) ? current.filter(item => item !== Number(value)) : [...current, Number(value)])} className={`rounded-full px-3 py-2 text-[10px] font-black ${reminders.includes(Number(value)) ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'border border-[var(--border-primary)]'}`}>{reminders.includes(Number(value)) && <Check size={12} className="mr-1 inline" />}{label}</button>)}</div></div>
        <button onClick={create} disabled={!title.trim() || !startsAt || !endsAt || busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent-primary)] px-4 py-3.5 text-sm font-black text-[var(--text-inverse)] disabled:opacity-40">{busy ? 'Scheduling…' : <><CalendarCheck size={17} /> Schedule and share</>}</button>
      </div>
    </div>
  </div>;
}

function CalendarButtons({ meeting, compact = false }: { meeting: Meeting; compact?: boolean }) {
  const google = googleCalendarUrl(meeting);
  const outlook = outlookCalendarUrl(meeting);
  return <div className="flex flex-wrap gap-2"><a href={google} target="_blank" rel="noreferrer" className={`${compact ? 'border-current/25' : 'border-[var(--border-primary)]'} rounded-full border px-3 py-2.5 text-[10px] font-black`}>Google</a><a href={outlook} target="_blank" rel="noreferrer" className={`${compact ? 'border-current/25' : 'border-[var(--border-primary)]'} rounded-full border px-3 py-2.5 text-[10px] font-black`}>Outlook</a><button onClick={() => downloadIcs(meeting)} className={`${compact ? 'border-current/25' : 'border-[var(--border-primary)]'} rounded-full border px-3 py-2.5 text-[10px] font-black`}>Apple / ICS</button></div>;
}

function ProviderMark({ provider }: { provider: Provider }) {
  return <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--accent-soft)] text-sm font-black text-[var(--accent-strong)]">{provider === 'ondwira' ? <OndwiraMark className="h-7 w-6" /> : providerDetails[provider].short}</span>;
}

function PreviewLine({ icon: Icon, title, text }: { icon: typeof Video; title: string; text: string }) {
  return <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-black/10"><Icon size={16} /></span><div><p className="font-black">{title}</p><p className="mt-1 text-xs opacity-60">{text}</p></div></div>;
}

function googleCalendarUrl(meeting: Meeting) {
  const params = new URLSearchParams({ action: 'TEMPLATE', text: meeting.title, dates: `${calendarStamp(meeting.startsAt)}/${calendarStamp(meeting.endsAt)}`, details: [meeting.agenda, meeting.meetingUrl].filter(Boolean).join('\n\n'), location: meeting.location || meeting.meetingUrl || '', ctz: meeting.timezone });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function outlookCalendarUrl(meeting: Meeting) {
  const params = new URLSearchParams({ path: '/calendar/action/compose', rru: 'addevent', subject: meeting.title, startdt: meeting.startsAt, enddt: meeting.endsAt, body: [meeting.agenda, meeting.meetingUrl].filter(Boolean).join('\n\n'), location: meeting.location || meeting.meetingUrl || '' });
  return `https://outlook.office.com/calendar/0/deeplink/compose?${params}`;
}

function downloadIcs(meeting: Meeting) {
  const escape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const content = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ondwira//Meeting Ledger//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${meeting.id}@ondwira`, `DTSTAMP:${calendarStamp(new Date().toISOString())}`, `DTSTART:${calendarStamp(meeting.startsAt)}`, `DTEND:${calendarStamp(meeting.endsAt)}`, `SUMMARY:${escape(meeting.title)}`, `DESCRIPTION:${escape([meeting.agenda, meeting.meetingUrl].filter(Boolean).join('\n\n'))}`, `LOCATION:${escape(meeting.location || meeting.meetingUrl || '')}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${meeting.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'ondwira-meeting'}.ics`; anchor.click(); URL.revokeObjectURL(url);
}

function calendarStamp(value: string) { return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
function startOfDay(value: Date) { return new Date(value.getFullYear(), value.getMonth(), value.getDate()); }
function addDays(value: Date, days: number) { const result = new Date(value); result.setDate(result.getDate() + days); return result; }
function sameDay(left: Date, right: Date) { return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate(); }
function formatStart(value: string) { return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); }
function formatLongDate(value: string) { return new Date(value).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
function formatTimeRange(start: string, end: string) { return `${new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`; }
function formatReminder(value: number) { if (value === 0) return 'At start'; if (value < 60) return `${value}m`; if (value < 1440) return `${value / 60}h`; return `${value / 1440}d`; }
function defaultDateTime(hoursFromNow: number) { const date = new Date(Date.now() + hoursFromNow * 3600000); date.setMinutes(Math.ceil(date.getMinutes() / 15) * 15, 0, 0); const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return local.toISOString().slice(0, 16); }
