'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Bot,
  CalendarPlus,
  Camera,
  ContactRound,
  FileText,
  Image as ImageIcon,
  MapPin,
  Mic,
  MoreVertical,
  Paperclip,
  Plus,
  Search,
  Send,
  ShieldAlert,
  Smile,
  Sparkles,
  Sticker,
  Video,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type DeliveryStatus = 'sent' | 'delivered' | 'read' | 'viewed';
type Attachment = { id: string; type: string; name: string; mimeType: string; byteSize: number; url: string | null };
type Poll = { id: string; question: string; allowsMultiple: boolean; options: Array<{ id: string; label: string; votes: number; mine: boolean }> };
type ChatEvent = { id: string; kind: string; title: string; description: string | null; location: string | null; startsAt: string; endsAt: string | null; meetingUrl: string | null };
export type ChatMessage = {
  id: string;
  sender_id: string;
  body: string;
  message_type: string;
  created_at: string;
  view_once: boolean;
  hidden?: boolean;
  read_by_viewer?: boolean;
  delivery_status: DeliveryStatus;
  payload?: Record<string, unknown> | null;
  attachments: Attachment[];
  reactions: Array<{ emoji: string; userId: string; mine: boolean }>;
  poll: Poll | null;
  event: ChatEvent | null;
};

type ConversationSettings = {
  title: string | null;
  kind: 'direct' | 'group';
  disappearingSeconds: number | null;
  viewOnceDefault: boolean;
  mutedUntil: string | null;
  otherMembers: Array<{ user_id: string; role: string }>;
};

type DialogKind = 'poll' | 'event' | 'meeting' | 'contact' | 'ai' | null;
const quickEmoji = ['\u{1F44D}', '\u{2764}\u{FE0F}', '\u{1F602}', '\u{1F62E}', '\u{1F622}', '\u{1F64F}'];

export default function ConversationPanel({ conversationId, context, title, subtitle, onBack }: {
  conversationId: string;
  context: 'social' | 'work';
  title: string;
  subtitle: string;
  onBack?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewerId, setViewerId] = useState('');
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [trayOpen, setTrayOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [reactionFor, setReactionFor] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [viewOnce, setViewOnce] = useState(false);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [settings, setSettings] = useState<ConversationSettings | null>(null);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [richTitle, setRichTitle] = useState('');
  const [richDescription, setRichDescription] = useState('');
  const [richLocation, setRichLocation] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const stickerRef = useRef<HTMLInputElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const response = await fetch(`/api/social/conversations/${conversationId}/messages`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Messages could not be loaded.');
    setMessages(data.messages ?? []);
    setViewerId(data.viewerId ?? '');
    const unreadIds = (data.messages ?? []).filter((message: ChatMessage) => message.sender_id !== data.viewerId && !message.read_by_viewer).map((message: ChatMessage) => message.id);
    if (unreadIds.length) window.setTimeout(() => {
      fetch(`/api/social/conversations/${conversationId}/receipts`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageIds: unreadIds }) }).catch(() => undefined);
    }, 500);
  }, [conversationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMessages([]); setNotice(''); setSearch(''); setRevealed([]);
      Promise.all([
        loadMessages(),
        fetch(`/api/social/conversations/${conversationId}/settings`, { cache: 'no-store' }).then(response => response.json()).then(setSettings),
      ]).catch(error => setNotice(error instanceof Error ? error.message : 'Conversation could not be loaded.'));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [conversationId, loadMessages]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') loadMessages().catch(() => undefined);
    }, 4000);
    return () => window.clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => { messageEndRef.current?.scrollIntoView({ block: 'end' }); }, [messages.length]);

  const shownMessages = useMemo(() => search.trim() ? messages.filter(message => message.body.toLowerCase().includes(search.trim().toLowerCase())) : messages, [messages, search]);
  const displayTitle = settings?.title || title;

  async function sendText() {
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true); setDraft(''); setNotice('');
    const response = await fetch(`/api/social/conversations/${conversationId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body, viewOnce }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setDraft(body); return setNotice(data.error || 'Message not sent.'); }
    setMessages(current => [...current, data.message]); setViewOnce(false);
  }

  async function sendRich(messageType: string, payload: Record<string, unknown>, body?: string) {
    if (busy) return;
    setBusy(true); setNotice('');
    const response = await fetch(`/api/social/conversations/${conversationId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageType, payload, body, viewOnce }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setNotice(data.error || 'Message not sent.');
    setMessages(current => [...current, data.message]); setViewOnce(false); closeDialog();
    await loadMessages().catch(() => undefined);
  }

  async function upload(file: File, kind: string) {
    setBusy(true); setNotice(''); setTrayOpen(false);
    const form = new FormData(); form.set('file', file); form.set('kind', kind); form.set('viewOnce', String(viewOnce)); form.set('caption', draft.trim());
    const response = await fetch(`/api/social/conversations/${conversationId}/attachments`, { method: 'POST', body: form });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setNotice(data.error || 'Attachment could not be sent.');
    setMessages(current => [...current, data.message]); setDraft(''); setViewOnce(false);
  }

  async function shareLocation() {
    setTrayOpen(false);
    if (!navigator.geolocation) return setNotice('Location sharing is not available on this device.');
    navigator.geolocation.getCurrentPosition(
      position => sendRich('location', { latitude: position.coords.latitude, longitude: position.coords.longitude }, 'Shared current location'),
      () => setNotice('Location permission was not granted.'),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  async function messageAction(messageId: string, input: Record<string, unknown>) {
    const response = await fetch(`/api/social/conversations/${conversationId}/messages/${messageId}/actions`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error || 'Action could not be completed.');
    if (input.action !== 'view') await loadMessages().catch(() => undefined);
  }

  async function updateSettings(input: Record<string, unknown>) {
    const response = await fetch(`/api/social/conversations/${conversationId}/settings`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error || 'Conversation setting could not be changed.');
    setNotice('Conversation setting updated.'); setMenuOpen(false);
    const refreshed = await fetch(`/api/social/conversations/${conversationId}/settings`, { cache: 'no-store' }).then(result => result.json()); setSettings(refreshed);
  }

  function closeDialog() {
    setDialog(null); setPollQuestion(''); setPollOptions(['', '']); setRichTitle(''); setRichDescription(''); setRichLocation(''); setStartsAt(''); setContactName(''); setContactPhone(''); setAiPrompt('');
  }

  async function handoffToDeviceAi() {
    const text = aiPrompt.trim() || `Help me write a reply for this Ondwira conversation: ${messages.slice(-8).map(message => message.body).join('\n')}`;
    if (navigator.share) await navigator.share({ title: 'Ondwira chat assistant', text }).catch(() => undefined);
    else if (navigator.clipboard) { await navigator.clipboard.writeText(text); setNotice('AI request copied. Paste it into the assistant on this device.'); }
    closeDialog();
  }

  return <section className="relative flex h-full min-h-0 flex-1 flex-col bg-[var(--bg-primary)]">
    <header className="flex min-h-[72px] items-center gap-3 border-b border-[var(--border-secondary)] bg-[var(--surface-raised)]/92 px-3 backdrop-blur-lg sm:px-5">
      {onBack && <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-[var(--surface-muted)] md:hidden" aria-label="Back to conversations">‹</button>}
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] font-black text-[var(--accent-primary)]">{displayTitle.slice(0, 1).toUpperCase()}</span>
      <div className="min-w-0 flex-1"><h2 className="truncate font-black">{displayTitle}</h2><p className="truncate text-xs text-[var(--text-secondary)]">{subtitle}</p></div>
      {context === 'work' && <button onClick={() => setDialog('meeting')} className="hidden items-center gap-2 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-xs font-bold text-[var(--accent-primary)] sm:flex"><Video size={16} /> Meeting</button>}
      <button onClick={() => setSearchOpen(value => !value)} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-[var(--surface-muted)]" aria-label="Search messages"><Search size={18} /></button>
      <div className="relative"><button onClick={() => setMenuOpen(value => !value)} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-[var(--surface-muted)]" aria-label="Conversation menu"><MoreVertical size={18} /></button>{menuOpen && <ConversationMenu context={context} settings={settings} onMeeting={() => { setMenuOpen(false); setDialog('meeting'); }} onMute={() => updateSettings({ action: 'mute', mutedUntil: new Date(Date.now() + 8 * 3600 * 1000).toISOString() })} onDisappear={seconds => updateSettings({ action: 'disappearing', seconds })} onReport={() => { const reason = window.prompt('What should Ondwira review?'); if (reason) updateSettings({ action: 'report', reason }); }} onBlock={() => { const accountId = settings?.otherMembers[0]?.user_id; if (accountId) updateSettings({ action: 'block', accountId }); }} />}</div>
    </header>

    {searchOpen && <div className="flex items-center gap-3 border-b border-[var(--border-secondary)] bg-[var(--surface-raised)] px-4 py-3"><Search size={17} className="text-[var(--text-muted)]" /><input autoFocus value={search} onChange={event => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search this conversation" /><button onClick={() => { setSearchOpen(false); setSearch(''); }}><X size={17} /></button></div>}
    {notice && <div className="mx-4 mt-3 flex items-start justify-between gap-3 rounded-2xl border border-[var(--border-secondary)] bg-[var(--accent-soft)] p-3 text-sm text-[var(--accent-strong)]"><span>{notice}</span><button onClick={() => setNotice('')}><X size={15} /></button></div>}

    <div className="ondwira-scrollbar min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-3 py-5 sm:px-7 sm:py-8">
      {shownMessages.map(message => <MessageCard key={message.id} message={message} mine={message.sender_id === viewerId} revealed={revealed.includes(message.id)} reactionOpen={reactionFor === message.id} onToggleReaction={() => setReactionFor(current => current === message.id ? null : message.id)} onReact={emoji => { setReactionFor(null); messageAction(message.id, { action: 'react', emoji }); }} onReveal={() => { setRevealed(current => [...current, message.id]); messageAction(message.id, { action: 'view' }); }} onVote={optionId => messageAction(message.id, { action: 'poll_vote', optionId })} onEventResponse={response => messageAction(message.id, { action: 'event_response', response })} />)}
      {!shownMessages.length && <div className="grid h-full min-h-64 place-items-center text-center"><div><Sparkles className="mx-auto text-[var(--accent-primary)]" /><h3 className="mt-4 font-editorial text-2xl">A quiet conversation starts here.</h3><p className="mt-2 text-sm text-[var(--text-secondary)]">Text, share something useful, or create a plan together.</p></div></div>}
      <div ref={messageEndRef} />
    </div>

    <footer className="border-t border-[var(--border-secondary)] bg-[var(--surface-raised)]/95 p-2.5 sm:p-4">
      {viewOnce && <div className="mb-2 flex items-center justify-between rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-xs font-bold text-[var(--accent-primary)]"><span>View once is on for the next message</span><button onClick={() => setViewOnce(false)}><X size={14} /></button></div>}
      <div className="relative flex items-end gap-1.5 rounded-[22px] border border-[var(--border-secondary)] bg-[var(--surface-muted)] p-2 shadow-sm sm:gap-2">
        <button onClick={() => { setTrayOpen(value => !value); setEmojiOpen(false); }} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl hover:bg-[var(--surface-raised)]" aria-label="Attach"><Paperclip size={19} /></button>
        <button onClick={() => { setEmojiOpen(value => !value); setTrayOpen(false); }} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl hover:bg-[var(--surface-raised)]" aria-label="Emoji"><Smile size={19} /></button>
        <textarea rows={1} value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendText(); } }} className="max-h-32 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-1 py-2.5 text-sm outline-none" placeholder={context === 'work' ? 'Message your team' : 'Message'} />
        <button onClick={() => setViewOnce(value => !value)} className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-black ${viewOnce ? 'bg-[var(--accent-primary)] text-[var(--text-inverse)]' : 'hover:bg-[var(--surface-raised)]'}`} title="View once">1</button>
        <button onClick={sendText} disabled={!draft.trim() || busy} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent-primary)] text-[var(--text-inverse)] disabled:opacity-35" aria-label="Send"><Send size={17} /></button>
        {trayOpen && <AttachmentTray context={context} onClose={() => setTrayOpen(false)} onGallery={() => galleryRef.current?.click()} onCamera={() => cameraRef.current?.click()} onDocument={() => documentRef.current?.click()} onAudio={() => audioRef.current?.click()} onSticker={() => stickerRef.current?.click()} onLocation={shareLocation} onContact={() => { setTrayOpen(false); setDialog('contact'); }} onPoll={() => { setTrayOpen(false); setDialog('poll'); }} onEvent={() => { setTrayOpen(false); setDialog('event'); }} onMeeting={() => { setTrayOpen(false); setDialog('meeting'); }} onAi={() => { setTrayOpen(false); setDialog('ai'); }} />}
        {emojiOpen && <div className="absolute bottom-[calc(100%+0.6rem)] left-10 z-30 flex flex-wrap gap-1 rounded-2xl border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-2 shadow-xl">{quickEmoji.map(emoji => <button key={emoji} onClick={() => { setDraft(current => current + emoji); setEmojiOpen(false); }} className="grid h-9 w-9 place-items-center rounded-xl text-xl hover:bg-[var(--surface-muted)]">{emoji}</button>)}</div>}
      </div>
      <input ref={galleryRef} hidden type="file" accept="image/*,video/*" onChange={event => { const file = event.target.files?.[0]; if (file) upload(file, file.type.startsWith('video/') ? 'video' : 'image'); event.target.value = ''; }} />
      <input ref={cameraRef} hidden type="file" accept="image/*" capture="environment" onChange={event => { const file = event.target.files?.[0]; if (file) upload(file, 'camera'); event.target.value = ''; }} />
      <input ref={documentRef} hidden type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" onChange={event => { const file = event.target.files?.[0]; if (file) upload(file, 'document'); event.target.value = ''; }} />
      <input ref={audioRef} hidden type="file" accept="audio/*" onChange={event => { const file = event.target.files?.[0]; if (file) upload(file, 'audio'); event.target.value = ''; }} />
      <input ref={stickerRef} hidden type="file" accept="image/png,image/webp,image/jpeg" onChange={event => { const file = event.target.files?.[0]; if (file) upload(file, 'sticker'); event.target.value = ''; }} />
    </footer>

    {dialog && <RichDialog kind={dialog} context={context} busy={busy} pollQuestion={pollQuestion} setPollQuestion={setPollQuestion} pollOptions={pollOptions} setPollOptions={setPollOptions} title={richTitle} setTitle={setRichTitle} description={richDescription} setDescription={setRichDescription} location={richLocation} setLocation={setRichLocation} startsAt={startsAt} setStartsAt={setStartsAt} contactName={contactName} setContactName={setContactName} contactPhone={contactPhone} setContactPhone={setContactPhone} aiPrompt={aiPrompt} setAiPrompt={setAiPrompt} onClose={closeDialog} onSubmit={() => {
      if (dialog === 'poll') sendRich('poll', { question: pollQuestion, options: pollOptions.filter(Boolean) }, pollQuestion);
      else if (dialog === 'contact') sendRich('contact', { name: contactName, phone: contactPhone }, `Contact: ${contactName}`);
      else if (dialog === 'ai') handoffToDeviceAi();
      else sendRich(dialog, {
        title: richTitle,
        description: richDescription,
        location: dialog === 'meeting' && /^https?:\/\//i.test(richLocation) ? '' : richLocation,
        meetingUrl: dialog === 'meeting' && /^https?:\/\//i.test(richLocation) ? richLocation : null,
        startsAt,
      }, richTitle);
    }} />}
  </section>;
}

function DeliveryCircle({ status }: { status: DeliveryStatus }) {
  const progress = status === 'sent' ? 0 : status === 'delivered' ? 48 : status === 'read' ? 75 : 100;
  return <span className="inline-flex items-center gap-1" title={status === 'sent' ? 'Sent' : status === 'delivered' ? 'Delivered' : status === 'read' ? 'Read' : 'Viewed'}><svg viewBox="0 0 20 20" className="h-4 w-4 -rotate-90" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="1.5 2.4" className="opacity-45" /><circle cx="10" cy="10" r="7" pathLength="100" fill="none" stroke="var(--accent-warm)" strokeWidth="2" strokeLinecap="round" strokeDasharray={`${progress} 100`} /></svg></span>;
}

function MessageCard({ message, mine, revealed, reactionOpen, onToggleReaction, onReact, onReveal, onVote, onEventResponse }: {
  message: ChatMessage; mine: boolean; revealed: boolean; reactionOpen: boolean; onToggleReaction: () => void; onReact: (emoji: string) => void; onReveal: () => void; onVote: (optionId: string) => void; onEventResponse: (response: string) => void;
}) {
  const protectedMessage = message.view_once && !mine && !revealed;
  const reactionGroups = Object.entries(message.reactions.reduce<Record<string, number>>((result, reaction) => ({ ...result, [reaction.emoji]: (result[reaction.emoji] || 0) + 1 }), {}));
  return <div className={`group relative mb-4 flex ${mine ? 'justify-end' : 'justify-start'}`}>
    <article className={`relative max-w-[88%] rounded-[20px] border px-4 py-3 shadow-sm sm:max-w-[72%] ${mine ? 'rounded-br-md border-transparent bg-[var(--accent-primary)] text-[var(--text-inverse)]' : 'rounded-bl-md border-[var(--border-secondary)] bg-[var(--surface-raised)] text-[var(--text-primary)]'}`}>
      {protectedMessage ? <button onClick={onReveal} className="flex min-w-48 items-center gap-3 rounded-xl border border-current/20 p-3 text-left"><span className="grid h-9 w-9 place-items-center rounded-full border border-current/30 font-black">1</span><span><span className="block text-sm font-black">View once</span><span className="text-xs opacity-70">Tap to open this message</span></span></button> : <>
        {message.attachments.map(attachment => <AttachmentCard key={attachment.id} attachment={attachment} sticker={message.message_type === 'sticker'} />)}
        {message.message_type === 'location' && message.payload && <a href={`https://www.google.com/maps?q=${message.payload.latitude},${message.payload.longitude}`} target="_blank" rel="noreferrer" className="mb-2 flex items-center gap-3 rounded-xl bg-black/10 p-3"><MapPin /><span><span className="block font-bold">Shared location</span><span className="text-xs opacity-70">Open in maps</span></span></a>}
        {message.message_type === 'contact' && message.payload && <div className="mb-2 flex items-center gap-3 rounded-xl bg-black/10 p-3"><ContactRound /><span><span className="block font-bold">{String(message.payload.name || 'Contact')}</span><span className="text-xs opacity-70">{String(message.payload.phone || '')}</span></span></div>}
        {message.poll && <PollCard poll={message.poll} onVote={onVote} />}
        {message.event && <EventCard event={message.event} onResponse={onEventResponse} />}
        {message.body && !['poll', 'event', 'meeting', 'location', 'contact'].includes(message.message_type) && <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p>}
      </>}
      <div className={`mt-1.5 flex items-center justify-end gap-2 text-[10px] ${mine ? 'text-current/65' : 'text-[var(--text-muted)]'}`}><time>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>{message.view_once && <span className="font-black">1</span>}{mine && <DeliveryCircle status={message.delivery_status || 'sent'} />}</div>
      <button onClick={onToggleReaction} className={`absolute top-1/2 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-[var(--border-secondary)] bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-md group-hover:grid ${mine ? '-left-11' : '-right-11'}`} aria-label="React"><Smile size={15} /></button>
      {reactionOpen && <div className={`absolute bottom-[calc(100%+0.35rem)] z-20 flex gap-1 rounded-full border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-1.5 shadow-xl ${mine ? 'right-0' : 'left-0'}`}>{quickEmoji.map(emoji => <button key={emoji} onClick={() => onReact(emoji)} className="grid h-8 w-8 place-items-center rounded-full text-lg hover:bg-[var(--surface-muted)]">{emoji}</button>)}</div>}
      {!!reactionGroups.length && <div className={`absolute -bottom-3 flex gap-1 ${mine ? 'right-3' : 'left-3'}`}>{reactionGroups.map(([emoji, count]) => <button key={emoji} onClick={() => onReact(emoji)} className="rounded-full border border-[var(--border-secondary)] bg-[var(--surface-raised)] px-2 py-0.5 text-xs text-[var(--text-primary)] shadow-sm">{emoji}{count > 1 ? ` ${count}` : ''}</button>)}</div>}
    </article>
  </div>;
}

function AttachmentCard({ attachment, sticker }: { attachment: Attachment; sticker: boolean }) {
  if (attachment.mimeType.startsWith('image/') && attachment.url) return <a href={attachment.url} target="_blank" rel="noreferrer"><Image src={attachment.url} alt={attachment.name} width={720} height={540} unoptimized className={`${sticker ? 'h-auto max-h-44 bg-transparent' : 'mb-2 h-auto max-h-80 rounded-xl'} max-w-full object-contain`} /></a>;
  if (attachment.mimeType.startsWith('video/') && attachment.url) return <video controls src={attachment.url} className="mb-2 max-h-80 max-w-full rounded-xl" />;
  if (attachment.mimeType.startsWith('audio/') && attachment.url) return <audio controls src={attachment.url} className="mb-2 max-w-full" />;
  return <a href={attachment.url || '#'} target="_blank" rel="noreferrer" className="mb-2 flex items-center gap-3 rounded-xl bg-black/10 p-3"><FileText /><span className="min-w-0"><span className="block truncate font-bold">{attachment.name}</span><span className="text-xs opacity-70">{formatBytes(attachment.byteSize)}</span></span></a>;
}

function PollCard({ poll, onVote }: { poll: Poll; onVote: (optionId: string) => void }) {
  const total = poll.options.reduce((sum, option) => sum + option.votes, 0);
  return <div className="min-w-56"><p className="font-bold">{poll.question}</p><div className="mt-3 space-y-2">{poll.options.map(option => <button key={option.id} onClick={() => onVote(option.id)} className="relative block w-full overflow-hidden rounded-xl border border-current/15 p-2.5 text-left text-xs"><span className="absolute inset-y-0 left-0 bg-current/10" style={{ width: `${total ? option.votes / total * 100 : 0}%` }} /><span className="relative flex justify-between gap-3"><span>{option.mine ? '● ' : '○ '}{option.label}</span><span>{option.votes}</span></span></button>)}</div><p className="mt-2 text-[10px] opacity-65">{total} vote{total === 1 ? '' : 's'}</p></div>;
}

function EventCard({ event, onResponse }: { event: ChatEvent; onResponse: (response: string) => void }) {
  return <div className="min-w-60"><div className="flex items-start gap-3"><CalendarPlus className="mt-0.5 shrink-0" /><div><p className="font-bold">{event.title}</p><p className="mt-1 text-xs opacity-70">{new Date(event.startsAt).toLocaleString()}</p>{event.location && <p className="mt-1 text-xs opacity-70">{event.location}</p>}</div></div>{event.description && <p className="mt-3 text-xs leading-5 opacity-80">{event.description}</p>}{event.meetingUrl && <a href={event.meetingUrl} target="_blank" rel="noreferrer" className="mt-3 block rounded-lg bg-black/10 px-3 py-2 text-center text-xs font-bold">Join meeting</a>}<div className="mt-3 grid grid-cols-3 gap-1">{['going', 'maybe', 'declined'].map(response => <button key={response} onClick={() => onResponse(response)} className="rounded-lg border border-current/15 px-2 py-1.5 text-[10px] capitalize">{response}</button>)}</div></div>;
}

function AttachmentTray({ context, onClose, onGallery, onCamera, onDocument, onAudio, onSticker, onLocation, onContact, onPoll, onEvent, onMeeting, onAi }: {
  context: 'social' | 'work'; onClose: () => void; onGallery: () => void; onCamera: () => void; onDocument: () => void; onAudio: () => void; onSticker: () => void; onLocation: () => void; onContact: () => void; onPoll: () => void; onEvent: () => void; onMeeting: () => void; onAi: () => void;
}) {
  const items: Array<[string, LucideIcon, () => void]> = [
    ['Gallery', ImageIcon, onGallery], ['Camera', Camera, onCamera], ['Document', FileText, onDocument], ['Audio', Mic, onAudio], ['Location', MapPin, onLocation], ['Contact', ContactRound, onContact], ['Poll', Plus, onPoll], ['Event', CalendarPlus, onEvent], ['Sticker', Sticker, onSticker], ['Device AI', Bot, onAi],
    ...(context === 'work' ? [['Meeting', Video, onMeeting] as [string, LucideIcon, () => void]] : []),
  ];
  return <div className="absolute bottom-[calc(100%+0.6rem)] left-0 z-30 w-[min(25rem,calc(100vw-2rem))] rounded-[24px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-3 text-[var(--text-primary)] shadow-2xl"><div className="flex items-center justify-between px-1 pb-2"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Add to conversation</span><button onClick={onClose}><X size={15} /></button></div><div className="grid grid-cols-4 gap-2 sm:grid-cols-5">{items.map(([label, Icon, action]) => <button key={label} onClick={action} className="flex min-w-0 flex-col items-center gap-2 rounded-2xl p-2 text-[10px] font-bold hover:bg-[var(--surface-muted)]"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><Icon size={18} /></span><span className="truncate">{label}</span></button>)}</div></div>;
}

function ConversationMenu({ context, settings, onMeeting, onMute, onDisappear, onReport, onBlock }: { context: 'social' | 'work'; settings: ConversationSettings | null; onMeeting: () => void; onMute: () => void; onDisappear: (seconds: number | null) => void; onReport: () => void; onBlock: () => void }) {
  return <div className="absolute right-0 top-11 z-40 w-64 rounded-[20px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-2 shadow-2xl">
    {context === 'work' && <MenuButton label="Set a meeting" icon={Video} onClick={onMeeting} />}
    <MenuButton label={settings?.mutedUntil ? 'Muted' : 'Mute for 8 hours'} icon={Mic} onClick={onMute} />
    <div className="px-3 py-2"><label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Disappearing messages</label><select value={settings?.disappearingSeconds ?? ''} onChange={event => onDisappear(event.target.value ? Number(event.target.value) : null)} className="mt-2 w-full rounded-xl bg-[var(--surface-muted)] p-2 text-xs outline-none"><option value="">Off</option><option value="3600">1 hour</option><option value="86400">24 hours</option><option value="604800">7 days</option><option value="7776000">90 days</option></select></div>
    <MenuButton label="Report conversation" icon={ShieldAlert} onClick={onReport} />
    {context === 'social' && settings?.kind === 'direct' && <MenuButton label="Block contact" icon={X} onClick={onBlock} danger />}
  </div>;
}

function MenuButton({ label, icon: Icon, onClick, danger = false }: { label: string; icon: typeof Search; onClick: () => void; danger?: boolean }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold hover:bg-[var(--surface-muted)] ${danger ? 'text-red-500' : ''}`}><Icon size={16} />{label}</button>;
}

function RichDialog(props: {
  kind: Exclude<DialogKind, null>; context: 'social' | 'work'; busy: boolean; pollQuestion: string; setPollQuestion: (value: string) => void; pollOptions: string[]; setPollOptions: (value: string[]) => void; title: string; setTitle: (value: string) => void; description: string; setDescription: (value: string) => void; location: string; setLocation: (value: string) => void; startsAt: string; setStartsAt: (value: string) => void; contactName: string; setContactName: (value: string) => void; contactPhone: string; setContactPhone: (value: string) => void; aiPrompt: string; setAiPrompt: (value: string) => void; onClose: () => void; onSubmit: () => void;
}) {
  const heading = props.kind === 'poll' ? 'Create a poll' : props.kind === 'meeting' ? 'Set a meeting' : props.kind === 'event' ? 'Create an event' : props.kind === 'contact' ? 'Share a contact' : 'Use your device AI';
  return <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm"><div className="w-full max-w-md rounded-[28px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent-primary)]">{props.context} conversation</p><h3 className="mt-1 font-editorial text-3xl">{heading}</h3></div><button onClick={props.onClose}><X /></button></div>
    {props.kind === 'poll' && <div className="mt-5 space-y-3"><Input value={props.pollQuestion} onChange={props.setPollQuestion} placeholder="Question" />{props.pollOptions.map((option, index) => <Input key={index} value={option} onChange={value => props.setPollOptions(props.pollOptions.map((item, itemIndex) => itemIndex === index ? value : item))} placeholder={`Option ${index + 1}`} />)}<button onClick={() => props.setPollOptions([...props.pollOptions, ''])} disabled={props.pollOptions.length >= 10} className="flex items-center gap-2 text-xs font-bold text-[var(--accent-primary)]"><Plus size={14} /> Add option</button></div>}
    {(props.kind === 'event' || props.kind === 'meeting') && <div className="mt-5 space-y-3"><Input value={props.title} onChange={props.setTitle} placeholder={props.kind === 'meeting' ? 'Meeting title' : 'Event title'} /><textarea value={props.description} onChange={event => props.setDescription(event.target.value)} rows={3} className="w-full rounded-2xl bg-[var(--surface-muted)] p-4 text-sm outline-none" placeholder="Description (optional)" /><Input value={props.location} onChange={props.setLocation} placeholder="Location or meeting link (optional)" /><label className="block text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Starts<input type="datetime-local" value={props.startsAt} onChange={event => props.setStartsAt(event.target.value)} className="mt-2 w-full rounded-2xl bg-[var(--surface-muted)] p-4 text-sm font-normal tracking-normal outline-none" /></label></div>}
    {props.kind === 'contact' && <div className="mt-5 space-y-3"><Input value={props.contactName} onChange={props.setContactName} placeholder="Contact name" /><Input value={props.contactPhone} onChange={props.setContactPhone} placeholder="Phone number" /></div>}
    {props.kind === 'ai' && <div className="mt-5"><p className="text-sm leading-6 text-[var(--text-secondary)]">Ondwira will hand this request to the AI or sharing app you choose on this device. It does not give that app permanent chat access.</p><textarea value={props.aiPrompt} onChange={event => props.setAiPrompt(event.target.value)} rows={5} className="mt-4 w-full rounded-2xl bg-[var(--surface-muted)] p-4 text-sm outline-none" placeholder="Draft a reply, rewrite my message, or summarize the recent conversation…" /></div>}
    <button onClick={props.onSubmit} disabled={props.busy} className="mt-5 w-full rounded-2xl bg-[var(--accent-primary)] px-4 py-3 text-sm font-black text-[var(--text-inverse)] disabled:opacity-40">{props.kind === 'ai' ? 'Open device AI' : 'Add to conversation'}</button>
  </div></div>;
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <input value={value} onChange={event => onChange(event.target.value)} className="w-full rounded-2xl bg-[var(--surface-muted)] px-4 py-3 text-sm outline-none" placeholder={placeholder} />;
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
