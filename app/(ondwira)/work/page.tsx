import Link from 'next/link';
import { BriefcaseBusiness, CalendarDays, ChartNoAxesCombined, FileText, MessageCircle, Users } from 'lucide-react';

const tools = [
  { title: 'Work chats', text: 'Company-managed channels and direct messages.', href: '/work', icon: MessageCircle },
  { title: 'Meetings', text: 'Plan meetings and keep their notes together.', href: '/work/meetings', icon: CalendarDays },
  { title: 'People', text: 'Employees join and leave through workspace membership.', href: '/work/people', icon: Users },
  { title: 'Jobs', text: 'Create, publish, share, and manage job openings.', href: '/work/jobs', icon: BriefcaseBusiness },
  { title: 'Applications', text: 'Review candidates and coordinate hiring.', href: '/work/applications', icon: FileText },
  { title: 'Reports', text: 'See hiring and workforce activity clearly.', href: '/work/reports', icon: ChartNoAxesCombined },
];

export default function WorkPage() {
  return <section className="mx-auto max-w-6xl p-5 sm:p-8"><div className="rounded-[32px] bg-[#183d31] p-7 text-white sm:p-10"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#f6c85f]">Work mode</p><h1 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.045em] sm:text-5xl">Everything your team needs, without leaving Ondwira.</h1><p className="mt-4 max-w-2xl leading-7 text-white/65">Your work access comes from the organisations you belong to. Personal chats and files never become company data.</p><button className="mt-7 rounded-2xl bg-[#f6c85f] px-5 py-3 text-sm font-black text-[#183d31]">Choose workspace</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{tools.map(({ title, text, href, icon: Icon }) => <Link key={title} href={href} className="group rounded-[26px] border border-[#18251f]/10 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#183d31]/5"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e8efe9] text-[#183d31]"><Icon size={20} /></span><h2 className="mt-7 text-lg font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-[#6c756f]">{text}</p></Link>)}</div></section>;
}
