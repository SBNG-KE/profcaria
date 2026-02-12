import React, { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import LandingPageClient from '@/app/components/LandingPageClient';

// Server Component (Default)
export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  // Server-side auth check for instant redirect
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('profcaria_session')?.value;
    const { mode } = await searchParams;

    if (token && !mode) {
      const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secretKey);

      if (payload?.schema === 'professional') {
        redirect('/professional/feed');
      } else if (payload?.schema === 'employer') {
        redirect('/employer/feed');
      }
    }
  } catch (e) {
    // If token is invalid or verification fails, just render the landing page
    // No action needed, flow continues below
  }

  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent border-white rounded-full" />
      </div>
    }>
      <LandingPageClient />
    </Suspense>
  );
}