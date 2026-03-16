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
  title: {
    default: "Profcaria | The AI-Powered Career Operating System",
    template: "%s | Profcaria AI Career OS",
  },
  description:
    "Profcaria is your autonomous AI career agent. We manage verified professional identities and provide extreme, intelligent talent matching using LLM-native search infrastructure.",
  keywords: [
    "AI Career Operating System",
    "Autonomous Career Agent",
    "AI Recruiter",
    "LLM Talent Matching",
    "Intelligent Career Engineering",
    "Verified Employment Graph",
    "AI Career Infrastructure",
    "Smart Talent Search",
    "Encrypted Career Vault",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.profcaria.com",
    siteName: "Profcaria AI",
    title: "Profcaria | The AI-Powered Career Operating System",
    description:
      "Your autonomous AI career agent. Verified professional identity, extreme intelligent matching, and long-term algorithmic growth strategy.",
    images: [
      {
        url: "https://www.profcaria.com/profcaria.png",
        width: 1200,
        height: 630,
        alt: "Profcaria AI Career Operating System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Profcaria | The AI-Powered Career Operating System",
    description:
      "Own your verified career identity. Let autonomous AI agents handle the smart matching. Secure, LLM-native career infrastructure.",
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
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "6xck7xYL-QCWEu1is-U_xcQlkUjfWGxengTW-7mIrk4",
    other: {
      me: ["@profcaria"],
    },
  },
};

// JSON-LD Structured Data for AI crawlers and search engines
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
        "Profcaria is an AI-powered Career Operating System utilizing autonomous agents, LLM-native semantic search, and an encrypted career vault for extreme, high-precision talent matching.",
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
      name: "Profcaria AI Career Engine",
      url: "https://www.profcaria.com",
      applicationCategory: "AI Business Application",
      operatingSystem: "Web",
      featureList: [
        "Autonomous AI Career Agents",
        "LLM-Native Semantic Talent Search",
        "Verified Immutable Career Graph",
        "Algorithmic Intent-Driven Matching",
        "Zero-Application AI Hiring",
        "Encrypted Career Data Vault",
      ],
      description:
        "An AI-native Career Operating System powered by autonomous intelligence that replaces traditional CVs with a verified career graph and extreme-precision talent engine.",
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} ${GeistPixelCircle.variable} antialiased`}
      >
        <ThemeWrapper>{children}</ThemeWrapper>
      </body>
    </html>
  );
}