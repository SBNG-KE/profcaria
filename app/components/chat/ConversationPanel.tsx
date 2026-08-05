'use client';
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, FileText, Link2, Paperclip, Send, ShieldCheck } from 'lucide-react';

export type ChatMessage = {
  id: string;
  sender_id: string;
  body: string;
  message_type: string;
  created_at: string;
  delivery_status: string;
  attachments: Array<{ id: string; type: string; name: string; url: string | null; mimeType: string; byteSize: number }>;
};

export default function ConversationPanel({ conversationId, title, subtitle, onBack }: { conversationId: string; context: 'social' | 'work'; title: string; subtitle: string; onBack?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewerId, setViewerId] = useState('');
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/social/conversations/${conversationId}/messages`, { cache: 'no-store' });
    if (!response.ok) return;
    const body = await response.json();
    setMessages(body.messages || []);
    setViewerId(body.viewerId || '');
  }, [conversationId]);

  useEffect(() => {
    const initial = window.setTimeout(load, 0);
    const timer = window.setInterval(load, 8000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [load]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim() || busy) return;
    setBusy(true);
    setNotice('');
    const response = await fetch(`/api/social/conversations/${conversationId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: draft.trim(), messageType: 'text' }) });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) return setNotice(body.error || 'Message was not sent.');
    setDraft('');
    setMessages(current => [...current, body.message]);
  }

  async function attach(file: File | undefined) {
    if (!file) return;
    const kind = file.type.startsWith('image/') ? 'image' : 'document';
    setBusy(true);
    setNotice(kind === 'image' ? 'Checking picture before sending...' : 'Inspecting document before sending...');
    const form = new FormData();
    form.set('file', file);
    form.set('kind', kind);
    const response = await fetch(`/api/social/conversations/${conversationId}/attachments`, { method: 'POST', body: form });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) return setNotice(body.error || 'Attachment was blocked.');
    setNotice(kind === 'image' ? 'Picture sent.' : 'Document passed inspection and was sent.');
    setMessages(current => [...current, body.message]);
    if (fileRef.current) fileRef.current.value = '';
  }

  return <section className="flex h-full min-h-[520px] w-full flex-col border-2 border-[var(--text-primary)] bg-[var(--surface-raised)]">
    <header className="flex items-center gap-3 border-b-2 border-[var(--text-primary)] p-4"><button onClick={onBack} className="md:hidden" aria-label="Back"><ArrowLeft size={18} /></button><div className="min-w-0 flex-1"><h1 className="truncate text-sm font-black">{title}</h1><p className="truncate font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{subtitle}</p></div><span className="flex items-center gap-1.5 font-mono text-[9px] font-black uppercase text-emerald-600"><ShieldCheck size={14} /> Checked attachments</span></header>
    <div className="profcaria-scrollbar flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">{messages.map(message => {
      const mine = message.sender_id === viewerId;
      return <article key={message.id} className={`max-w-[82%] border-2 border-[var(--text-primary)] p-3 text-sm shadow-[3px_3px_0_var(--border-primary)] ${mine ? 'ml-auto bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--bg-primary)]'}`}>
        <LinkifiedText text={message.body} />
        {message.attachments?.map(file => file.type === 'image' && file.url
          ? <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer" className="mt-3 block border-t border-current/30 pt-3"><img src={file.url} alt={file.name} className="max-h-72 w-auto max-w-full object-contain" /><span className="mt-2 block break-all font-mono text-[9px] uppercase underline">{file.name}</span></a>
          : <a key={file.id} href={file.url || '#'} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-2 border-t border-current/30 pt-3 font-mono text-[10px] font-black uppercase underline"><FileText size={14} />{file.name}</a>)}
        <p className="mt-2 font-mono text-[8px] uppercase opacity-55">{new Date(message.created_at).toLocaleString('en-KE', { hour: '2-digit', minute: '2-digit' })} · {message.delivery_status}</p>
      </article>;
    })}<div ref={endRef} /></div>
    {notice && <p className="border-t border-[var(--border-primary)] px-4 py-2 text-xs text-[var(--text-secondary)]">{notice}</p>}
    <form onSubmit={send} className="flex items-end gap-2 border-t-2 border-[var(--text-primary)] p-3">
      <input ref={fileRef} type="file" className="hidden" accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/jpeg,image/png,image/webp" onChange={event => attach(event.target.files?.[0])} />
      <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="grid h-11 w-11 shrink-0 place-items-center border-2 border-[var(--text-primary)]" aria-label="Attach a document or picture"><Paperclip size={17} /></button>
      <textarea value={draft} onChange={event => setDraft(event.target.value)} rows={1} maxLength={8000} placeholder="Type a message or paste an HTTPS link" className="min-h-11 flex-1 resize-none border-2 border-[var(--text-primary)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm outline-none" />
      <button disabled={busy || !draft.trim()} className="grid h-11 w-11 shrink-0 place-items-center border-2 border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-primary)] disabled:opacity-40" aria-label="Send"><Send size={17} /></button>
    </form>
  </section>;
}

function LinkifiedText({ text }: { text: string }) {
  const parts = text.split(/(https:\/\/[^\s]+)/g);
  return <p className="whitespace-pre-wrap break-words leading-6">{parts.map((part, index) => part.startsWith('https://') ? <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline"><Link2 size={12} />{part}</a> : part)}</p>;
}
