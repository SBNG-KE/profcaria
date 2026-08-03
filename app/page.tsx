import { Suspense } from 'react';
import LandingPageClient from '@/app/components/LandingPageClient';

export default function HomePage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[var(--bg-primary)] font-mono text-sm text-[var(--text-secondary)]">Loading Profcaria jobs...</div>}>
      <LandingPageClient />
    </Suspense>
  );
}
