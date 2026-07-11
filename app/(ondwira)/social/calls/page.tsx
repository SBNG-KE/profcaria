import { Phone, Video } from 'lucide-react';

export default function CallsPage() {
  return <section className="mx-auto max-w-5xl p-5 sm:p-8"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#7b847e]">Social</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">Calls</h1><p className="mt-2 text-[#6c756f]">Voice and video history will live together here.</p><div className="mt-8 grid gap-4 sm:grid-cols-2"><div className="rounded-[28px] bg-[#183d31] p-7 text-white"><Phone className="text-[#f6c85f]" /><h2 className="mt-10 text-xl font-black">Voice calls</h2><p className="mt-2 text-sm leading-6 text-white/65">Private one-to-one and group calls.</p></div><div className="rounded-[28px] bg-white p-7"><Video className="text-[#183d31]" /><h2 className="mt-10 text-xl font-black">Video calls</h2><p className="mt-2 text-sm leading-6 text-[#6c756f]">Secure video with screen-sharing controls.</p></div></div></section>;
}
