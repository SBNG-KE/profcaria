'use client';

import { useEffect, useMemo, useState } from 'react';
import { Archive, Check, MessageCirclePlus, Search, Send, UsersRound, X } from 'lucide-react';

type Conversation = { conversation_id: string; locked_at: string | null; conversations: { id: string; kind: 'direct' | 'group'; title: string | null } };
type Contact = { id: string; type: 'professional' | 'employer'; name: string; avatarUrl: string | null };
type Message = { id: string; sender_id: string; body: string };

export default function ChatHome() {
  const [chats, setChats] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [viewerId, setViewerId] = useState('');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [picker, setPicker] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [notice, setNotice] = useState('');
  const [pickerMode, setPickerMode] = useState<'direct' | 'group'>('direct');
  const [contactQuery, setContactQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetch('/api/social/conversations').then(async r => { if (!r.ok) throw new Error('Sign in to open chats.'); return r.json(); }).then(data => { const items = data.conversations ?? []; setChats(items); setSelected(items[0]?.conversation_id ?? null); }).catch(e => setNotice(e.message)); }, []);
  useEffect(() => { if (selected) fetch(`/api/social/conversations/${selected}/messages`).then(r => r.json()).then(data => { setMessages(data.messages ?? []); setViewerId(data.viewerId ?? ''); }); }, [selected]);
  useEffect(() => { if (picker && !contacts.length) fetch('/api/social/contacts').then(r => r.json()).then(data => setContacts(data.contacts ?? [])).catch(() => setNotice('Contacts could not be loaded.')); }, [picker, contacts.length]);

  const active = chats.find(c => c.conversation_id === selected);
  const title = active?.conversations.title || 'Private conversation';
  const filtered = useMemo(() => chats.filter(c => (c.conversations.title || 'Private conversation').toLowerCase().includes(query.toLowerCase())), [chats, query]);

  function closePicker() {
    setPicker(false); setContactQuery(''); setSelectedContacts([]); setGroupTitle(''); setPickerMode('direct');
  }

  async function createConversation(contact?: Contact) {
    const members = pickerMode === 'direct' && contact ? [contact] : selectedContacts;
    if (!members.length || (pickerMode === 'group' && !groupTitle.trim())) return;
    setCreating(true); setNotice('');
    const response = await fetch('/api/social/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: pickerMode, title: pickerMode === 'group' ? groupTitle.trim() : undefined, members: members.map(({ id, type }) => ({ id, type })) }) });
    const data = await response.json();
    setCreating(false);
    if (!response.ok) return setNotice(data.error || 'Could not start the conversation.');
    const item: Conversation = { conversation_id: data.conversation.id, locked_at: null, conversations: data.conversation };
    setChats(current => [item, ...current]); setSelected(data.conversation.id); closePicker();
  }

  async function send() {
    const body = draft.trim(); if (!body || !selected) return;
    setDraft('');
    const response = await fetch(`/api/social/conversations/${selected}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) });
    const data = await response.json();
    if (!response.ok) { setDraft(body); return setNotice(data.error || 'Message not sent.'); }
    setMessages(current => [...current, data.message]);
  }

  const matchingContacts = contacts.filter(contact => contact.name.toLowerCase().includes(contactQuery.toLowerCase()));
  function toggleContact(contact: Contact) {
    setSelectedContacts(current => current.some(item => item.id === contact.id) ? current.filter(item => item.id !== contact.id) : [...current, contact]);
  }

  return <div className="flex h-[calc(100dvh-4rem)]">
    <section className={`${selected ? 'hidden md:flex' : 'flex'} w-full shrink-0 flex-col border-r border-[#18251f]/10 bg-[#fbfaf7] md:w-[360px]`}>
      <div className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#838b85]">Social</p><h1 className="mt-1 text-2xl font-black">Chats</h1></div><button onClick={() => setPicker(true)} className="grid h-11 w-11 place-items-center rounded-2xl bg-[#183d31] text-[#f6c85f]"><MessageCirclePlus size={20} /></button></div><label className="mt-5 flex items-center gap-3 rounded-2xl bg-[#eeebe4] px-4 py-3 text-[#768079]"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Search chats" /></label><div className="mt-4 flex gap-2 text-xs font-bold"><span className="rounded-full bg-[#183d31] px-4 py-2 text-white">All</span><span className="rounded-full px-4 py-2 text-[#6d766f]">Unread</span><span className="rounded-full px-4 py-2 text-[#6d766f]"><Archive size={13} className="mr-1 inline" />Archived</span></div></div>
      <div className="flex-1 overflow-y-auto px-3">{notice && <p className="m-2 rounded-xl bg-[#fff0c8] p-3 text-sm text-[#72520a]">{notice}</p>}{!notice && !filtered.length && <div className="px-7 py-14 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e8efe9] text-[#183d31]"><MessageCirclePlus /></div><h2 className="mt-4 font-black">Start a conversation</h2><p className="mt-2 text-sm text-[#747d77]">Choose a contact to begin.</p></div>}{filtered.map(chat => <button key={chat.conversation_id} onClick={() => setSelected(chat.conversation_id)} className={`mb-1 flex w-full items-center gap-3 rounded-2xl p-3 text-left ${selected === chat.conversation_id ? 'bg-[#e8efe9]' : 'hover:bg-[#f0eee8]'}`}><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#d9e3db] font-black">{(chat.conversations.title || 'P')[0]}</span><span className="min-w-0"><span className="block truncate text-sm font-black">{chat.conversations.title || 'Private conversation'}</span><span className="text-xs text-[#7a827c]">Open conversation</span></span></button>)}</div>
    </section>
    <section className={`${selected ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}>{active ? <><header className="flex h-[73px] items-center justify-between border-b border-[#18251f]/10 bg-[#fbfaf7] px-5"><div className="flex items-center gap-3"><button onClick={() => setSelected(null)} className="md:hidden">‹</button><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#d9e3db] font-black">{title[0]}</span><div><h2 className="font-black">{title}</h2><p className="text-xs text-[#78817a]">{active.conversations.kind === 'group' ? 'Group conversation' : 'Private conversation'}</p></div></div></header><div className="flex-1 overflow-y-auto p-5 sm:p-8">{messages.map(message => { const mine = message.sender_id === viewerId; return <div key={message.id} className={`mb-3 flex ${mine ? 'justify-end' : ''}`}><div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm ${mine ? 'rounded-br-md bg-[#183d31] text-white' : 'rounded-bl-md bg-white shadow-sm'}`}>{message.body}</div></div>; })}</div><footer className="p-4"><div className="flex items-end gap-3 rounded-[22px] bg-white p-3 shadow-sm"><textarea rows={1} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} className="flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none" placeholder="Message" /><button onClick={send} disabled={!draft.trim()} className="grid h-9 w-9 place-items-center rounded-xl bg-[#f6c85f] disabled:opacity-40"><Send size={17} /></button></div></footer></> : <div className="m-auto text-center"><h2 className="text-xl font-black">Your conversations, without the noise</h2><button onClick={() => setPicker(true)} className="mt-5 rounded-2xl bg-[#183d31] px-5 py-3 text-sm font-bold text-white">New chat</button></div>}</section>
    {picker && <div className="fixed inset-0 z-50 grid place-items-center bg-[#17231d]/50 p-4" role="dialog" aria-modal="true" aria-label="Start a conversation"><div className="w-full max-w-md rounded-[28px] bg-[#fbfaf7] p-5"><div className="flex justify-between"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#838b85]">New chat</p><h2 className="mt-1 text-xl font-black">{pickerMode === 'direct' ? 'Choose a contact' : 'Create a group'}</h2></div><button onClick={closePicker} aria-label="Close"><X /></button></div><div className="mt-5 flex rounded-2xl bg-[#e9e5dc] p-1 text-sm font-bold"><button onClick={() => { setPickerMode('direct'); setSelectedContacts([]); }} className={`flex-1 rounded-xl px-3 py-2 ${pickerMode === 'direct' ? 'bg-white shadow-sm' : ''}`}>Direct</button><button onClick={() => setPickerMode('group')} className={`flex-1 rounded-xl px-3 py-2 ${pickerMode === 'group' ? 'bg-white shadow-sm' : ''}`}>Group</button></div>{pickerMode === 'group' && <input value={groupTitle} onChange={e => setGroupTitle(e.target.value)} maxLength={120} className="mt-4 w-full rounded-2xl bg-[#eeebe4] px-4 py-3 text-sm outline-none" placeholder="Group name" />}<label className="mt-4 flex items-center gap-3 rounded-2xl bg-[#eeebe4] px-4 py-3 text-[#768079]"><Search size={18} /><input value={contactQuery} onChange={e => setContactQuery(e.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Search approved contacts" /></label><div className="mt-3 max-h-72 overflow-y-auto">{!contacts.length && <p className="py-8 text-center text-sm text-[#747d77]">Approved work connections will appear here.</p>}{matchingContacts.map(contact => { const chosen = selectedContacts.some(item => item.id === contact.id); return <button key={contact.id} disabled={creating} onClick={() => pickerMode === 'direct' ? createConversation(contact) : toggleContact(contact)} className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-[#eeebe4] disabled:opacity-50"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#d9e3db] font-black">{contact.name[0]}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-black">{contact.name}</span><span className="text-xs text-[#747d77]">{contact.type === 'employer' ? 'Organisation' : 'Professional'}</span></span>{pickerMode === 'group' && <span className={`grid h-6 w-6 place-items-center rounded-full border ${chosen ? 'border-[#183d31] bg-[#183d31] text-white' : 'border-[#aab1ac]'}`}>{chosen && <Check size={14} />}</span>}</button>; })}</div>{pickerMode === 'group' && <button onClick={() => createConversation()} disabled={creating || !groupTitle.trim() || selectedContacts.length === 0} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#183d31] px-4 py-3 text-sm font-black text-white disabled:opacity-40"><UsersRound size={18} />{creating ? 'Creating group…' : `Create group${selectedContacts.length ? ` (${selectedContacts.length})` : ''}`}</button>}</div></div>}
  </div>;
}
