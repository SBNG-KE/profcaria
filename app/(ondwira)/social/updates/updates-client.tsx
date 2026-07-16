'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChevronRight,
  CirclePlus,
  Clock3,
  Eye,
  ImagePlus,
  LockKeyhole,
  MessageCircle,
  Palette,
  Play,
  Send,
  Sparkles,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react';

type Contact = { id: string; name: string; avatarUrl?: string | null };
type UpdateMedia = { id: string; type: 'photo' | 'video'; mimeType: string; byteSize: number; url: string | null };
type UpdateReply = { id: string; body: string; authorId: string; authorName: string; createdAt: string };
type SocialUpdate = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  isMine: boolean;
  body: string | null;
  prompt: string | null;
  moodEmoji: string | null;
  contentType: 'text' | 'photo' | 'video' | 'mixed';
  textStyle: string;
  backgroundStyle: BackgroundStyle;
  allowReplies: boolean;
  expiresAt: string;
  createdAt: string;
  media: UpdateMedia[];
  reaction: string | null;
  reactionCounts: Array<{ emoji: string; count: number }>;
  viewCount: number | null;
  viewed: boolean;
  replyCount: number;
  replies: UpdateReply[];
};

type BackgroundStyle = 'parchment' | 'terracotta' | 'ink' | 'olive' | 'gold' | 'rose';
type ComposerMode = 'text' | 'media';

const backgrounds: Record<BackgroundStyle, { background: string; color: string; label: string }> = {
  parchment: { background: 'linear-gradient(145deg, #efe6d6, #d8c7ae)', color: '#2c2422', label: 'Parchment' },
  terracotta: { background: 'linear-gradient(145deg, #b86242, #7e3828)', color: '#fff8ef', label: 'Terracotta' },
  ink: { background: 'linear-gradient(145deg, #202126, #0e0f12)', color: '#f7f1e9', label: 'Midnight ink' },
  olive: { background: 'linear-gradient(145deg, #59614b, #30372b)', color: '#f7f1e9', label: 'Old olive' },
  gold: { background: 'linear-gradient(145deg, #d1a363, #936738)', color: '#241b17', label: 'Muted gold' },
  rose: { background: 'linear-gradient(145deg, #b97c75, #744b4c)', color: '#fff8ef', label: 'Dusty rose' },
};
const reactions = ['\u{2764}\u{FE0F}', '\u{1F602}', '\u{1F60D}', '\u{1F44F}', '\u{1F525}', '\u{1F917}'];
const moods = ['', '\u{1F60C}', '\u{1F604}', '\u{1F973}', '\u{1F914}', '\u{1F4AA}', '\u{1F31A}', '\u{2728}'];
const prompts = ['', 'A small thing worth remembering', 'What made today lighter?', 'Ask me anything, quietly', 'One thing I learned today', 'Where my mind is right now'];

export default function UpdatesClient() {
  const [updates, setUpdates] = useState<SocialUpdate[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const response = await fetch('/api/social/updates', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Updates could not be loaded.');
    setUpdates(data.updates ?? []);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      Promise.all([
        load(),
        fetch('/api/social/contacts', { cache: 'no-store' }).then(response => response.ok ? response.json() : { contacts: [] }).then(data => setContacts(data.contacts ?? [])),
      ]).catch(error => setNotice(error instanceof Error ? error.message : 'Updates could not be opened.')).finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const mine = updates.filter(update => update.isMine);
  const others = updates.filter(update => !update.isMine);
  const ordered = [...others, ...mine];
  const activeUpdate = viewerIndex === null ? null : ordered[viewerIndex] ?? null;

  async function remove(id: string) {
    const response = await fetch(`/api/social/updates?id=${id}`, { method: 'DELETE' });
    if (!response.ok) return setNotice('This update could not be removed.');
    setUpdates(current => current.filter(update => update.id !== id));
    setViewerIndex(null);
  }

  return <section className="relative min-h-full overflow-hidden px-4 pb-28 pt-5 sm:px-7 sm:pb-10 sm:pt-8">
    <div className="pointer-events-none absolute inset-0 opacity-[0.13]" style={{ backgroundImage: 'radial-gradient(var(--pixel-color) 0.65px, transparent 0.65px)', backgroundSize: '5px 5px' }} />
    <div className="relative mx-auto max-w-6xl">
      <header className="grid gap-6 border-b border-[var(--border-primary)] pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="flex items-center gap-3"><p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--accent-primary)]">Social · private moments</p><span className="rounded-full border border-[var(--border-primary)] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Temporary</span></div>
          <h1 className="font-editorial mt-3 max-w-3xl text-5xl leading-[0.95] sm:text-7xl">What stays for a moment can still matter.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">Share a photograph, a short film, a thought, or a quiet question. Every update has an audience and an ending.</p>
        </div>
        <button onClick={() => setComposerOpen(true)} className="flex w-fit items-center gap-3 rounded-full bg-[var(--accent-primary)] px-5 py-3.5 text-sm font-black text-[var(--text-inverse)] shadow-[var(--shadow-glow)]"><CirclePlus size={19} /> Add a moment</button>
      </header>

      {notice && <div className="mt-5 flex items-start justify-between rounded-2xl border border-[var(--border-secondary)] bg-[var(--accent-soft)] p-4 text-sm text-[var(--accent-strong)]"><span>{notice}</span><button onClick={() => setNotice('')}><X size={15} /></button></div>}

      <section className="mt-7">
        <div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)]">The moment rail</p><h2 className="font-editorial mt-1 text-3xl">Open one at a time.</h2></div><p className="hidden text-xs text-[var(--text-muted)] sm:block">Private by structure · replies never become a public feed</p></div>
        <div className="ondwira-scrollbar flex snap-x gap-3 overflow-x-auto pb-3">
          <button onClick={() => setComposerOpen(true)} className="group flex w-28 shrink-0 snap-start flex-col items-center gap-3 rounded-[26px] border border-dashed border-[var(--accent-primary)]/45 bg-[var(--surface-raised)]/75 p-3 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full border border-[var(--accent-primary)] bg-[var(--accent-soft)] text-[var(--accent-primary)] transition group-hover:scale-105"><CirclePlus /></span>
            <span className="text-xs font-black">Your moment</span>
          </button>
          {ordered.map((update, index) => <button key={update.id} onClick={() => setViewerIndex(index)} className="group w-28 shrink-0 snap-start text-center">
            <span className={`relative mx-auto block h-[74px] w-[74px] rounded-full p-[3px] ${update.viewed ? 'bg-[var(--surface-strong)]' : 'bg-[conic-gradient(var(--accent-primary),var(--accent-warm),var(--accent-primary))]'}`}>
              <span className="relative grid h-full w-full place-items-center overflow-hidden rounded-full border-[3px] border-[var(--bg-primary)] bg-[var(--surface-raised)]">
                {update.authorAvatar ? <Image src={update.authorAvatar} alt="" fill unoptimized className="object-cover" /> : <span className="font-editorial text-2xl">{update.authorName.slice(0, 1)}</span>}
                {update.moodEmoji && <span className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full bg-[var(--surface-raised)] text-sm shadow">{update.moodEmoji}</span>}
              </span>
            </span>
            <span className="mt-2 block truncate text-xs font-black">{update.isMine ? 'You' : update.authorName}</span>
            <span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">{timeAgo(update.createdAt)}</span>
          </button>)}
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ordered.slice(0, 6).map((update, index) => <MomentCard key={update.id} update={update} onOpen={() => setViewerIndex(index)} />)}
        {!loading && !ordered.length && <div className="col-span-full grid min-h-72 place-items-center rounded-[32px] border border-[var(--border-secondary)] bg-[var(--surface-raised)]/70 p-8 text-center"><div><Sparkles className="mx-auto text-[var(--accent-primary)]" /><h2 className="font-editorial mt-4 text-3xl">The room is quiet.</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">Your approved contacts’ active moments will appear here.</p><button onClick={() => setComposerOpen(true)} className="mt-5 rounded-full bg-[var(--accent-primary)] px-5 py-3 text-sm font-black text-[var(--text-inverse)]">Share the first one</button></div></div>}
      </section>
    </div>

    {composerOpen && <MomentComposer contacts={contacts} onClose={() => setComposerOpen(false)} onPublished={async () => { setComposerOpen(false); await load(); }} onNotice={setNotice} />}
    {activeUpdate && <MomentViewer update={activeUpdate} index={viewerIndex!} total={ordered.length} onClose={() => setViewerIndex(null)} onPrevious={() => setViewerIndex(current => current === null ? null : Math.max(0, current - 1))} onNext={() => setViewerIndex(current => current === null ? null : Math.min(ordered.length - 1, current + 1))} onRefresh={load} onDelete={() => remove(activeUpdate.id)} />}
  </section>;
}

function MomentCard({ update, onOpen }: { update: SocialUpdate; onOpen: () => void }) {
  const palette = backgrounds[update.backgroundStyle] ?? backgrounds.parchment;
  return <button onClick={onOpen} className="group relative min-h-72 overflow-hidden rounded-[30px] border border-[var(--border-secondary)] text-left shadow-sm transition hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]" style={{ background: palette.background, color: palette.color }}>
    {update.media[0]?.type === 'photo' && update.media[0].url && <Image src={update.media[0].url} alt="" fill unoptimized className="object-cover transition duration-500 group-hover:scale-[1.03]" />}
    {update.media[0]?.type === 'video' && update.media[0].url && <video src={update.media[0].url} muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" />}
    {update.media.length > 0 && <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/25" />}
    <div className="relative flex min-h-72 flex-col justify-between p-5">
      <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 font-black"><span className="grid h-8 w-8 place-items-center rounded-full bg-black/15 backdrop-blur">{update.authorName.slice(0, 1)}</span>{update.isMine ? 'You' : update.authorName}</span><span className="flex items-center gap-1 opacity-70"><Clock3 size={13} />{remaining(update.expiresAt)}</span></div>
      <div>
        {update.media[0]?.type === 'video' && <span className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-white/20 text-white backdrop-blur"><Play size={18} fill="currentColor" /></span>}
        {update.prompt && <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{update.prompt}</p>}
        {update.body && <p className={`max-w-md ${update.textStyle === 'statement' ? 'text-3xl font-black leading-none' : 'font-editorial text-2xl leading-tight'}`}>{update.body}</p>}
        <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider"><span>{update.moodEmoji || '\u{2726}'} {update.contentType}</span><span className="flex items-center gap-1">Open <ChevronRight size={13} /></span></div>
      </div>
    </div>
  </button>;
}

function MomentComposer({ contacts, onClose, onPublished, onNotice }: { contacts: Contact[]; onClose: () => void; onPublished: () => void; onNotice: (message: string) => void }) {
  const [mode, setMode] = useState<ComposerMode>('text');
  const [body, setBody] = useState('');
  const [prompt, setPrompt] = useState('');
  const [mood, setMood] = useState('');
  const [background, setBackground] = useState<BackgroundStyle>('terracotta');
  const [textStyle, setTextStyle] = useState('editorial');
  const [audienceMode, setAudienceMode] = useState<'all_contacts' | 'selected'>('all_contacts');
  const [selected, setSelected] = useState<string[]>([]);
  const [hours, setHours] = useState(24);
  const [allowReplies, setAllowReplies] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map(file => ({ file, url: URL.createObjectURL(file) })), [files]);
  useEffect(() => () => previews.forEach(preview => URL.revokeObjectURL(preview.url)), [previews]);
  const palette = backgrounds[background];

  function selectFiles(next: FileList | null) {
    const chosen = [...(next ?? [])];
    const videos = chosen.filter(file => file.type.startsWith('video/'));
    if (videos.length) setFiles([videos[0]]);
    else setFiles(chosen.slice(0, 4));
    setMode('media');
  }

  async function publish() {
    if (busy || (!body.trim() && !files.length) || (audienceMode === 'selected' && !selected.length)) return;
    setBusy(true);
    let response: Response;
    if (files.length) {
      const form = new FormData();
      files.forEach(file => form.append('files', file));
      form.set('body', body);
      form.set('prompt', prompt);
      form.set('moodEmoji', mood);
      form.set('backgroundStyle', background);
      form.set('textStyle', textStyle);
      form.set('audienceMode', audienceMode);
      form.set('audienceIds', JSON.stringify(selected));
      form.set('durationHours', String(hours));
      form.set('allowReplies', String(allowReplies));
      response = await fetch('/api/social/updates/media', { method: 'POST', body: form });
    } else {
      response = await fetch('/api/social/updates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body, prompt, moodEmoji: mood, backgroundStyle: background, textStyle, audienceMode, audienceIds: selected, durationHours: hours, allowReplies }) });
    }
    const data = await response.json(); setBusy(false);
    if (!response.ok) return onNotice(data.error || 'The moment could not be shared.');
    onPublished();
  }

  return <div className="ondwira-scrollbar fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/65 p-3 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true" aria-label="Create a Social update">
    <div className="my-auto grid w-full max-w-5xl overflow-hidden rounded-[34px] border border-white/10 bg-[var(--surface-raised)] shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative min-h-[360px] p-5 sm:min-h-[580px] sm:p-8" style={{ background: palette.background, color: palette.color }}>
        {previews.length > 0 && <div className={`absolute inset-0 grid ${previews.length > 1 ? 'grid-cols-2' : ''}`}>{previews.map(preview => preview.file.type.startsWith('video/') ? <video key={preview.url} src={preview.url} controls className="h-full w-full object-cover" /> : <span key={preview.url} className="bg-cover bg-center" style={{ backgroundImage: `url(${preview.url})` }} />)}<span className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/20" /></div>}
        <div className="relative flex h-full min-h-[320px] flex-col justify-between sm:min-h-[516px]">
          <div className="flex items-center justify-between"><span className="rounded-full bg-black/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur">Preview · {hours}h</span><span className="text-3xl">{mood || '\u{2726}'}</span></div>
          <div className="max-w-xl">
            {prompt && <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] opacity-70">{prompt}</p>}
            <p className={`${textStyle === 'statement' ? 'text-4xl font-black leading-[0.95] sm:text-6xl' : textStyle === 'modern' ? 'text-3xl font-semibold leading-tight sm:text-5xl' : 'font-editorial text-4xl leading-[0.98] sm:text-6xl'}`}>{body || (files.length ? 'Add a caption, or let the moment speak.' : 'Write what belongs here.')}</p>
            <p className="mt-6 flex items-center gap-2 text-xs font-bold opacity-75"><LockKeyhole size={14} /> {audienceMode === 'selected' ? `${selected.length} chosen people` : 'Approved contacts only'}</p>
          </div>
        </div>
      </div>
      <div className="ondwira-scrollbar max-h-[85dvh] overflow-y-auto p-5 sm:p-8">
        <div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--accent-primary)]">New private moment</p><h2 className="font-editorial mt-1 text-4xl">Compose it your way.</h2></div><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--surface-muted)]" aria-label="Close"><X /></button></div>
        <div className="mt-6 grid grid-cols-2 rounded-2xl bg-[var(--surface-muted)] p-1 text-xs font-black"><button onClick={() => { setMode('text'); setFiles([]); }} className={`flex items-center justify-center gap-2 rounded-xl p-3 ${mode === 'text' ? 'bg-[var(--surface-raised)] shadow' : ''}`}><Palette size={15} /> Written</button><button onClick={() => setMode('media')} className={`flex items-center justify-center gap-2 rounded-xl p-3 ${mode === 'media' ? 'bg-[var(--surface-raised)] shadow' : ''}`}><ImagePlus size={15} /> Photo / video</button></div>
        {mode === 'media' && <button onClick={() => fileRef.current?.click()} className="mt-4 flex w-full items-center justify-between rounded-2xl border border-dashed border-[var(--accent-primary)]/45 bg-[var(--accent-soft)] p-4 text-left"><span><span className="block text-sm font-black">{files.length ? `${files.length} item${files.length === 1 ? '' : 's'} selected` : 'Choose from your device'}</span><span className="mt-1 block text-xs text-[var(--text-secondary)]">One video or up to four photographs</span></span><Camera className="text-[var(--accent-primary)]" /><input ref={fileRef} hidden type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple onChange={event => { selectFiles(event.target.files); event.target.value = ''; }} /></button>}
        <textarea autoFocus={mode === 'text'} value={body} onChange={event => setBody(event.target.value)} maxLength={4000} rows={5} className="mt-4 w-full resize-none rounded-2xl bg-[var(--surface-muted)] p-4 text-sm leading-6 outline-none" placeholder={files.length ? 'Caption (optional)' : 'Write your moment…'} />
        <label className="mt-4 block text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Quiet prompt<select value={prompt} onChange={event => setPrompt(event.target.value)} className="mt-2 w-full rounded-2xl bg-[var(--surface-muted)] p-3 text-sm font-normal normal-case tracking-normal outline-none">{prompts.map(item => <option key={item} value={item}>{item || 'No prompt'}</option>)}</select></label>
        <div className="mt-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Mood mark</p><div className="mt-2 flex flex-wrap gap-2">{moods.map(item => <button key={item || 'none'} onClick={() => setMood(item)} className={`grid h-10 w-10 place-items-center rounded-full border text-lg ${mood === item ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)]' : 'border-[var(--border-secondary)]'}`}>{item || '\u{2014}'}</button>)}</div></div>
        {!files.length && <><div className="mt-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Matte room</p><div className="mt-2 flex flex-wrap gap-2">{(Object.keys(backgrounds) as BackgroundStyle[]).map(key => <button key={key} onClick={() => setBackground(key)} title={backgrounds[key].label} className={`h-9 w-9 rounded-full border-2 ${background === key ? 'border-[var(--text-primary)]' : 'border-transparent'}`} style={{ background: backgrounds[key].background }} />)}</div></div><div className="mt-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Voice</p><div className="mt-2 grid grid-cols-3 gap-2">{['editorial', 'modern', 'statement'].map(item => <button key={item} onClick={() => setTextStyle(item)} className={`rounded-xl border p-2 text-xs capitalize ${textStyle === item ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)]' : 'border-[var(--border-secondary)]'}`}>{item}</button>)}</div></div></>}
        <div className="mt-5 grid gap-3 rounded-[22px] border border-[var(--border-secondary)] p-4">
          <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm font-black"><UsersRound size={16} /> Audience</span><select value={audienceMode} onChange={event => setAudienceMode(event.target.value as 'all_contacts' | 'selected')} className="rounded-xl bg-[var(--surface-muted)] p-2 text-xs font-bold"><option value="all_contacts">All approved contacts</option><option value="selected">Choose people</option></select></div>
          {audienceMode === 'selected' && <div className="ondwira-scrollbar max-h-40 overflow-y-auto">{contacts.map(contact => <label key={contact.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-[var(--surface-muted)]"><input type="checkbox" checked={selected.includes(contact.id)} onChange={() => setSelected(current => current.includes(contact.id) ? current.filter(id => id !== contact.id) : [...current, contact.id])} /><span className="text-sm font-bold">{contact.name}</span>{selected.includes(contact.id) && <Check size={14} className="ml-auto text-[var(--accent-primary)]" />}</label>)}{!contacts.length && <p className="py-4 text-center text-xs text-[var(--text-secondary)]">Approved contacts will appear here.</p>}</div>}
          <div className="flex items-center justify-between"><span className="text-sm font-black">Disappears after</span><select value={hours} onChange={event => setHours(Number(event.target.value))} className="rounded-xl bg-[var(--surface-muted)] p-2 text-xs font-bold"><option value={1}>1 hour</option><option value={24}>24 hours</option><option value={72}>3 days</option><option value={168}>7 days</option></select></div>
          <label className="flex items-center justify-between text-sm font-black">Private replies <input type="checkbox" checked={allowReplies} onChange={event => setAllowReplies(event.target.checked)} /></label>
        </div>
        <button onClick={publish} disabled={busy || (!body.trim() && !files.length) || (audienceMode === 'selected' && !selected.length)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent-primary)] px-4 py-3.5 text-sm font-black text-[var(--text-inverse)] disabled:opacity-40">{busy ? 'Sharing…' : <><Sparkles size={17} /> Share this moment</>}</button>
      </div>
    </div>
  </div>;
}

function MomentViewer({ update, index, total, onClose, onPrevious, onNext, onRefresh, onDelete }: { update: SocialUpdate; index: number; total: number; onClose: () => void; onPrevious: () => void; onNext: () => void; onRefresh: () => void; onDelete: () => void }) {
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const palette = backgrounds[update.backgroundStyle] ?? backgrounds.parchment;
  useEffect(() => {
    fetch(`/api/social/updates/${update.id}/actions`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'view', completion: 35 }) }).catch(() => undefined);
    const timer = window.setTimeout(() => fetch(`/api/social/updates/${update.id}/actions`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'view', completion: 100 }) }).catch(() => undefined), 3500);
    return () => window.clearTimeout(timer);
  }, [update.id]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); if (event.key === 'ArrowLeft') onPrevious(); if (event.key === 'ArrowRight') onNext(); };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [onClose, onNext, onPrevious]);

  async function react(emoji: string) {
    await fetch(`/api/social/updates/${update.id}/actions`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'react', emoji: update.reaction === emoji ? null : emoji }) });
    await onRefresh();
  }
  async function sendReply() {
    if (!reply.trim() || busy) return;
    setBusy(true);
    const response = await fetch(`/api/social/updates/${update.id}/actions`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reply', body: reply }) });
    setBusy(false); if (response.ok) setReply('');
  }

  return <div className="fixed inset-0 z-[100] grid bg-[#09090b] text-white lg:grid-cols-[1fr_350px]" role="dialog" aria-modal="true" aria-label={`${update.authorName}'s update`}>
    <div className="relative flex min-h-0 items-center justify-center overflow-hidden p-3 sm:p-7">
      <div className="absolute inset-x-3 top-3 z-30 flex gap-1 sm:inset-x-7 sm:top-5">{Array.from({ length: total }).map((_, itemIndex) => <span key={itemIndex} className={`h-1 flex-1 rounded-full ${itemIndex <= index ? 'bg-white' : 'bg-white/25'}`} />)}</div>
      <div className="absolute inset-x-4 top-9 z-30 flex items-center justify-between sm:inset-x-8"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-white/15 font-editorial">{update.authorAvatar ? <Image src={update.authorAvatar} alt="" width={40} height={40} unoptimized className="h-full w-full object-cover" /> : update.authorName.slice(0, 1)}</span><div><p className="text-sm font-black">{update.isMine ? 'Your moment' : update.authorName}</p><p className="text-[10px] text-white/55">{timeAgo(update.createdAt)} · ends {remaining(update.expiresAt)}</p></div></div><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-black/25"><X /></button></div>
      <article className="relative flex h-full max-h-[88dvh] min-h-[560px] w-full max-w-2xl overflow-hidden rounded-[34px] shadow-2xl" style={{ background: palette.background, color: palette.color }}>
        {update.media.length === 1 && update.media[0].type === 'photo' && update.media[0].url && <Image src={update.media[0].url} alt="" fill unoptimized priority className="object-contain" />}
        {update.media.length === 1 && update.media[0].type === 'video' && update.media[0].url && <video src={update.media[0].url} controls autoPlay playsInline className="h-full w-full object-contain" />}
        {update.media.length > 1 && <div className="absolute inset-0 grid grid-cols-2">{update.media.map(media => media.url ? <Image key={media.id} src={media.url} alt="" width={800} height={800} unoptimized className="h-full w-full object-cover" /> : null)}</div>}
        {update.media.length > 0 && <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />}
        <div className="relative mt-auto w-full p-7 sm:p-10">
          {update.moodEmoji && <p className="mb-5 text-5xl">{update.moodEmoji}</p>}
          {update.prompt && <p className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] opacity-70">{update.prompt}</p>}
          {update.body && <p className={`${update.textStyle === 'statement' ? 'text-4xl font-black leading-[0.94] sm:text-6xl' : update.textStyle === 'modern' ? 'text-3xl font-semibold leading-tight sm:text-5xl' : 'font-editorial text-4xl leading-[0.98] sm:text-6xl'}`}>{update.body}</p>}
          {!!update.reactionCounts.length && <div className="mt-5 flex flex-wrap gap-2">{update.reactionCounts.map(item => <span key={item.emoji} className="rounded-full bg-black/15 px-3 py-1 text-xs backdrop-blur">{item.emoji} {item.count}</span>)}</div>}
        </div>
      </article>
      {index > 0 && <button onClick={onPrevious} className="absolute left-2 top-1/2 z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/35 sm:left-8" aria-label="Previous update"><ArrowLeft /></button>}
      {index < total - 1 && <button onClick={onNext} className="absolute right-2 top-1/2 z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/35 lg:right-8" aria-label="Next update"><ArrowRight /></button>}
    </div>
    <aside className="ondwira-scrollbar min-h-0 overflow-y-auto border-l border-white/10 bg-[#151519] p-5 pt-7">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">Private response room</p>
      <div className="mt-5 grid grid-cols-6 gap-1">{reactions.map(emoji => <button key={emoji} onClick={() => react(emoji)} className={`grid h-10 place-items-center rounded-xl text-xl ${update.reaction === emoji ? 'bg-white/20' : 'hover:bg-white/10'}`}>{emoji}</button>)}</div>
      {update.isMine ? <div className="mt-7">
        <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white/5 p-4"><Eye size={16} className="text-[var(--accent-strong)]" /><p className="mt-4 text-2xl font-black">{update.viewCount ?? 0}</p><p className="text-xs text-white/45">people saw it</p></div><div className="rounded-2xl bg-white/5 p-4"><MessageCircle size={16} className="text-[var(--accent-strong)]" /><p className="mt-4 text-2xl font-black">{update.replyCount}</p><p className="text-xs text-white/45">private replies</p></div></div>
        <div className="mt-5 space-y-3">{update.replies.map(item => <div key={item.id} className="rounded-2xl bg-white/5 p-4"><div className="flex justify-between gap-3"><p className="text-xs font-black">{item.authorName}</p><p className="text-[9px] text-white/35">{timeAgo(item.createdAt)}</p></div><p className="mt-2 text-sm leading-6 text-white/75">{item.body}</p></div>)}</div>
        <button onClick={onDelete} className="mt-7 flex items-center gap-2 text-xs font-bold text-red-300"><Trash2 size={14} /> Remove this update</button>
      </div> : update.allowReplies ? <div className="mt-6"><p className="text-sm leading-6 text-white/55">Your reply is delivered privately to {update.authorName}. It never becomes a public comment.</p><div className="mt-4 flex items-end gap-2 rounded-2xl bg-white/7 p-2"><textarea value={reply} onChange={event => setReply(event.target.value)} rows={2} className="min-h-12 min-w-0 flex-1 resize-none bg-transparent p-2 text-sm outline-none" placeholder="Reply privately…" /><button onClick={sendReply} disabled={!reply.trim() || busy} className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-primary)] disabled:opacity-35"><Send size={16} /></button></div></div> : <p className="mt-6 rounded-2xl bg-white/5 p-4 text-sm text-white/50">Replies are closed for this moment.</p>}
      <div className="mt-8 border-t border-white/10 pt-5"><p className="flex items-center gap-2 text-xs text-white/45"><LockKeyhole size={14} /> No public likes, follower counts, or permanent feed.</p></div>
    </aside>
  </div>;
}

function timeAgo(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60000));
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function remaining(value: string) {
  const minutes = Math.max(0, Math.ceil((Date.parse(value) - Date.now()) / 60000));
  if (minutes < 60) return `${minutes}m left`;
  const hours = Math.ceil(minutes / 60);
  if (hours < 48) return `${hours}h left`;
  return `${Math.ceil(hours / 24)}d left`;
}
