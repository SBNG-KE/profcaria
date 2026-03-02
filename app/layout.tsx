import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GeistPixelCircle } from "geist/font/pixel";
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
    default: "Profcaria | AI Career Operating System",
    template: "%s | Profcaria Career OS"
  },
  description: "Profcaria is an AI-powered Career Operating System that manages your professional identity, verified career graph, smart matching, and long-term growth strategy in one secure ecosystem.",
  keywords: [
    "Career Operating System",
    "AI Career Infrastructure",
    "Verified Employment Graph",
    "Smart Talent Engine",
    "AI Career Agent",
    "Professional Identity",
    "Encrypted Career Vault"
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.profcaria.com',
    siteName: 'Profcaria Career OS',
    title: 'Profcaria | AI Career Operating System',
    description: 'The AI-powered Career Operating System managing verified professional identity, smart talent matching, and long-term growth.',
    images: [
      {
        url: 'https://www.profcaria.com/profcaria.png',
        width: 1200,
        height: 630,
        alt: 'Profcaria Career Operating System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Profcaria | AI Career Operating System',
    description: 'Own your verified career identity. Smart AI matching. Secure career infrastructure.',
    creator: '@profcaria',
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: { google: "6xck7xYL-QCWEu1is-U_xcQlkUjfWGxengTW-7mIrk4", other: { me: ['@profcaria'], }, },
};
// JSON-LD Structured Data for AI crawlers and search engines
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.profcaria.com/#organization",
      "name": "Profcaria Career Operating System",
      "url": "https://www.profcaria.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.profcaria.com/profcaria.png"
      },
      "description": "Profcaria is an AI-powered Career Operating System managing verified professional identity, encrypted career records, and intelligent talent matching.",
      "sameAs": [
        "https://twitter.com/profcaria"
      ]
    },
    {
      "@type": "WebApplication",
      "@id": "https://www.profcaria.com/#application",
      "name": "Profcaria Career OS",
      "url": "https://www.profcaria.com",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "featureList": [
        "Verified Career Graph",
        "AI Career Agent",
        "Encrypted Career Vault",
        "Intent-Driven Matching",
        "Zero-Application Hiring",
        "Smart Talent Engine",
        "Immutable Employment Verification"
      ],
      "description": "An AI-native Career Operating System that replaces traditional CVs with a verified career graph and intelligent growth infrastructure."
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${GeistPixelCircle.variable} antialiased`}
      >
        <ThemeWrapper>
          {children}
        </ThemeWrapper>
      </body>
    </html>
  );
}
