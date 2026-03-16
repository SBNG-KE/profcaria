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
  metadataBase: new URL("https://www.profcaria.com"),
  manifest: "/manifest.json",

  alternates: {
    canonical: "https://www.profcaria.com",
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  title: {
    default: "Profcaria | AI Professional Network & Messenger",
    template: "%s | Profcaria AI",
  },

  description:
    "Profcaria is the ultimate AI-powered professional messenger and network. Connect securely, chat instantly, and let autonomous AI agents handle your talent matching in one encrypted ecosystem.",

  keywords: [
    "AI Professional Network",
    "Professional Messenger",
    "Encrypted Professional Chat",
    "AI Career Matching",
    "Autonomous Career Agent",
    "LinkedIn Alternative",
    "Professional Networking",
    "AI Talent Search",
    "Secure Professional Messaging",
  ],

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.profcaria.com",
    siteName: "Profcaria AI",
    title: "Profcaria | AI Professional Network & Messenger",
    description:
      "The next-generation professional network. Instant secure messaging, verified identity, and extreme AI-powered talent matching.",
    images: [
      {
        url: "https://www.profcaria.com/profcaria.png",
        width: 1200,
        height: 630,
        alt: "Profcaria AI Professional Network",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Profcaria | AI Professional Network & Messenger",
    description:
      "Chat, connect, and grow. The secure AI-powered professional messenger that intelligently matches you to your next career opportunity.",
    creator: "@profcaria",
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  verification: {
    google: "6xck7xYL-QCWEu1is-U_xcQlkUjfWGxengTW-7mIrk4",
    other: {
      me: ["@profcaria"],
    },
  },
};

// JSON-LD Structured Data
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.profcaria.com/#organization",
      name: "Profcaria AI",
      url: "https://www.profcaria.com",
      logo: {
        "@type": "ImageObject",
        url: "https://www.profcaria.com/profcaria.png",
      },
      description:
        "Profcaria is an AI-powered professional messaging network combining instant secure communication with autonomous career agents and extreme-precision talent matching.",
      founder: {
        "@type": "Person",
        name: "Steve Ngare",
      },
      sameAs: [
        "https://twitter.com/profcaria",
        "https://www.linkedin.com/company/profcaria",
        "https://github.com/profcaria",
      ],
    },
    {
      "@type": "WebApplication",
      "@id": "https://www.profcaria.com/#application",
      name: "Profcaria AI Network",
      url: "https://www.profcaria.com",
      applicationCategory: "CommunicationApplication",
      operatingSystem: "Web, Mobile",
      featureList: [
        "Instant Professional Messaging",
        "End-to-End Encrypted Chat",
        "Autonomous AI Career Agents",
        "LLM-Native Semantic Talent Search",
        "Algorithmic Intent-Driven Matching",
        "Zero-Application AI Hiring",
      ],
      description:
        "A next-generation professional networking and messaging ecosystem powered by autonomous intelligence, replacing traditional profiles with dynamic communication and AI talent matching.",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${GeistPixelCircle.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        <ThemeWrapper>{children}</ThemeWrapper>
      </body>
    </html>
  );
}