import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import ThemeWrapper from './components/ThemeWrapper';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const editorial = Cormorant_Garamond({ variable: '--font-editorial', subsets: ['latin'], display: 'swap' });

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.profcaria.com';

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f0e6' },
    { media: '(prefers-color-scheme: dark)', color: '#081812' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  manifest: '/manifest.json',
  title: { default: 'Profcaria — Jobs in Kenya', template: '%s · Profcaria' },
  description: 'Applying for jobs, made simple. Current Kenyan vacancies with honest application limits and optional accounts for job seekers.',
  applicationName: 'Profcaria',
  keywords: ['Profcaria', 'Kenya jobs', 'jobs in Kenya', 'internships Kenya', 'hiring Kenya', 'ATS'],
  icons: {
    icon: [{ url: '/icon.png?v=20260806b', type: 'image/png', sizes: '512x512' }],
    shortcut: '/favicon.ico?v=20260806b',
    apple: [{ url: '/apple-touch-icon.png?v=20260806b', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website', url: appUrl, siteName: 'Profcaria', title: 'Profcaria — Jobs in Kenya',
    description: 'Applying for jobs, made simple.',
    images: [{ url: '/og.png', width: 1536, height: 1024, alt: 'Profcaria — Applying for jobs, made simple' }],
  },
  twitter: { card: 'summary_large_image', title: 'Profcaria — Jobs in Kenya', description: 'Applying for jobs, made simple.', images: ['/og.png'] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-KE" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `(function(){try{var p=localStorage.getItem('profcaria-theme')||'light';var d=p==='system'?matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light':p;document.documentElement.classList.add(d);document.documentElement.dataset.theme=d;document.documentElement.dataset.themePreference=p;document.documentElement.style.colorScheme=d}catch(e){document.documentElement.classList.add('light')}})()` }} /></head><body className={`${geistSans.variable} ${geistMono.variable} ${editorial.variable} antialiased`}><ThemeWrapper>{children}</ThemeWrapper></body></html>;
}
