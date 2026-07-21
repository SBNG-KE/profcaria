'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import { Archive, AtSign, Check, LoaderCircle, MessageCirclePlus, Search, UsersRound, X } from 'lucide-react';
import ConversationPanel from '@/app/components/chat/ConversationPanel';

type Conversation = {
  conversation_id: string;
  locked_at: string | null;
  displayTitle?: string;
  displaySubtitle?: string;
  avatarUrl?: string | null;
  peerUsername?: string | null;
  conversations: { id: string; kind: 'direct' | 'group'; title: string | null };
};
type Contact = { id: string; type: 'professional' | 'employer'; name: string; avatarUrl: string | null; username?: string };

export default function ChatHome() {
  const [chats, setChats] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [picker, setPicker] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [discovered, setDiscovered] = useState<Contact[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [notice, setNotice] = useState('');
  const [pickerMode, setPickerMode] = useState<'direct' | 'group'>('direct');
  const [contactQuery, setContactQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch('/api/social/conversations')
      .then(async response => { if (!response.ok) throw new Error('Sign in to open chats.'); return response.json(); })
      .then(data => { const items = data.conversations ?? []; setChats(items); setSelected(items[0]?.conversation_id ?? null); })
      .catch(error => setNotice(error.message));
  }, []);

  useEffect(() => {
    if (!picker || contacts.length) return;
    fetch('/api/social/contacts')
      .then(response => response.json())
      .then(data => setContacts(data.contacts ?? []))
      .catch(() => setNotice('Contacts could not be loaded.'));
  }, [picker, contacts.length]);

  useEffect(() => {
    const search = contactQuery.trim();
    const phoneSearch = /^[+\d][\d\s()-]+$/.test(search) && search.replace(/\D/g, '').length >= 8;
    const usernameSearch = search.replace(/^@+/, '').toLowerCase();
    if (!picker || (!phoneSearch && (usernameSearch.length < 2 || !/^[a-z0-9_]+$/.test(usernameSearch)))) {
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setDiscovering(true);
      fetch(`/api/social/discovery?query=${encodeURIComponent(phoneSearch ? search : usernameSearch)}`, { signal: controller.signal, cache: 'no-store' })
        .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; })
        .then(data => setDiscovered(data.people ?? []))
        .catch(error => { if (error?.name !== 'AbortError') setNotice('Username search is temporarily unavailable.'); })
        .finally(() => setDiscovering(false));
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [contactQuery, picker]);

  const active = chats.find(chat => chat.conversation_id === selected);
  const title = active?.displayTitle || active?.conversations.title || (active?.conversations.kind === 'group' ? 'Untitled group' : 'Ondwira member');
  const filtered = useMemo(() => chats.filter(chat => `${chat.displayTitle || chat.conversations.title || ''} ${chat.peerUsername || ''}`.toLowerCase().includes(query.toLowerCase())), [chats, query]);
  const matchingContacts = useMemo(() => {
    const rawSearch = contactQuery.trim();
    const phoneSearch = /^[+\d][\d\s()-]+$/.test(rawSearch);
    const search = rawSearch.replace(/^@+/, '').toLowerCase();
    const approved = phoneSearch ? [] : contacts.filter(contact => !search || contact.name.toLowerCase().includes(search) || contact.username?.includes(search));
    const discoveryMatches = (phoneSearch ? rawSearch.replace(/\D/g, '').length >= 8 : search.length >= 2) ? discovered : [];
    const merged = new Map<string, Contact>();
    [...selectedContacts, ...approved, ...discoveryMatches].forEach(contact => merged.set(contact.id, contact));
    return [...merged.values()].filter(contact => phoneSearch || !search || contact.name.toLowerCase().includes(search) || contact.username?.includes(search));
  }, [contactQuery, contacts, discovered, selectedContacts]);

  function closePicker() {
    setPicker(false);
    setContactQuery('');
    setDiscovered([]);
    setSelectedContacts([]);
    setGroupTitle('');
    setPickerMode('direct');
  }

  async function createConversation(contact?: Contact) {
    const members = pickerMode === 'direct' && contact ? [contact] : selectedContacts;
    if (!members.length || (pickerMode === 'group' && !groupTitle.trim())) return;
    setCreating(true);
    setNotice('');
    const response = await fetch('/api/social/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: pickerMode, title: pickerMode === 'group' ? groupTitle.trim() : undefined, members: members.map(({ id, type }) => ({ id, type })) }),
    });
    const data = await response.json();
    setCreating(false);
    if (!response.ok) return setNotice(data.error || 'Could not start the conversation.');
    const directContact = pickerMode === 'direct' ? members[0] : null;
    const item: Conversation = {
      conversation_id: data.conversation.id,
      locked_at: null,
      displayTitle: directContact?.name || (pickerMode === 'group' ? groupTitle.trim() : undefined),
      displaySubtitle: directContact?.username ? `@${directContact.username}` : pickerMode === 'group' ? 'Social group' : 'Direct conversation',
      avatarUrl: directContact?.avatarUrl || null,
      peerUsername: directContact?.username || null,
      conversations: data.conversation,
    };
    setChats(current => [item, ...current]);
    setSelected(data.conversation.id);
    closePicker();
  }

  function toggleContact(contact: Contact) {
    setSelectedContacts(current => current.some(item => item.id === contact.id) ? current.filter(item => item.id !== contact.id) : [...current, contact]);
  }

  return <div className="flex h-[calc(100dvh-8.5rem)] min-h-0 bg-transparent md:h-[calc(100dvh-4rem)]">
    <section className={`${selected ? 'hidden md:flex' : 'flex'} w-full shrink-0 flex-col border-r border-[var(--border-secondary)] bg-[var(--surface-raised)]/88 md:w-[360px]`}>
      <div className="p-5">
        <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Social</p><h1 className="mt-1 text-2xl font-black">Chats</h1></div><button onClick={() => setPicker(true)} className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--accent-primary)] text-[var(--text-inverse)]" aria-label="Start a chat"><MessageCirclePlus size={20} /></button></div>
        <label className="mt-5 flex items-center gap-3 rounded-2xl bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-secondary)]"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none" placeholder="Search chats" /></label>
        <div className="mt-4 flex gap-2 text-xs font-bold"><span className="rounded-full bg-[var(--accent-primary)] px-4 py-2 text-[var(--text-inverse)]">All</span><span className="rounded-full px-4 py-2 text-[var(--text-secondary)]">Unread</span><span className="rounded-full px-4 py-2 text-[var(--text-secondary)]"><Archive size={13} className="mr-1 inline" />Archived</span></div>
      </div>
      <div className="ondwira-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {notice && <p className="m-2 rounded-xl bg-[var(--accent-soft)] p-3 text-sm text-[var(--accent-strong)]">{notice}</p>}
        {!notice && !filtered.length && <div className="px-7 py-14 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><MessageCirclePlus /></div><h2 className="mt-4 font-black">Start a conversation</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">Find someone by their unique @username. No phone number needed.</p></div>}
        {filtered.map(chat => { const chatTitle = chat.displayTitle || chat.conversations.title || (chat.conversations.kind === 'group' ? 'Untitled group' : 'Ondwira member'); return <button key={chat.conversation_id} onClick={() => setSelected(chat.conversation_id)} className={`mb-1 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${selected === chat.conversation_id ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--surface-muted)]'}`}><span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[var(--surface-muted)] font-black text-[var(--accent-primary)]">{chat.avatarUrl ? <img src={chat.avatarUrl} alt="" className="h-full w-full object-cover" /> : chatTitle[0]}</span><span className="min-w-0"><span className="block truncate text-sm font-black">{chatTitle}</span><span className="block truncate text-xs text-[var(--text-secondary)]">{chat.displaySubtitle || (chat.conversations.kind === 'group' ? 'Social group' : 'Direct conversation')}</span></span></button>; })}
      </div>
    </section>

    <section className={`${selected ? 'flex' : 'hidden md:flex'} min-h-0 min-w-0 flex-1`}>{active ? <ConversationPanel conversationId={active.conversation_id} context="social" title={title} subtitle={active.displaySubtitle || (active.conversations.kind === 'group' ? 'Social group' : 'Direct conversation')} onBack={() => setSelected(null)} /> : <div className="m-auto px-6 text-center"><h2 className="font-editorial text-3xl">Your conversations, without the noise.</h2><p className="mt-3 text-sm text-[var(--text-secondary)]">A username or exact phone number is enough to find someone. Phone numbers remain hidden.</p><button onClick={() => setPicker(true)} className="mt-5 rounded-2xl bg-[var(--accent-primary)] px-5 py-3 text-sm font-bold text-[var(--text-inverse)]">New chat</button></div>}</section>

    {picker && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Start a conversation">
      <div className="w-full max-w-md rounded-[28px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-5 shadow-2xl">
        <div className="flex justify-between"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">New chat</p><h2 className="mt-1 text-xl font-black">{pickerMode === 'direct' ? 'Find an Ondwira account' : 'Create a group'}</h2></div><button onClick={closePicker} aria-label="Close"><X /></button></div>
        <div className="mt-5 flex rounded-2xl bg-[var(--surface-muted)] p-1 text-sm font-bold"><button onClick={() => { setPickerMode('direct'); setSelectedContacts([]); }} className={`flex-1 rounded-xl px-3 py-2 ${pickerMode === 'direct' ? 'bg-[var(--surface-raised)] shadow-sm' : ''}`}>Direct</button><button onClick={() => setPickerMode('group')} className={`flex-1 rounded-xl px-3 py-2 ${pickerMode === 'group' ? 'bg-[var(--surface-raised)] shadow-sm' : ''}`}>Group</button></div>
        {pickerMode === 'group' && <input value={groupTitle} onChange={event => setGroupTitle(event.target.value)} maxLength={120} className="mt-4 w-full rounded-2xl bg-[var(--surface-muted)] px-4 py-3 text-sm outline-none" placeholder="Group name" />}
        <label className="mt-4 flex items-center gap-3 rounded-2xl border border-transparent bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-secondary)] focus-within:border-[var(--accent-primary)]"><AtSign size={18} className="text-[var(--accent-primary)]" /><input value={contactQuery} onChange={event => setContactQuery(event.target.value.slice(0, 40))} inputMode="search" className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none" placeholder="@username or +country-code phone" />{discovering && <LoaderCircle size={17} className="animate-spin" />}</label>
        <p className="mt-2 px-1 text-[10px] leading-4 text-[var(--text-muted)]">Usernames match from two characters. Phone lookup requires the exact number with country code and never reveals it.</p>
        <div className="ondwira-scrollbar mt-3 max-h-72 overflow-y-auto">
          {!matchingContacts.length && !discovering && <p className="py-8 text-center text-sm text-[var(--text-secondary)]">{contactQuery.length >= 2 ? 'No matching Ondwira account found.' : contacts.length ? 'Your approved contacts are ready, or search by @username or exact phone.' : 'Search by @username or exact phone to begin.'}</p>}
          {matchingContacts.map(contact => { const chosen = selectedContacts.some(item => item.id === contact.id); return <button key={contact.id} disabled={creating} onClick={() => pickerMode === 'direct' ? createConversation(contact) : toggleContact(contact)} className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-[var(--surface-muted)] disabled:opacity-50"><span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[var(--accent-soft)] font-black text-[var(--accent-primary)]">{contact.avatarUrl ? <img src={contact.avatarUrl} alt="" className="h-full w-full object-cover" /> : contact.name[0]}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-black">{contact.name}</span><span className="block truncate text-xs text-[var(--accent-primary)]">{contact.username ? `@${contact.username}` : 'Approved Ondwira contact'}</span></span>{pickerMode === 'group' && <span className={`grid h-6 w-6 place-items-center rounded-full border ${chosen ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--text-inverse)]' : 'border-[var(--border-primary)]'}`}>{chosen && <Check size={14} />}</span>}</button>; })}
        </div>
        {pickerMode === 'group' && <button onClick={() => createConversation()} disabled={creating || !groupTitle.trim() || selectedContacts.length === 0} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent-primary)] px-4 py-3 text-sm font-black text-[var(--text-inverse)] disabled:opacity-40"><UsersRound size={18} />{creating ? 'Creating…' : `Create group${selectedContacts.length ? ` (${selectedContacts.length})` : ''}`}</button>}
      </div>
    </div>}
  </div>;
}
