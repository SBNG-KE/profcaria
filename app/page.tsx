import React, { Suspense } from 'react';
import LandingPageClient from '@/app/components/LandingPageClient';

// Server Component (Default)
export default function LandingPage() {
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