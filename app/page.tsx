import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import LandingPageClient from '@/app/components/LandingPageClient';
import { getProfcariaSession } from '@/lib/profcaria-auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;

  // A returning recruiter resumes the hiring desk. The explicit view flag is
  // used by "Public jobs" inside the workspace so recruiters can still inspect
  // the candidate-facing register without being redirected back immediately.
  if (view !== 'jobs') {
    const session = await getProfcariaSession();
    if (session?.schema === 'employer') redirect('/work');

    if (session) {
      const { data: hiringMembership } = await supabaseAdmin.schema('profcaria').from('organization_members')
        .select('organization_id')
        .eq('user_id', session.uid)
        .eq('status', 'active')
        .in('role', ['owner', 'admin', 'manager'])
        .limit(1)
        .maybeSingle();
      if (hiringMembership) redirect('/work');
    }
  }

  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[var(--bg-primary)] font-mono text-sm text-[var(--text-secondary)]">Loading Profcaria jobs...</div>}>
      <LandingPageClient />
    </Suspense>
  );
}
