import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeWrapper from "./components/ThemeWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.profcaria.com'),
  manifest: '/manifest.json',
  title: {
    default: "Profcaria",
    template: "%s | Profcaria"
  },
  description: "The exclusive professional network tailored for your growth. Connect with top employers through verified smart matching. No ghosting, just results.",
  keywords: ["Jobs", "Career", "Smart Matching", "Executive Search", "Growth", "Professional Network", "Exclusive Platform"],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png', // Using profcaria.png as apple icon since apple-icon.png doesn't exist
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/apple-touch-icon.png',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.profcaria.com',
    siteName: 'Profcaria',
    title: 'Profcaria | Exclusive Professional Network',
    description: 'The exclusive professional network tailored for your growth. Connect with top employers through verified smart matching.',
    images: [
      {
        url: 'https://www.profcaria.com/profcaria.png',
        width: 1200,
        height: 630,
        alt: 'Profcaria Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Profcaria | Exclusive Professional Network',
    description: 'The exclusive professional network tailored for your growth. Connect with top employers through verified smart matching.',
    creator: '@profcaria',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "6xck7xYL-QCWEu1is-U_xcQlkUjfWGxengTW-7mIrk4",
    other: {
      me: ['@profcaria'],
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeWrapper>
          {children}
        </ThemeWrapper>
      </body>
    </html>
  );
}
