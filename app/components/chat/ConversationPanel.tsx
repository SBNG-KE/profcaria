'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Bot,
  CalendarPlus,
  Camera,
  ContactRound,
  Eye,
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
  view_once_state?: 'locked' | 'revealed' | 'consumed' | null;
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
const emojiCategories = {
  Recent: ['😀','😂','🥰','😍','😊','😉','😭','😮','😎','🤔','🙏','👍','❤️','🔥','✨','🎉'],
  Faces: ['😀','😃','😄','😁','😆','😅','😂','🤣','🥲','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🫣','🤭','🫢','🫡','🤫','🫠','🤥','😶','🫥','😐','🫤','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪'],
  People: ['👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💪','🦾','🧠','🫀','👀','👁️','👄','🫦','🧑','👩','👨','👶','🧒','👧','👦','🧓','👵','👴'],
  Nature: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦄','🐝','🦋','🐌','🐞','🐢','🐍','🦎','🐙','🦑','🦀','🐠','🐟','🐬','🐳','🌵','🌲','🌳','🌴','🪴','🌱','🌿','☘️','🍀','🍁','🍂','🌹','🌸','🌺','🌻','🌼','🌞','🌝','🌙','⭐','🌟','✨','⚡','🔥','🌈','☀️','🌤️','🌧️'],
  Food: ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🧀','🥚','🍳','🥞','🧇','🥓','🍔','🍟','🍕','🌭','🥪','🌮','🌯','🥗','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🍦','🍩','🍪','🎂','🍫','🍿','☕','🫖','🥤','🧋','🍷','🍸'],
  Activity: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🏒','🏑','🥍','🏏','⛳','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🎿','🏂','🏋️','🤸','⛹️','🤺','🏊','🚴','🧗','🎯','🎮','🎲','🧩','♟️','🎨','🎭','🎤','🎧','🎷','🎸','🎹','🥁','🎬','🎪','🎉','🎊','🏆','🥇'],
  Travel: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🛵','🏍️','🚲','🛴','🚨','🚥','🚧','⚓','⛵','🛶','🚤','🛳️','✈️','🛫','🛬','🚁','🚀','🛸','🏠','🏡','🏢','🏥','🏦','🏨','🏫','🏭','🏰','🗼','🗽','⛲','⛺','🏖️','🏝️','🏔️','🗻','🌋','🗺️','🧭'],
  Objects: ['⌚','📱','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🪫','🔌','💡','🔦','🕯️','🪔','🧯','🛢️','💸','💵','💴','💶','💷','🪙','💰','💳','💎','⚖️','🪜','🧰','🪛','🔧','🔨','⚒️','🛠️','⛏️','🪚','🔩','⚙️','🪤','🧱','⛓️','🧲','🔫','💣','🧨','🪓','🔪','🗡️','⚔️','🛡️','🚬','⚰️','🪦','⚱️','🏺','🔮','📿','🧿','🪬','💈','⚗️','🔭','🔬','🕳️','🩻','🩹','🩺','💊','💉','🩸','🧬','🦠','🧹','🪠','🧺','🧻','🚽','🚿','🛁','🧼','🪥','🪒','🧽','🪣','🧴','🔑','🗝️','🚪','🪑','🛋️','🛏️','🪞','🪟','🛍️','🛒','🎁','🎈','🎏','🪩','🎀','🎊','🎉','🪅','🪆','🧸','🪄','🧵','🪡','🧶','🪢','👓','🕶️','🥽','🥼','🦺','👔','👕','👖','🧣','🧤','🧥','🧦','👗','👘','🥻','🩱','🩲','🩳','👙','👚','🪭','👛','👜','👝','🎒','🩴','👞','👟','🥾','🥿','👠','👡','🩰','👢','🪮','👑','👒','🎩','🎓','🧢','🪖','⛑️','💄','💍','💼','📁','📂','🗂️','📅','📆','🗒️','🗓️','📇','📈','📉','📊','📋','📌','📍','📎','🖇️','📏','📐','✂️','🗃️','🗄️','🗑️','🔒','🔓','🔏','🔐','🔍','🔎','📝','✏️','🖊️','🖋️','✒️','🖌️','🖍️','📚','📖','🔖','🧷','🔗','📧','📨','📩','📤','📥','📦','📫','📪','📬','📭','📮','🗳️'],
  Flags: ['🏁','🚩','🎌','🏴','🏳️','🏳️‍🌈','🏳️‍⚧️','🏴‍☠️','🇺🇳','🇦🇺','🇧🇷','🇨🇦','🇨🇳','🇪🇬','🇪🇹','🇫🇷','🇩🇪','🇬🇭','🇮🇳','🇮🇩','🇮🇪','🇮🇱','🇮🇹','🇯🇵','🇰🇪','🇲🇽','🇲🇦','🇳🇱','🇳🇬','🇳🇴','🇵🇰','🇵🇭','🇵🇹','🇷🇼','🇸🇦','🇸🇬','🇿🇦','🇰🇷','🇪🇸','🇸🇪','🇨🇭','🇹🇿','🇹🇷','🇺🇬','🇦🇪','🇬🇧','🇺🇸','🇿🇲','🇿🇼'],
  Symbols: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','☢️','☣️','📴','📳','🈶','🆚','💯','❗','❓','‼️','⁉️','✅','❌','⭕','🚫','💤','💬','🗨️','🗯️','♻️','🔱','⚜️','🔰','🎵','➕','➖','➗','✖️','✔️'],
};
type EmojiCategory = keyof typeof emojiCategories;
type NoteKind = 'voice' | 'video';
type PendingAttachment = { file: File; kind: string; previewUrl: string | null; noteKind?: NoteKind };
type CachedConversation = { messages: ChatMessage[]; viewerId: string };
const messageCache = new Map<string, CachedConversation>();

export default function ConversationPanel({ conversationId, context, title, subtitle, onBack }: {
  conversationId: string;
  context: 'social' | 'work';
  title: string;
  subtitle: string;
  onBack?: () => void;
}) {
  const cachedConversation = messageCache.get(conversationId);
  const [messages, setMessages] = useState<ChatMessage[]>(() => cachedConversation?.messages ?? []);
  const [viewerId, setViewerId] = useState(() => cachedConversation?.viewerId ?? '');
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
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const [recordingKind, setRecordingKind] = useState<NoteKind | null>(null);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
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
  const menuRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const cancelRecordingRef = useRef(false);

  const loadMessages = useCallback(async () => {
    const response = await fetch(`/api/social/conversations/${conversationId}/messages`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Messages could not be loaded.');
    const nextMessages: ChatMessage[] = data.messages ?? [];
    const nextViewerId = data.viewerId ?? '';
    setMessages(current => {
      const merged = nextMessages.map(message => {
        const openMessage = current.find(item => item.id === message.id && item.view_once_state === 'revealed');
        return openMessage ?? message;
      });
      messageCache.set(conversationId, { messages: merged, viewerId: nextViewerId });
      return merged;
    });
    setViewerId(nextViewerId);
    const unreadIds = (data.messages ?? []).filter((message: ChatMessage) => message.sender_id !== data.viewerId && !message.read_by_viewer).map((message: ChatMessage) => message.id);
    if (unreadIds.length) window.setTimeout(() => {
      fetch(`/api/social/conversations/${conversationId}/receipts`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageIds: unreadIds }) }).catch(() => undefined);
    }, 500);
  }, [conversationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const cached = messageCache.get(conversationId);
      setMessages(cached?.messages ?? []); setViewerId(cached?.viewerId ?? ''); setNotice(''); setSearch(''); setRevealed([]);
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

  useEffect(() => () => {
    if (pendingAttachment?.previewUrl) URL.revokeObjectURL(pendingAttachment.previewUrl);
  }, [pendingAttachment?.previewUrl]);

  useEffect(() => () => {
    cancelRecordingRef.current = true;
    if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    recordingStreamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menuOpen]);

  const shownMessages = useMemo(() => search.trim() ? messages.filter(message => message.body.toLowerCase().includes(search.trim().toLowerCase())) : messages, [messages, search]);
  const displayTitle = settings?.title || title;

  function appendMessage(message: ChatMessage) {
    setMessages(current => {
      const next = [...current, message];
      messageCache.set(conversationId, { messages: next, viewerId });
      return next;
    });
  }

  async function sendText() {
    if (pendingAttachment) return upload(pendingAttachment.file, pendingAttachment.kind);
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true); setDraft(''); setNotice('');
    const response = await fetch(`/api/social/conversations/${conversationId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body, viewOnce }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setDraft(body); return setNotice(data.error || 'Message not sent.'); }
    appendMessage(data.message); setViewOnce(false);
  }

  async function sendRich(messageType: string, payload: Record<string, unknown>, body?: string) {
    if (busy) return;
    setBusy(true); setNotice('');
    const response = await fetch(`/api/social/conversations/${conversationId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageType, payload, body, viewOnce }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setNotice(data.error || 'Message not sent.');
    appendMessage(data.message); setViewOnce(false); closeDialog();
    await loadMessages().catch(() => undefined);
  }

  async function upload(file: File, kind: string) {
    setBusy(true); setNotice(''); setTrayOpen(false);
    const form = new FormData(); form.set('file', file); form.set('kind', kind); form.set('viewOnce', String(viewOnce)); form.set('caption', draft.trim());
    const response = await fetch(`/api/social/conversations/${conversationId}/attachments`, { method: 'POST', body: form });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setNotice(data.error || 'Attachment could not be sent.');
    appendMessage(data.message); setDraft(''); setViewOnce(false); setPendingAttachment(null);
  }

  function stageAttachment(file: File, kind: string, noteKind?: NoteKind) {
    const previewUrl = /^(image|video|audio)\//.test(file.type) ? URL.createObjectURL(file) : null;
    setPendingAttachment({ file, kind, previewUrl, noteKind });
    setTrayOpen(false);
    setEmojiOpen(false);
  }

  function stopRecording(cancel = false) {
    cancelRecordingRef.current = cancel;
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') recorder.stop();
    else {
      recordingStreamRef.current?.getTracks().forEach(track => track.stop());
      recordingStreamRef.current = null;
      setRecordingStream(null);
      setRecordingKind(null);
      setRecordingSeconds(0);
    }
  }

  async function startRecording(kind: NoteKind) {
    setTrayOpen(false);
    setEmojiOpen(false);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      return setNotice('Recording is not supported by this browser or device.');
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: kind === 'video' ? { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 }, frameRate: { ideal: 24, max: 30 } } : false });
      const candidates = kind === 'video'
        ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
        : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      const mimeType = candidates.find(candidate => MediaRecorder.isTypeSupported(candidate));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recordingStreamRef.current = stream;
      setRecordingStream(stream);
      recorderRef.current = recorder;
      recordingChunksRef.current = [];
      cancelRecordingRef.current = false;
      setRecordingKind(kind);
      setRecordingSeconds(0);
      recorder.ondataavailable = event => {
        if (event.data.size) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const cancelled = cancelRecordingRef.current;
        const blobType = recorder.mimeType || mimeType || (kind === 'video' ? 'video/webm' : 'audio/webm');
        const blob = new Blob(recordingChunksRef.current, { type: blobType });
        stream.getTracks().forEach(track => track.stop());
        recordingStreamRef.current = null;
        setRecordingStream(null);
        recorderRef.current = null;
        recordingChunksRef.current = [];
        setRecordingKind(null);
        setRecordingSeconds(0);
        if (!cancelled && blob.size) {
          const extension = blobType.includes('mp4') ? 'mp4' : blobType.includes('ogg') ? 'ogg' : 'webm';
          const file = new File([blob], `${kind}-note-${Date.now()}.${extension}`, { type: blobType });
          stageAttachment(file, kind === 'video' ? 'video' : 'audio', kind);
        }
      };
      recorder.start(250);
      recordingTimerRef.current = window.setInterval(() => setRecordingSeconds(value => {
        const next = value + 1;
        if ((kind === 'video' && next >= 60) || (kind === 'voice' && next >= 300)) stopRecording();
        return next;
      }), 1000);
    } catch {
      recordingStreamRef.current?.getTracks().forEach(track => track.stop());
      recordingStreamRef.current = null;
      setRecordingStream(null);
      setRecordingKind(null);
      setNotice('Microphone or camera permission was not granted.');
    }
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

  async function revealMessage(messageId: string) {
    const response = await fetch(`/api/social/conversations/${conversationId}/messages/${messageId}/actions`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'view' }) });
    const data = await response.json();
    if (!response.ok) {
      setMessages(current => current.map(message => message.id === messageId ? { ...message, view_once_state: 'consumed', hidden: true } : message));
      return setNotice(data.error || 'This message can no longer be opened.');
    }
    setMessages(current => {
      const next = current.map(message => message.id === messageId ? {
        ...message,
        ...data.content,
        attachments: data.content?.attachments ?? message.attachments,
        view_once_state: 'revealed' as const,
        hidden: false,
      } : message);
      messageCache.set(conversationId, { messages: next, viewerId });
      return next;
    });
    setRevealed(current => [...current, messageId]);
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

  return <section className={`relative flex h-full min-h-0 flex-1 flex-col ${context === 'social' ? 'bg-transparent' : 'bg-[var(--bg-primary)]'}`}>
    <header className="relative z-50 flex min-h-[72px] shrink-0 items-center gap-3 overflow-visible border-b border-[var(--border-secondary)] bg-[var(--surface-raised)]/95 px-3 backdrop-blur-lg sm:px-5">
      {onBack && <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-[var(--surface-muted)] md:hidden" aria-label="Back to conversations">‹</button>}
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] font-black text-[var(--accent-primary)]">{displayTitle.slice(0, 1).toUpperCase()}</span>
      <div className="min-w-0 flex-1"><h2 className="truncate font-black">{displayTitle}</h2><p className="truncate text-xs text-[var(--text-secondary)]">{subtitle}</p></div>
      {context === 'work' && <button onClick={() => setDialog('meeting')} className="hidden items-center gap-2 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-xs font-bold text-[var(--accent-primary)] sm:flex"><Video size={16} /> Meeting</button>}
      <button onClick={() => setSearchOpen(value => !value)} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-[var(--surface-muted)]" aria-label="Search messages"><Search size={18} /></button>
      <div ref={menuRef} className="relative z-[70]"><button onClick={() => setMenuOpen(value => !value)} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-[var(--surface-muted)]" aria-label="Conversation menu" aria-expanded={menuOpen}><MoreVertical size={18} /></button>{menuOpen && <ConversationMenu context={context} settings={settings} onMeeting={() => { setMenuOpen(false); setDialog('meeting'); }} onMute={() => updateSettings({ action: 'mute', mutedUntil: new Date(Date.now() + 8 * 3600 * 1000).toISOString() })} onDisappear={seconds => updateSettings({ action: 'disappearing', seconds })} onReport={() => { const reason = window.prompt('What should Ondwira review?'); if (reason) updateSettings({ action: 'report', reason }); }} onBlock={() => { const accountId = settings?.otherMembers[0]?.user_id; if (accountId) updateSettings({ action: 'block', accountId }); }} />}</div>
    </header>

    {searchOpen && <div className="flex items-center gap-3 border-b border-[var(--border-secondary)] bg-[var(--surface-raised)] px-4 py-3"><Search size={17} className="text-[var(--text-muted)]" /><input autoFocus value={search} onChange={event => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search this conversation" /><button onClick={() => { setSearchOpen(false); setSearch(''); }}><X size={17} /></button></div>}
    {notice && <div className="mx-4 mt-3 flex items-start justify-between gap-3 rounded-2xl border border-[var(--border-secondary)] bg-[var(--accent-soft)] p-3 text-sm text-[var(--accent-strong)]"><span>{notice}</span><button onClick={() => setNotice('')}><X size={15} /></button></div>}

    <div className="ondwira-scrollbar min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-3 py-5 sm:px-7 sm:py-8">
      {shownMessages.map(message => <MessageCard key={message.id} message={message} mine={message.sender_id === viewerId} revealed={revealed.includes(message.id)} reactionOpen={reactionFor === message.id} onToggleReaction={() => setReactionFor(current => current === message.id ? null : message.id)} onReact={emoji => { setReactionFor(null); messageAction(message.id, { action: 'react', emoji }); }} onReveal={() => revealMessage(message.id)} onVote={optionId => messageAction(message.id, { action: 'poll_vote', optionId })} onEventResponse={response => messageAction(message.id, { action: 'event_response', response })} />)}
      {!shownMessages.length && <div className="grid h-full min-h-64 place-items-center text-center"><div><Sparkles className="mx-auto text-[var(--accent-primary)]" /><h3 className="mt-4 font-editorial text-2xl">A quiet conversation starts here.</h3><p className="mt-2 text-sm text-[var(--text-secondary)]">Text, share something useful, or create a plan together.</p></div></div>}
      <div ref={messageEndRef} />
    </div>

    <footer className="relative z-30 shrink-0 border-t border-[var(--border-secondary)] bg-[var(--surface-raised)]/95 p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:p-4">
      {viewOnce && !pendingAttachment && <div className="mb-2 flex items-center justify-between rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-xs font-bold text-[var(--accent-primary)]"><span className="flex items-center gap-2"><Eye size={15} /> Opens once, then closes</span><button onClick={() => setViewOnce(false)}><X size={14} /></button></div>}
      <div className="relative flex items-end gap-1.5 rounded-[22px] border border-[var(--border-secondary)] bg-[var(--surface-muted)] p-2 shadow-sm sm:gap-2">
        <button onClick={() => { setTrayOpen(value => !value); setEmojiOpen(false); }} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl hover:bg-[var(--surface-raised)] sm:h-10 sm:w-10" aria-label="Attach"><Paperclip size={19} /></button>
        <button onClick={() => { setEmojiOpen(value => !value); setTrayOpen(false); }} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl hover:bg-[var(--surface-raised)] sm:h-10 sm:w-10" aria-label="Emoji"><Smile size={19} /></button>
        <textarea rows={1} value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendText(); } }} className="max-h-32 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-1 py-2.5 text-sm outline-none" placeholder={context === 'work' ? 'Message your team' : 'Message'} />
        {!draft.trim() && <button onClick={() => startRecording('voice')} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl hover:bg-[var(--surface-raised)] sm:h-10 sm:w-10" aria-label="Record voice note" title="Record voice note"><Mic size={18} /></button>}
        <button onClick={() => setViewOnce(value => !value)} className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl sm:h-10 sm:w-10 ${viewOnce ? 'bg-[var(--accent-primary)] text-[var(--text-inverse)]' : 'hover:bg-[var(--surface-raised)]'}`} title="Open once" aria-label={viewOnce ? 'Turn off open once' : 'Turn on open once'}><Eye size={17} /></button>
        <button onClick={sendText} disabled={!draft.trim() || busy} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--accent-primary)] text-[var(--text-inverse)] disabled:opacity-35 sm:h-10 sm:w-10" aria-label="Send message"><Send size={17} /></button>
        {trayOpen && <AttachmentTray context={context} onClose={() => setTrayOpen(false)} onGallery={() => galleryRef.current?.click()} onCamera={() => cameraRef.current?.click()} onDocument={() => documentRef.current?.click()} onAudio={() => audioRef.current?.click()} onVoiceNote={() => startRecording('voice')} onVideoNote={() => startRecording('video')} onSticker={() => stickerRef.current?.click()} onLocation={shareLocation} onContact={() => { setTrayOpen(false); setDialog('contact'); }} onPoll={() => { setTrayOpen(false); setDialog('poll'); }} onEvent={() => { setTrayOpen(false); setDialog('event'); }} onMeeting={() => { setTrayOpen(false); setDialog('meeting'); }} onAi={() => { setTrayOpen(false); setDialog('ai'); }} />}
        {emojiOpen && <EmojiPicker onSelect={emoji => setDraft(current => current + emoji)} onClose={() => setEmojiOpen(false)} />}
      </div>
      <input ref={galleryRef} hidden type="file" accept="image/*,video/*" onChange={event => { const file = event.target.files?.[0]; if (file) stageAttachment(file, file.type.startsWith('video/') ? 'video' : 'image'); event.target.value = ''; }} />
      <input ref={cameraRef} hidden type="file" accept="image/*" capture="environment" onChange={event => { const file = event.target.files?.[0]; if (file) stageAttachment(file, 'camera'); event.target.value = ''; }} />
      <input ref={documentRef} hidden type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" onChange={event => { const file = event.target.files?.[0]; if (file) stageAttachment(file, 'document'); event.target.value = ''; }} />
      <input ref={audioRef} hidden type="file" accept="audio/*" onChange={event => { const file = event.target.files?.[0]; if (file) stageAttachment(file, 'audio'); event.target.value = ''; }} />
      <input ref={stickerRef} hidden type="file" accept="image/png,image/webp,image/jpeg" onChange={event => { const file = event.target.files?.[0]; if (file) stageAttachment(file, 'sticker'); event.target.value = ''; }} />
    </footer>

    {pendingAttachment && <AttachmentReview pending={pendingAttachment} caption={draft} setCaption={setDraft} viewOnce={viewOnce} setViewOnce={setViewOnce} busy={busy} onCancel={() => { setPendingAttachment(null); setDraft(''); setViewOnce(false); }} onSend={() => upload(pendingAttachment.file, pendingAttachment.kind)} />}
    {recordingKind && <RecordingDialog kind={recordingKind} seconds={recordingSeconds} stream={recordingStream} onCancel={() => stopRecording(true)} onStop={() => stopRecording(false)} />}
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
  const label = status === 'sent' ? 'Sent' : status === 'delivered' ? 'Delivered' : status === 'read' ? 'Read' : 'Viewed';
  const progress = status === 'sent' ? 0 : status === 'delivered' ? 50 : status === 'read' ? 78 : 100;
  return <span className="inline-flex items-center" title={label} role="img" aria-label={label}>
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] -rotate-90 drop-shadow-[0_0_2px_rgba(0,0,0,0.25)]" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill={status === 'viewed' ? 'var(--accent-warm)' : 'none'} fillOpacity="0.18" stroke="currentColor" strokeWidth="2.1" strokeDasharray={status === 'sent' || status === 'delivered' ? '2.2 2.6' : undefined} opacity={status === 'sent' ? 0.9 : 0.55} />
      {progress > 0 && <circle cx="12" cy="12" r="8" pathLength="100" fill="none" stroke="var(--accent-warm)" strokeWidth="2.8" strokeLinecap="round" strokeDasharray={`${progress} 100`} />}
      {status === 'viewed' && <circle cx="12" cy="12" r="2.5" fill="var(--accent-warm)" />}
    </svg>
  </span>;
}

function MessageCard({ message, mine, revealed, reactionOpen, onToggleReaction, onReact, onReveal, onVote, onEventResponse }: {
  message: ChatMessage; mine: boolean; revealed: boolean; reactionOpen: boolean; onToggleReaction: () => void; onReact: (emoji: string) => void; onReveal: () => void; onVote: (optionId: string) => void; onEventResponse: (response: string) => void;
}) {
  const protectedMessage = !mine && (message.view_once_state === 'locked' || (message.view_once && !message.view_once_state && !revealed));
  const consumedMessage = !mine && (message.view_once_state === 'consumed' || message.hidden);
  const hasAttachments = message.attachments.length > 0;
  const attachmentCaption = hasAttachments && message.body !== message.attachments[0]?.name ? message.body : '';
  const reactionGroups = Object.entries(message.reactions.reduce<Record<string, number>>((result, reaction) => ({ ...result, [reaction.emoji]: (result[reaction.emoji] || 0) + 1 }), {}));
  return <div className={`group relative mb-4 flex ${mine ? 'justify-end' : 'justify-start'}`}>
    <article className={`relative max-w-[88%] sm:max-w-[72%] ${hasAttachments && !protectedMessage ? 'rounded-[20px] bg-transparent p-0 text-[var(--text-primary)]' : `rounded-[20px] border px-4 py-3 shadow-sm ${mine ? 'rounded-br-md border-transparent bg-[var(--accent-primary)] text-[var(--text-inverse)]' : 'rounded-bl-md border-[var(--border-secondary)] bg-[var(--surface-raised)] text-[var(--text-primary)]'}`}`}>
      {consumedMessage ? <div className="flex min-w-52 items-center gap-3 opacity-65"><span className="grid h-10 w-10 place-items-center rounded-full border border-current/20"><Eye size={18} /></span><span><span className="block text-sm font-black">Already opened</span><span className="text-xs">This view-once message is closed.</span></span></div> : protectedMessage ? <button onClick={onReveal} className="flex min-w-52 items-center gap-3 rounded-xl border border-current/20 p-3 text-left"><span className="grid h-10 w-10 place-items-center rounded-full border border-current/30"><Eye size={18} /></span><span><span className="block text-sm font-black">Open once</span><span className="text-xs opacity-70">Tap to reveal this message</span></span></button> : <>
        {message.attachments.map(attachment => <AttachmentCard key={attachment.id} attachment={attachment} sticker={message.message_type === 'sticker'} />)}
        {message.message_type === 'location' && message.payload && <a href={`https://www.google.com/maps?q=${message.payload.latitude},${message.payload.longitude}`} target="_blank" rel="noreferrer" className="mb-2 flex items-center gap-3 rounded-xl bg-black/10 p-3"><MapPin /><span><span className="block font-bold">Shared location</span><span className="text-xs opacity-70">Open in maps</span></span></a>}
        {message.message_type === 'contact' && message.payload && <div className="mb-2 flex items-center gap-3 rounded-xl bg-black/10 p-3"><ContactRound /><span><span className="block font-bold">{String(message.payload.name || 'Contact')}</span><span className="text-xs opacity-70">{String(message.payload.phone || '')}</span></span></div>}
        {message.poll && <PollCard poll={message.poll} onVote={onVote} />}
        {message.event && <EventCard event={message.event} onResponse={onEventResponse} />}
        {hasAttachments && attachmentCaption && <p className={`mt-1 max-w-xl whitespace-pre-wrap break-words rounded-[16px] px-3.5 py-2.5 text-sm leading-6 ${mine ? 'ml-auto rounded-br-md bg-[var(--accent-primary)] text-[var(--text-inverse)]' : 'rounded-bl-md border border-[var(--border-secondary)] bg-[var(--surface-raised)] text-[var(--text-primary)]'}`}>{attachmentCaption}</p>}
        {!hasAttachments && message.body && !['poll', 'event', 'meeting', 'location', 'contact'].includes(message.message_type) && <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p>}
      </>}
      <div className={`mt-1.5 flex items-center justify-end gap-2 text-[10px] ${hasAttachments && !protectedMessage ? 'w-fit rounded-full border border-[var(--border-secondary)] bg-[var(--surface-raised)] px-2 py-1 text-[var(--text-muted)] shadow-sm ml-auto' : mine ? 'text-current/65' : 'text-[var(--text-muted)]'}`}><time>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>{message.view_once && <Eye size={12} aria-label="Open once" />}{mine && <DeliveryCircle status={message.delivery_status || 'sent'} />}</div>
      <button onClick={onToggleReaction} className={`absolute top-1/2 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-[var(--border-secondary)] bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-md group-hover:grid ${mine ? '-left-11' : '-right-11'}`} aria-label="React"><Smile size={15} /></button>
      {reactionOpen && <div className={`absolute bottom-[calc(100%+0.35rem)] z-20 flex gap-1 rounded-full border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-1.5 shadow-xl ${mine ? 'right-0' : 'left-0'}`}>{quickEmoji.map(emoji => <button key={emoji} onClick={() => onReact(emoji)} className="grid h-8 w-8 place-items-center rounded-full text-lg hover:bg-[var(--surface-muted)]">{emoji}</button>)}</div>}
      {!!reactionGroups.length && <div className={`absolute -bottom-3 flex gap-1 ${mine ? 'right-3' : 'left-3'}`}>{reactionGroups.map(([emoji, count]) => <button key={emoji} onClick={() => onReact(emoji)} className="rounded-full border border-[var(--border-secondary)] bg-[var(--surface-raised)] px-2 py-0.5 text-xs text-[var(--text-primary)] shadow-sm">{emoji}{count > 1 ? ` ${count}` : ''}</button>)}</div>}
    </article>
  </div>;
}

function AttachmentCard({ attachment, sticker }: { attachment: Attachment; sticker: boolean }) {
  if (attachment.mimeType.startsWith('image/') && attachment.url) return <a href={attachment.url} target="_blank" rel="noreferrer" className={`${sticker ? 'inline-block bg-transparent' : 'block overflow-hidden rounded-[20px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] shadow-sm'}`} aria-label={`Open ${attachment.name}`}><Image src={attachment.url} alt={attachment.name} width={720} height={540} unoptimized className={`${sticker ? 'h-auto max-h-44 bg-transparent' : 'h-auto max-h-[min(34rem,65dvh)]'} max-w-full object-contain`} /></a>;
  if (attachment.mimeType.startsWith('video/') && attachment.url) return <div className="overflow-hidden rounded-[20px] border border-[var(--border-secondary)] bg-black shadow-sm"><video controls playsInline preload="metadata" src={attachment.url} className="max-h-[min(34rem,65dvh)] max-w-full" /></div>;
  if (attachment.mimeType.startsWith('audio/') && attachment.url) return <div className="min-w-[min(19rem,78vw)] rounded-[20px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-3 shadow-sm"><div className="mb-2 flex items-center gap-2 text-xs font-black text-[var(--text-secondary)]"><Mic size={16} className="text-[var(--accent-primary)]" />Voice or audio note</div><audio controls preload="metadata" src={attachment.url} className="w-full" /></div>;
  return <a href={attachment.url || '#'} target="_blank" rel="noreferrer" className="flex min-w-[min(18rem,78vw)] items-center gap-3 rounded-[18px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-3.5 text-[var(--text-primary)] shadow-sm"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><FileText /></span><span className="min-w-0"><span className="block truncate font-bold">{attachment.name}</span><span className="text-xs text-[var(--text-muted)]">{formatBytes(attachment.byteSize)} · Open file</span></span></a>;
}

function AttachmentReview({ pending, caption, setCaption, viewOnce, setViewOnce, busy, onCancel, onSend }: {
  pending: PendingAttachment; caption: string; setCaption: (value: string) => void; viewOnce: boolean; setViewOnce: (value: boolean) => void; busy: boolean; onCancel: () => void; onSend: () => void;
}) {
  const visual = pending.file.type.startsWith('image/') && pending.previewUrl
    ? <Image src={pending.previewUrl} alt="Attachment preview" width={960} height={720} unoptimized className="max-h-[52dvh] w-auto max-w-full rounded-[18px] object-contain" />
    : pending.file.type.startsWith('video/') && pending.previewUrl
      ? <video src={pending.previewUrl} controls playsInline className="max-h-[52dvh] max-w-full rounded-[18px]" />
      : pending.file.type.startsWith('audio/') && pending.previewUrl
        ? <div className="w-full rounded-[20px] bg-[var(--surface-muted)] p-5"><div className="mb-4 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-primary)]"><Mic /></span><div><p className="font-black">{pending.noteKind === 'voice' ? 'Voice note' : 'Audio'}</p><p className="text-xs text-[var(--text-muted)]">Listen before sending</p></div></div><audio controls src={pending.previewUrl} className="w-full" /></div>
        : <span className="grid min-h-44 w-full place-items-center rounded-[20px] bg-[var(--surface-muted)] text-[var(--accent-primary)]"><span className="text-center"><FileText size={42} className="mx-auto" /><span className="mt-3 block max-w-72 truncate text-sm font-black text-[var(--text-primary)]">{pending.file.name}</span></span></span>;
  const label = pending.noteKind === 'voice' ? 'voice note' : pending.noteKind === 'video' ? 'video note' : pending.file.type.startsWith('image/') ? 'photo' : pending.file.type.startsWith('video/') ? 'video' : 'file';
  return <div className="fixed inset-0 z-[95] grid place-items-center overflow-y-auto bg-black/70 p-3 backdrop-blur-md" role="dialog" aria-modal="true" aria-label={`Review ${label}`}>
    <div className="my-auto w-full max-w-2xl rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-raised)] p-4 text-[var(--text-primary)] shadow-2xl sm:p-5">
      <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-primary)]">Review before sending</p><h3 className="mt-1 font-editorial text-2xl capitalize">{label}</h3></div><button onClick={onCancel} disabled={busy} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-[var(--surface-muted)]" aria-label="Cancel attachment"><X size={18} /></button></div>
      <div className="mt-4 flex min-h-44 items-center justify-center overflow-hidden rounded-[20px] bg-[var(--bg-primary)] p-2">{visual}</div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]"><span className="min-w-0 truncate">{pending.file.name}</span><span className="shrink-0">{formatBytes(pending.file.size)}</span></div>
      <textarea autoFocus value={caption} onChange={event => setCaption(event.target.value)} rows={2} maxLength={8000} className="mt-4 w-full resize-none rounded-[18px] border border-[var(--border-secondary)] bg-[var(--surface-muted)] px-4 py-3 text-sm outline-none focus:border-[var(--accent-primary)]" placeholder={`Write something about this ${label} (optional)`} />
      <button onClick={() => setViewOnce(!viewOnce)} className={`mt-3 flex w-full items-center justify-between rounded-[16px] border px-4 py-3 text-left ${viewOnce ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'border-[var(--border-secondary)]'}`}><span className="flex items-center gap-3"><Eye size={18} /><span><span className="block text-sm font-black">Open once</span><span className="block text-[10px] opacity-70">The recipient can reveal it one time</span></span></span><span className={`h-5 w-9 rounded-full p-0.5 ${viewOnce ? 'bg-[var(--accent-primary)]' : 'bg-[var(--surface-muted)]'}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${viewOnce ? 'translate-x-4' : ''}`} /></span></button>
      <div className="mt-4 grid grid-cols-[auto_1fr] gap-2"><button onClick={onCancel} disabled={busy} className="rounded-[16px] border border-[var(--border-secondary)] px-5 py-3 text-sm font-black">Cancel</button><button onClick={onSend} disabled={busy} className="flex items-center justify-center gap-2 rounded-[16px] bg-[var(--accent-primary)] px-5 py-3 text-sm font-black text-[var(--text-inverse)] disabled:opacity-50"><Send size={17} />{busy ? 'Sending…' : `Send ${label}`}</button></div>
    </div>
  </div>;
}

function RecordingDialog({ kind, seconds, stream, onCancel, onStop }: { kind: NoteKind; seconds: number; stream: MediaStream | null; onCancel: () => void; onStop: () => void }) {
  const previewRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (previewRef.current && stream) previewRef.current.srcObject = stream;
  }, [stream]);
  return <div className="fixed inset-0 z-[96] grid place-items-center bg-black/70 p-3 backdrop-blur-md" role="dialog" aria-modal="true" aria-label={`Recording ${kind} note`}>
    <div className="w-full max-w-md rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-raised)] p-5 text-center text-[var(--text-primary)] shadow-2xl">
      <div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-primary)]">Recording {kind} note</p><button onClick={onCancel} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-[var(--surface-muted)]" aria-label="Cancel recording"><X size={18} /></button></div>
      {kind === 'video' ? <video ref={previewRef} autoPlay muted playsInline className="mt-4 aspect-video w-full rounded-[20px] bg-black object-cover" /> : <div className="mx-auto mt-8 grid h-28 w-28 place-items-center rounded-full border border-[var(--accent-primary)] bg-[var(--accent-soft)] text-[var(--accent-primary)] shadow-[0_0_0_12px_var(--surface-muted)]"><Mic size={40} /><span className="absolute h-3 w-3 translate-x-12 -translate-y-10 animate-pulse rounded-full bg-red-500" /></div>}
      <p className="mt-7 font-editorial text-4xl tabular-nums">{formatDuration(seconds)}</p>
      <p className="mt-2 text-xs text-[var(--text-muted)]">{kind === 'video' ? 'Video notes stop after 1 minute.' : 'Voice notes stop after 5 minutes.'}</p>
      <div className="mt-6 grid grid-cols-2 gap-2"><button onClick={onCancel} className="rounded-[16px] border border-[var(--border-secondary)] px-4 py-3 text-sm font-black">Discard</button><button onClick={onStop} className="flex items-center justify-center gap-2 rounded-[16px] bg-[var(--accent-primary)] px-4 py-3 text-sm font-black text-[var(--text-inverse)]"><span className="h-3.5 w-3.5 rounded-[3px] bg-current" />Stop and review</button></div>
    </div>
  </div>;
}

function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  const [category, setCategory] = useState<EmojiCategory>('Recent');
  return <div className="absolute bottom-[calc(100%+0.6rem)] left-0 z-[75] w-[min(25rem,calc(100vw-1.25rem))] overflow-hidden rounded-[24px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-2xl">
    <div className="flex items-center justify-between border-b border-[var(--border-secondary)] px-4 py-3"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Emoji</p><p className="mt-0.5 text-xs text-[var(--text-secondary)]">Choose as many as you like</p></div><button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--surface-muted)]" aria-label="Close emoji picker"><X size={15} /></button></div>
    <div className="ondwira-scrollbar flex gap-1 overflow-x-auto border-b border-[var(--border-secondary)] p-2">{(Object.keys(emojiCategories) as EmojiCategory[]).map(name => <button key={name} onClick={() => setCategory(name)} className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black ${category === name ? 'bg-[var(--accent-primary)] text-[var(--text-inverse)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'}`}>{name}</button>)}</div>
    <div className="ondwira-scrollbar grid max-h-60 grid-cols-7 gap-1 overflow-y-auto p-3 sm:grid-cols-8">{emojiCategories[category].map((emoji, index) => <button key={`${emoji}-${index}`} onClick={() => onSelect(emoji)} className="grid h-10 w-10 place-items-center rounded-xl text-2xl transition hover:bg-[var(--surface-muted)] hover:scale-110" aria-label={`Insert ${emoji}`}>{emoji}</button>)}</div>
  </div>;
}

function PollCard({ poll, onVote }: { poll: Poll; onVote: (optionId: string) => void }) {
  const total = poll.options.reduce((sum, option) => sum + option.votes, 0);
  return <div className="min-w-56"><p className="font-bold">{poll.question}</p><div className="mt-3 space-y-2">{poll.options.map(option => <button key={option.id} onClick={() => onVote(option.id)} className="relative block w-full overflow-hidden rounded-xl border border-current/15 p-2.5 text-left text-xs"><span className="absolute inset-y-0 left-0 bg-current/10" style={{ width: `${total ? option.votes / total * 100 : 0}%` }} /><span className="relative flex justify-between gap-3"><span>{option.mine ? '● ' : '○ '}{option.label}</span><span>{option.votes}</span></span></button>)}</div><p className="mt-2 text-[10px] opacity-65">{total} vote{total === 1 ? '' : 's'}</p></div>;
}

function EventCard({ event, onResponse }: { event: ChatEvent; onResponse: (response: string) => void }) {
  return <div className="min-w-60"><div className="flex items-start gap-3"><CalendarPlus className="mt-0.5 shrink-0" /><div><p className="font-bold">{event.title}</p><p className="mt-1 text-xs opacity-70">{new Date(event.startsAt).toLocaleString()}</p>{event.location && <p className="mt-1 text-xs opacity-70">{event.location}</p>}</div></div>{event.description && <p className="mt-3 text-xs leading-5 opacity-80">{event.description}</p>}{event.meetingUrl && <a href={event.meetingUrl} target="_blank" rel="noreferrer" className="mt-3 block rounded-lg bg-black/10 px-3 py-2 text-center text-xs font-bold">Join meeting</a>}<div className="mt-3 grid grid-cols-3 gap-1">{['going', 'maybe', 'declined'].map(response => <button key={response} onClick={() => onResponse(response)} className="rounded-lg border border-current/15 px-2 py-1.5 text-[10px] capitalize">{response}</button>)}</div></div>;
}

function AttachmentTray({ context, onClose, onGallery, onCamera, onDocument, onAudio, onVoiceNote, onVideoNote, onSticker, onLocation, onContact, onPoll, onEvent, onMeeting, onAi }: {
  context: 'social' | 'work'; onClose: () => void; onGallery: () => void; onCamera: () => void; onDocument: () => void; onAudio: () => void; onVoiceNote: () => void; onVideoNote: () => void; onSticker: () => void; onLocation: () => void; onContact: () => void; onPoll: () => void; onEvent: () => void; onMeeting: () => void; onAi: () => void;
}) {
  const items: Array<[string, LucideIcon, () => void]> = [
    ['Gallery', ImageIcon, onGallery], ['Camera', Camera, onCamera], ['Document', FileText, onDocument], ['Voice note', Mic, onVoiceNote], ['Video note', Video, onVideoNote], ['Audio file', Mic, onAudio], ['Location', MapPin, onLocation], ['Contact', ContactRound, onContact], ['Poll', Plus, onPoll], ['Event', CalendarPlus, onEvent], ['Sticker', Sticker, onSticker], ['Device AI', Bot, onAi],
    ...(context === 'work' ? [['Meeting', Video, onMeeting] as [string, LucideIcon, () => void]] : []),
  ];
  return <div className="absolute bottom-[calc(100%+0.6rem)] left-0 z-30 w-[min(25rem,calc(100vw-2rem))] rounded-[24px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-3 text-[var(--text-primary)] shadow-2xl"><div className="flex items-center justify-between px-1 pb-2"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Add to conversation</span><button onClick={onClose}><X size={15} /></button></div><div className="grid grid-cols-4 gap-2 sm:grid-cols-5">{items.map(([label, Icon, action]) => <button key={label} onClick={action} className="flex min-w-0 flex-col items-center gap-2 rounded-2xl p-2 text-[10px] font-bold hover:bg-[var(--surface-muted)]"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><Icon size={18} /></span><span className="truncate">{label}</span></button>)}</div></div>;
}

function ConversationMenu({ context, settings, onMeeting, onMute, onDisappear, onReport, onBlock }: { context: 'social' | 'work'; settings: ConversationSettings | null; onMeeting: () => void; onMute: () => void; onDisappear: (seconds: number | null) => void; onReport: () => void; onBlock: () => void }) {
  return <div className="absolute right-0 top-11 z-[80] w-[min(18rem,calc(100vw-1.5rem))] rounded-[20px] border border-[var(--border-primary)] bg-[var(--surface-raised)] p-2 text-[var(--text-primary)] shadow-[0_22px_70px_rgba(0,0,0,0.38)]">
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

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}
