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
    default: "Profcaria",
    template: "%s | Profcaria AI",
  },

  description:
    "Profcaria is the all-in-one professional and social ecosystem. Connect with friends, chat instantly, prove your skills with Verified Evidence, and let intelligent AI agents handle your career growth.",

  keywords: [
    "AI Professional Ecosystem",
    "Professional Social Network",
    "Career & Social Hub",
    "Encrypted Professional Chat",
    "AI Career Mentorship",
    "Verified Skills & Evidence",
    "Messaging with Friends",
    "Professional Networking",
    "Interactive Social Feeds",
  ],

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.profcaria.com",
    siteName: "Profcaria AI",
    title: "Profcaria",
    description:
      "The all-in-one professional and social ecosystem. Connect with friends, prove your skills with Verified Evidence, and let AI tools sharpen your career edge.",
    images: [
      {
        url: "https://www.profcaria.com/profcaria.png",
        width: 1200,
        height: 630,
        alt: "Profcaria",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Profcaria",
    description:
      "Connect with friends, follow the feed, and grow. The all-in-one social and professional ecosystem that intelligently guides your next career move.",
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
        "Profcaria is an all-in-one professional and social ecosystem combining instant secure messaging with friends, interactive feeds, verified skill proofs, and autonomous career AI agents.",
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
        "Instant Professional & Social Messaging",
        "Interactive Social Feeds & Groups",
        "Verified Evidence & Skill Tracking",
        "Autonomous AI Career Mentorship",
        "LLM-Native Semantic Talent Search",
        "Algorithmic Intent-Driven Matching",
      ],
      description:
        "An all-in-one professional networking and social ecosystem powered by autonomous intelligence, replacing traditional profiles with dynamic communication, verified evidence, and AI talent matching.",
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