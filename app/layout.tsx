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
    default: "Profcaria | Network & Find Work",
    template: "%s | Profcaria"
  },
  description: "The exclusive professional network tailored for your growth. Connect with top employers through verified smart matching. No ghosting, just results.",
  keywords: ["Jobs", "Career", "Smart Matching", "Executive Search", "Growth", "Professional Network", "Exclusive Platform"],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
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
    title: 'Profcaria | Network & Find Work',
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
    title: 'Profcaria | Network & Find Work',
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
// JSON-LD Structured Data for AI crawlers and search engines
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.profcaria.com/#organization",
      "name": "Profcaria | Network & Find Work",
      "url": "https://www.profcaria.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.profcaria.com/profcaria.png",
        "width": 1200,
        "height": 630
      },
      "description": "The exclusive professional network tailored for your growth. Connect with top employers through verified smart matching.",
      "sameAs": [
        "https://twitter.com/profcaria"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://www.profcaria.com/#website",
      "url": "https://www.profcaria.com",
      "name": "Profcaria | Network & Find Work",
      "publisher": {
        "@id": "https://www.profcaria.com/#organization"
      },
      "description": "Premium professional networking platform with AI-powered smart matching and instant work history verification.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://www.profcaria.com/auth?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "WebApplication",
      "@id": "https://www.profcaria.com/#application",
      "name": "Profcaria | Network & Find Work",
      "url": "https://www.profcaria.com",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Free tier available with premium subscription options"
      },
      "featureList": [
        "AI-powered smart job matching",
        "Instant work history verification by employers",
        "Verified professional and company profiles",
        "No-ghosting guarantee on job applications",
        "Professional networking feed",
        "AI resume analysis",
        "Secure document sharing"
      ],
      "description": "Profcaria connects job seekers with employers through verified smart matching. Employers can instantly verify employees, ensuring authentic work histories when candidates apply for jobs."
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
