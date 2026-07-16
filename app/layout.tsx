import type { Metadata } from 'next';
import { Cormorant_Garamond, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import ThemeWrapper from './components/ThemeWrapper';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const editorial = Cormorant_Garamond({ variable: '--font-editorial', subsets: ['latin'], display: 'swap' });

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ondwira.com';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  manifest: '/manifest.json',
  title: { default: 'Ondwira', template: '%s · Ondwira' },
  description: 'One place to talk, work, meet, manage opportunities, and connect the tools you trust.',
  applicationName: 'Ondwira',
  keywords: ['Ondwira', 'messaging', 'workspaces', 'meetings', 'jobs', 'private communication'],
  icons: {
    icon: [{ url: '/icon.svg?v=20260716b', type: 'image/svg+xml' }, { url: '/favicon.ico?v=20260716b', sizes: 'any' }],
    shortcut: '/favicon.ico?v=20260716b',
    apple: [{ url: '/apple-touch-icon.png?v=20260716b', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website', url: appUrl, siteName: 'Ondwira', title: 'Ondwira',
    description: 'Always connected to people, work, and opportunity.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Ondwira detached D wordmark' }],
  },
  twitter: { card: 'summary_large_image', title: 'Ondwira', description: 'Always connected to people, work, and opportunity.', images: ['/og-image.png'] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `(function(){try{var p=localStorage.getItem('ondwira-theme')||localStorage.getItem('profcaria-theme')||'system';var d=p==='system'?matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light':p;document.documentElement.classList.add(d);document.documentElement.dataset.theme=d;document.documentElement.dataset.themePreference=p;document.documentElement.style.colorScheme=d}catch(e){document.documentElement.classList.add('light')}})()` }} /></head><body className={`${geistSans.variable} ${geistMono.variable} ${editorial.variable} antialiased`}><ThemeWrapper>{children}</ThemeWrapper></body></html>;
}
