'use client';

import { useEffect, useMemo, useState } from 'react';
import { Archive, BellOff, ChevronDown, EllipsisVertical, LockKeyhole, MessageCirclePlus, Search, Send, Settings2, Smile, Sparkles, UsersRound } from 'lucide-react';
import { OndwiraBadge } from '@/app/components/brand/OndwiraLogo';

type Conversation = {
  conversation_id: string;
  archived_at: string | null;
  locked_at: string | null;
  muted_until: string | null;
  conversations: { id: string; kind: 'direct' | 'group'; title: string | null; updated_at: string };
};
type Message = { id: string; sender_id: string; body: string; created_at: string };
type Contact = { id: string; type: 'professional' | 'employer'; name: string; avatarUrl: string | null };

export default function SocialClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [contactPickerOpen, setContactPickerOpen] = useState(false);

  useEffect(() => {
    fetch('/api/social/conversations')
      .then(async (response) => {
        if (!response.ok) throw new Error('Sign in to open Social.');
        return response.json();
      })
      .then((data) => {
        const items = data.conversations ?? [];
        setConversations(items);
        setSelectedId(items[0]?.conversation_id ?? null);
      })
      .catch((cause) => setError(cause.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/social/conversations/${selectedId}/messages`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load this chat.')))
      .then((data) => { setMessages(data.messages ?? []); setViewerId(data.viewerId ?? null); })
      .catch((cause) => setError(cause.message));
  }, [selectedId]);

  const filtered = useMemo(() => conversations.filter((item) => {
    const title = item.conversations.title || (item.conversations.kind === 'group' ? 'Untitled group' : 'Private conversation');
    return title.toLowerCase().includes(search.toLowerCase());
  }), [conversations, search]);
  const selected = conversations.find((item) => item.conversation_id === selectedId);
  const selectedTitle = selected?.conversations.title || (selected?.conversations.kind === 'group' ? 'Untitled group' : 'Private conversation');

  function selectConversation(conversationId: string) {
    setMessages([]);
    setSelectedId(conversationId);
  }

  async function sendMessage() {
    if (!draft.trim() || !selectedId) return;
    const body = draft.trim();
    setDraft('');
    const response = await fetch(`/api/social/conversations/${selectedId}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }),
    });
    const data = await response.json();
    if (!response.ok) { setError(data.error || 'Message not sent.'); setDraft(body); return; }
    setMessages((current) => [...current, data.message]);
  }

  async function startDirectConversation(contact: Contact) {
    const response = await fetch('/api/social/conversations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'direct', members: [{ id: contact.id, type: contact.type }] }),
    });
    const data = await response.json();
    if (!response.ok) { setError(data.error || 'Conversation could not be created.'); return; }
    const item: Conversation = { conversation_id: data.conversation.id, archived_at: null, locked_at: null, muted_until: null, conversations: { ...data.conversation, updated_at: data.conversation.created_at } };
    setConversations((current) => [item, ...current]);
    selectConversation(data.conversation.id);
    setContactPickerOpen(false);
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-[#14213d] selection:bg-[#ffca3a]/50">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[84px] flex-col items-center border-r border-[#e5e9f2] bg-white py-7 lg:flex">
          <OndwiraBadge className="h-11 w-11 rounded-2xl" />
          <nav className="mt-12 flex flex-1 flex-col gap-5 text-[#74809a]">
            <button className="grid h-11 w-11 place-items-center rounded-xl bg-[#ffca3a] text-[#14213d]" aria-label="Messages"><MessageCirclePlus size={20} /></button>
            <button className="grid h-11 w-11 place-items-center rounded-xl hover:bg-[#f0f3f8]" aria-label="Groups"><UsersRound size={20} /></button>
            <button className="grid h-11 w-11 place-items-center rounded-xl hover:bg-[#f0f3f8]" aria-label="Archived chats"><Archive size={20} /></button>
          </nav>
          <button className="grid h-11 w-11 place-items-center rounded-xl text-[#74809a] hover:bg-[#f0f3f8]" aria-label="Settings"><Settings2 size={20} /></button>
        </aside>

        <section className="flex min-h-screen w-full max-w-md flex-col border-r border-[#e5e9f2] bg-white md:w-[390px]">
          <header className="px-6 pb-4 pt-7">
            <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#72809a]">Ondwira</p><h1 className="mt-1 text-2xl font-black tracking-tight">Messages</h1></div><button onClick={() => setContactPickerOpen(true)} className="grid h-11 w-11 place-items-center rounded-2xl bg-[#14213d] text-white shadow-lg shadow-[#14213d]/15" aria-label="Start a new chat"><MessageCirclePlus size={19} /></button></div>
            <label className="mt-6 flex items-center gap-3 rounded-2xl bg-[#f4f6fa] px-4 py-3 text-[#74809a]"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-sm text-[#14213d] outline-none placeholder:text-[#9ba6b9]" placeholder="Search conversations" /></label>
            <div className="mt-5 flex gap-2"><button className="rounded-full bg-[#14213d] px-4 py-2 text-xs font-bold text-white">All</button><button className="rounded-full px-4 py-2 text-xs font-bold text-[#65718a] hover:bg-[#f4f6fa]">Unread</button><button className="rounded-full px-4 py-2 text-xs font-bold text-[#65718a] hover:bg-[#f4f6fa]">Groups</button></div>
          </header>
          <div className="flex-1 overflow-y-auto px-3 pb-5">
            {loading && <p className="px-3 py-8 text-center text-sm text-[#74809a]">Opening your conversations…</p>}
            {error && !loading && <p className="mx-3 rounded-xl bg-[#fff4e5] p-3 text-sm text-[#9a5a00]">{error}</p>}
            {!loading && !error && filtered.length === 0 && <div className="mx-3 mt-10 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#fff1bf] text-[#a97800]"><Sparkles size={24} /></div><h2 className="mt-4 font-bold">Your conversations start here</h2><p className="mt-2 text-sm leading-6 text-[#74809a]">Private chats and groups will appear here. Contacts and new-chat invitations are the next Social feature.</p></div>}
            {filtered.map((item) => <button key={item.conversation_id} onClick={() => selectConversation(item.conversation_id)} className={`mb-1 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${selectedId === item.conversation_id ? 'bg-[#eef2ff]' : 'hover:bg-[#f6f8fb]'}`}><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#dce4fa] font-black text-[#314b87]">{item.conversations.kind === 'group' ? <UsersRound size={20} /> : (item.conversations.title || 'P').slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-bold">{item.conversations.title || (item.conversations.kind === 'group' ? 'Untitled group' : 'Private conversation')}</p>{item.locked_at && <LockKeyhole size={13} className="text-[#74809a]" />}</div><p className="mt-1 truncate text-xs text-[#74809a]">{item.muted_until ? 'Muted' : item.conversations.kind === 'group' ? 'Group conversation' : 'Private conversation'}</p></div></button>)}
          </div>
        </section>

        <section className="hidden min-h-screen flex-1 flex-col bg-[#f7f8fb] md:flex">
          {selected ? <><header className="flex items-center justify-between border-b border-[#e5e9f2] bg-white px-8 py-5"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#dce4fa] font-black text-[#314b87]">{selected.conversations.kind === 'group' ? <UsersRound size={19} /> : selectedTitle.slice(0, 1)}</div><div><h2 className="font-bold">{selectedTitle}</h2><p className="text-xs text-[#71809b]">{selected.conversations.kind === 'group' ? 'Group conversation' : 'Private and secure'}</p></div></div><div className="flex items-center gap-3 text-[#62708a]"><button aria-label="Mute notifications"><BellOff size={19} /></button><button aria-label="More conversation options"><EllipsisVertical size={20} /></button></div></header><div className="flex-1 overflow-y-auto px-8 py-6">{messages.map((message) => { const mine = message.sender_id === viewerId; return <div key={message.id} className={`mb-4 flex ${mine ? 'justify-end' : 'justify-start'}`}><p className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-6 ${mine ? 'rounded-br-md bg-[#14213d] text-white' : 'rounded-bl-md bg-white text-[#23314d] shadow-sm'}`}>{message.body}</p></div>; })}</div><footer className="p-6 pt-2"><div className="flex items-end gap-3 rounded-[22px] border border-[#dfe5ef] bg-white px-4 py-3 shadow-sm"><button className="pb-1 text-[#71809b]" aria-label="Choose emoji"><Smile size={21} /></button><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} rows={1} className="max-h-28 flex-1 resize-none bg-transparent py-1 text-sm outline-none placeholder:text-[#9ba6b9]" placeholder="Write a message" /><button onClick={sendMessage} disabled={!draft.trim()} className="grid h-9 w-9 place-items-center rounded-xl bg-[#ffca3a] text-[#14213d] disabled:opacity-40" aria-label="Send message"><Send size={17} /></button></div><p className="mt-3 text-center text-[11px] text-[#8994a8]">Ondwira Social v1 · Personal conversations stay separate from workspaces.</p></footer></> : <div className="m-auto max-w-sm text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-[#fff1bf] text-[#a97800]"><MessageCirclePlus size={29} /></div><h2 className="mt-5 text-xl font-black">A more human place to talk</h2><p className="mt-3 leading-7 text-[#74809a]">Select a conversation when you have one, or start a new private chat.</p><button onClick={() => setContactPickerOpen(true)} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#14213d] px-5 py-3 text-sm font-bold text-white">New conversation <ChevronDown size={16} /></button></div>}
        </section>
      </div>
      {contactPickerOpen && <ContactPicker onClose={() => setContactPickerOpen(false)} onSelect={startDirectConversation} />}
    </main>
  );
}

function ContactPicker({ onClose, onSelect }: { onClose: () => void; onSelect: (contact: Contact) => void }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { fetch('/api/social/contacts').then((response) => response.ok ? response.json() : Promise.reject()).then((data) => setContacts(data.contacts ?? [])).catch(() => setError('Contacts could not be loaded.')); }, []);
  const matches = contacts.filter((contact) => contact.name.toLowerCase().includes(query.toLowerCase()));
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#14213d]/45 p-4" role="dialog" aria-modal="true" aria-label="Start a new conversation"><div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#72809a]">New conversation</p><h2 className="mt-1 text-xl font-black">Choose a contact</h2></div><button onClick={onClose} className="rounded-xl px-3 py-2 text-sm font-bold text-[#61708a] hover:bg-[#f4f6fa]">Close</button></div><label className="mt-5 flex items-center gap-3 rounded-2xl bg-[#f4f6fa] px-4 py-3 text-[#74809a]"><Search size={18} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm text-[#14213d] outline-none" placeholder="Search contacts" /></label><div className="mt-4 max-h-80 overflow-y-auto">{error && <p className="py-6 text-center text-sm text-[#a15d00]">{error}</p>}{!error && contacts.length === 0 && <p className="py-8 text-center text-sm leading-6 text-[#74809a]">Your approved connections will appear here. Phone contacts and public social discovery come next.</p>}{matches.map((contact) => <button key={contact.id} onClick={() => onSelect(contact)} className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-[#f4f6fa]"><div className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-[#dce4fa] font-black text-[#314b87]">{contact.avatarUrl ? <img src={contact.avatarUrl} alt="" className="h-full w-full object-cover" /> : contact.name.slice(0, 1).toUpperCase()}</div><div><p className="text-sm font-bold">{contact.name}</p><p className="mt-0.5 text-xs text-[#74809a]">{contact.type === 'employer' ? 'Organisation' : 'Professional'}</p></div></button>)}</div></div></div>;
}
