import { Captions, MonitorUp, Phone, ShieldCheck, Sparkles, UsersRound, Video } from 'lucide-react';

export const metadata = { title: 'Calls | Ondwira' };

const features = [
  [ShieldCheck, 'Private by default', 'Calls will begin only from approved conversations and groups.'],
  [UsersRound, 'Group rooms', 'Move naturally from a Social group into a shared voice or video room.'],
  [Captions, 'Live captions', 'Optional device-assisted captions without turning the call into a public recording.'],
  [MonitorUp, 'Share deliberately', 'Screen sharing will always show a visible permission and active-sharing state.'],
] as const;

export default function CallsPage() {
  return <section className="relative min-h-full overflow-hidden px-4 pb-28 pt-5 sm:px-7 sm:pb-10 sm:pt-8">
    <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(var(--pixel-color) 0.7px, transparent 0.7px)', backgroundSize: '5px 5px' }} />
    <div className="relative mx-auto max-w-6xl">
      <header className="border-b border-[var(--border-primary)] pb-7"><div className="flex items-center gap-3"><p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--accent-primary)]">Social · calls</p><span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[9px] font-black uppercase tracking-wider text-[var(--accent-strong)]">Coming soon</span></div><h1 className="font-editorial mt-3 max-w-4xl text-5xl leading-[0.95] sm:text-7xl">A call should feel like entering a room, not operating a machine.</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">Native Ondwira voice and video are being designed for private conversations and groups. The controls below show the committed direction; calling is not active yet.</p></header>
      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        <article className="relative min-h-[390px] overflow-hidden rounded-[34px] bg-[var(--accent-primary)] p-7 text-[var(--text-inverse)] sm:p-10"><div className="absolute -right-16 -top-16 h-60 w-60 rounded-full border border-current/15" /><Phone size={26} /><div className="mt-28"><p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-60">Native voice</p><h2 className="font-editorial mt-3 text-5xl">Stay close without leaving Social.</h2><p className="mt-5 max-w-md text-sm leading-7 opacity-70">One-to-one and group voice calls, call links, noise control and clear privacy indicators.</p><button disabled className="mt-7 rounded-full bg-[var(--bg-primary)] px-5 py-3 text-xs font-black text-[var(--accent-primary)] opacity-65">Voice calls · coming soon</button></div></article>
        <article className="relative min-h-[390px] overflow-hidden rounded-[34px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-7 sm:p-10"><div className="absolute right-8 top-8 grid h-20 w-28 place-items-center rounded-[24px] border border-dashed border-[var(--accent-primary)]/40 bg-[var(--accent-soft)]"><Video className="text-[var(--accent-primary)]" /></div><Sparkles className="text-[var(--accent-primary)]" /><div className="mt-28"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)]">Native video</p><h2 className="font-editorial mt-3 text-5xl">See the people already in the conversation.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[var(--text-secondary)]">Video rooms will open from the chat header with camera, microphone, screen and participant controls.</p><button disabled className="mt-7 rounded-full border border-[var(--border-primary)] px-5 py-3 text-xs font-black text-[var(--text-muted)]">Video calls · coming soon</button></div></article>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{features.map(([Icon, title, text]) => <article key={title} className="rounded-[26px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-5"><Icon size={18} className="text-[var(--accent-primary)]" /><h3 className="mt-8 font-black">{title}</h3><p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">{text}</p></article>)}</div>
    </div>
  </section>;
}
