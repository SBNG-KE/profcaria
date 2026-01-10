import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Profcaria | Private AI-Powered Career Network",
    template: "%s | Profcaria"
  },
  description: "The exclusive, privacy-first career marketplace. Connect with top employers securely using verified AI matching. No ghosting, just results.",
  keywords: ["Jobs", "Career", "Privacy", "AI Matching", "Tech Jobs", "Executive Search", "Private Network"],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.profcaria.com',
    siteName: 'Profcaria',
    title: 'Profcaria | Private AI-Powered Career Network',
    description: 'The exclusive, privacy-first career marketplace. Connect with top employers securely using verified AI matching.',
    images: [
      {
        url: 'https://www.profcaria.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Profcaria Platform Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Profcaria | Private AI-Powered Career Network',
    description: 'The exclusive, privacy-first career marketplace. Connect with top employers securely using verified AI matching.',
    creator: '@profcaria', // Update if known
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
