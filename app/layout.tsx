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
    default: "Profcaria Nexus",
    template: "%s | Profcaria Intelligence",
  },

  description:
    "Profcaria is the ultimate all-in-one social and professional ecosystem. Connect with friends, build communities, prove your skills with Verified Evidence, and let autonomous AI agents seamlessly guide your growth across the Profcaria Nexus.",

  keywords: [
    "Profcaria Nexus",
    "Profcaria Intelligence",
    "Social Ecosystem",
    "Professional Network",
    "Encrypted Chat",
    "Autonomous AI Agents",
    "Verified Evidence",
    "Community Building",
    "Interactive Social Feeds",
  ],

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.profcaria.com",
    siteName: "Profcaria Nexus",
    title: "Profcaria Nexus",
    description:
      "The complete social and professional ecosystem powered by autonomous intelligence. Replacing traditional networks with dynamic interactions, verified proof, and AI-driven connections.",
    images: [
      {
        url: "https://www.profcaria.com/profcaria.png",
        width: 1200,
        height: 630,
        alt: "Profcaria Nexus",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Profcaria",
    description:
      "Connect with friends, build communities, and evolve. The all-in-one social and professional ecosystem powered by autonomous intelligence.",
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
      name: "Profcaria Nexus",
      url: "https://www.profcaria.com",
      applicationCategory: "CommunicationApplication",
      operatingSystem: "Web, Mobile",
      featureList: [
        "Instant Social & Professional Messaging",
        "Interactive Communities & Groups",
        "Cryptographically Verified Evidence",
        "Autonomous AI Sub-Agents",
        "Semantic Network Building",
        "Algorithmic Intent-Driven Connections",
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