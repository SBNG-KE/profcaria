import { Search, SlidersHorizontal } from 'lucide-react';

export default function FindWorkPage() {
  return <section className="mx-auto max-w-6xl p-5 sm:p-8"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#7b847e]">Opportunity</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">Find work</h1><p className="mt-2 text-[#6c756f]">Visible because you enabled it in Settings.</p><div className="mt-7 flex gap-3 rounded-[24px] bg-white p-3 shadow-sm"><Search className="ml-2 mt-2.5 text-[#6c756f]" size={20} /><input className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" placeholder="Role, skill, or company" /><button className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e8efe9] text-[#183d31]" aria-label="Job filters"><SlidersHorizontal size={19} /></button></div></section>;
}
