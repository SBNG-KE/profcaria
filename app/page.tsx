import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import LandingPageClient from '@/app/components/LandingPageClient';

export default async function LandingPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  try {
    const token = (await cookies()).get('profcaria_session')?.value;
    const { mode } = await searchParams;
    if (token && !mode && process.env.JWT_SECRET) {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
      if (payload?.uid) redirect('/social');
    }
  } catch {
    // Invalid or expired sessions see the public landing page.
  }

  return <Suspense fallback={<div className="grid h-screen place-items-center bg-[#183d31] text-white">Opening Ondwira…</div>}><LandingPageClient /></Suspense>;
}
