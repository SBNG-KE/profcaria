import { Flag, ShieldBan, Users } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getProfcariaSession } from '@/lib/profcaria-auth';

export const metadata = { title: 'Safety administration | Profcaria' };
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getProfcariaSession();
  const allowedAdmins = new Set((process.env.ADMIN_ACCOUNT_IDS ?? '').split(',').map((id) => id.trim()).filter(Boolean));
  if (!session || !allowedAdmins.has(session.uid)) redirect('/');

  return <main className="min-h-screen bg-[var(--bg-primary)] p-5 text-[var(--text-primary)] sm:p-9"><div className="mx-auto max-w-7xl"><p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-primary)]">Restricted / Profcaria safety</p><h1 className="mt-3 text-5xl font-black tracking-[-0.05em]">Trust queue</h1><div className="mt-9 grid gap-4 sm:grid-cols-3">{[[Flag,'Open reports','Jobs, companies, accounts, messages and documents'],[ShieldBan,'Actions','Pause a job, block an account or suspend a company'],[Users,'Review history','Every decision retains an admin, reason and timestamp']].map(([Icon,title,body]) => { const CardIcon = Icon as typeof Flag; return <article key={String(title)} className="border-2 border-[var(--text-primary)] bg-[var(--surface-raised)] p-6"><CardIcon className="text-[var(--accent-primary)]" /><h2 className="mt-7 text-xl font-black">{String(title)}</h2><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{String(body)}</p></article>; })}</div><div className="mt-8 border-2 border-dashed border-[var(--text-primary)] p-12 text-center"><p className="font-black">No report data is exposed in the browser by default.</p><p className="mt-2 text-sm text-[var(--text-secondary)]">The production queue requires an admin account ID allowlist and records every action in the safety audit.</p></div></div></main>;
}
