'use client';

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react';
import { MessageSquareText, X } from 'lucide-react';
import ConversationPanel from './chat/ConversationPanel';

type Conversation = {
  conversation_id: string;
  displayTitle?: string;
  avatarUrl?: string | null;
  conversations: { kind: 'direct' | 'group'; title: string | null };
};

export default function HomeMessagesDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/social/conversations', { cache: 'no-store' })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Messages could not be opened.');
        return data;
      })
      .then(data => {
        const next = (data.conversations || []) as Conversation[];
        setConversations(next);
        setSelectedId(current => current && next.some(item => item.conversation_id === current) ? current : next[0]?.conversation_id || null);
      })
      .catch(error => setNotice(error instanceof Error ? error.message : 'Messages could not be opened.'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  const selected = conversations.find(item => item.conversation_id === selectedId);
  const selectedTitle = selected?.displayTitle || selected?.conversations.title || 'Conversation';

  return <div className={`fixed inset-0 z-[90] transition ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!isOpen}>
    <button onClick={onClose} className={`absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`} aria-label="Close messages" tabIndex={isOpen ? 0 : -1} />
    <aside className={`absolute inset-y-0 right-0 flex w-full max-w-[960px] flex-col border-l border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-2xl transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} role="dialog" aria-modal="true" aria-label="Messages">
      <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-[var(--border-primary)] px-5 sm:px-7">
        <div><p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Private</p><h2 className="font-editorial mt-1 text-2xl font-medium">Messages</h2></div>
        <button onClick={onClose} className="grid h-10 w-10 place-items-center border border-[var(--border-primary)]" aria-label="Close messages"><X size={18} /></button>
      </header>

      <div className="grid min-h-0 flex-1 md:grid-cols-[300px_minmax(0,1fr)]">
        <section className={`${selectedId ? 'hidden md:flex' : 'flex'} min-h-0 flex-col border-r border-[var(--border-primary)] bg-[var(--surface-raised)]`} aria-label="Conversations">
          <div className="border-b border-[var(--border-secondary)] px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Choose a conversation</p></div>
          <div className="profcaria-scrollbar min-h-0 flex-1 overflow-y-auto p-3">
            {loading && <p className="px-3 py-8 text-sm text-[var(--text-secondary)]">Opening conversations...</p>}
            {notice && <p className="px-3 py-8 text-sm leading-6 text-[var(--accent-strong)]">{notice}</p>}
            {!loading && !notice && conversations.length === 0 && <div className="px-4 py-12 text-center"><MessageSquareText className="mx-auto text-[var(--accent-primary)]" /><p className="mt-4 font-semibold">No conversations yet</p><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">When a company starts a conversation about your application, it will appear here.</p></div>}
            {conversations.map(item => {
              const title = item.displayTitle || item.conversations.title || 'Conversation';
              return <button key={item.conversation_id} onClick={() => setSelectedId(item.conversation_id)} className={`mb-1 flex w-full items-center gap-3 border p-3 text-left transition ${selectedId === item.conversation_id ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)]' : 'border-transparent hover:bg-[var(--surface-muted)]'}`}>
                <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--surface-muted)] font-semibold text-[var(--accent-primary)]">{item.avatarUrl ? <img src={item.avatarUrl} alt="" className="h-full w-full object-cover" /> : title.slice(0, 1).toUpperCase()}</span>
                <span className="min-w-0 truncate text-sm font-semibold">{title}</span>
              </button>;
            })}
          </div>
        </section>

        <section className={`${selectedId ? 'flex' : 'hidden md:flex'} min-h-0 min-w-0 bg-[var(--bg-secondary)] p-0 sm:p-4`}>
          {selected ? <ConversationPanel conversationId={selected.conversation_id} context="social" title={selectedTitle} subtitle="Private conversation" onBack={() => setSelectedId(null)} /> : <div className="m-auto max-w-sm px-8 text-center"><MessageSquareText className="mx-auto text-[var(--accent-primary)]" /><h3 className="font-editorial mt-5 text-3xl">Your conversations</h3><p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">Choose a conversation to send text, secure links, documents or pictures.</p></div>}
        </section>
      </div>
    </aside>
  </div>;
}
