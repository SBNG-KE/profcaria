import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import ThemeWrapper from './components/ThemeWrapper';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ondwira.com';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  manifest: '/manifest.json',
  title: { default: 'Ondwira', template: '%s · Ondwira' },
  description: 'One place to talk, work, meet, manage opportunities, and connect the tools you trust.',
  applicationName: 'Ondwira',
  keywords: ['Ondwira', 'messaging', 'workspaces', 'meetings', 'jobs', 'private communication'],
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  openGraph: {
    type: 'website', url: appUrl, siteName: 'Ondwira', title: 'Ondwira',
    description: 'Always connected to people, work, and opportunity.',
  },
  twitter: { card: 'summary_large_image', title: 'Ondwira', description: 'Always connected to people, work, and opportunity.' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body className={`${geistSans.variable} ${geistMono.variable} antialiased`}><ThemeWrapper>{children}</ThemeWrapper></body></html>;
}
