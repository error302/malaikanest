import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/malaika/providers";
import { getSiteSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site-config";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

async function getBranding() {
  try {
    const { branding } = await getSiteSettings();
    return branding;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getBranding();
  const storeName = branding?.store_name || "Malaika Nest";
  const favicon = branding?.favicon_url || "/logo.svg";

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${storeName} — Premium Baby & Maternity Store in Kenya`,
      template: `%s · ${storeName}`,
    },
    description: "Handcrafted organic baby clothing, accessories & toys made with love in Kenya. Premium quality for little ones aged 0-12 years. Free delivery in Mombasa, M-Pesa accepted.",
    keywords: [
      "baby clothes Kenya", "newborn clothing", "organic baby clothes",
      "baby shop Mombasa", "maternity Kenya", "baby gifts", storeName,
      "children's clothing Kenya", "baby essentials", "M-Pesa baby shop",
      "baby onesies Kenya", "kids clothes Mombasa", "handmade baby gifts Kenya",
    ],
    authors: [{ name: storeName }],
    creator: storeName,
    publisher: storeName,
    applicationName: storeName,
    icons: {
      icon: [
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon.ico", rel: "shortcut icon" },
      ],
      shortcut: "/favicon.ico",
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
      other: [
        { rel: "android-chrome-192x192", url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
        { rel: "android-chrome-512x512", url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      ],
    },
    manifest: "/site.webmanifest",
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    },
    openGraph: {
      type: "website",
      title: `${storeName} — Premium Baby & Maternity Store in Kenya`,
      description: "Handcrafted organic baby clothing, accessories & toys made with love in Kenya. Premium quality for ages 0-12 years.",
      url: SITE_URL,
      siteName: storeName,
      locale: "en_KE",
      images: [
        {
          url: `${SITE_URL}/logo-og.png`,
          width: 1200,
          height: 630,
          alt: `${storeName} — Premium Baby & Maternity Store`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${storeName} — Premium Baby Store`,
      description: "Handcrafted organic baby clothing & essentials made with love in Kenya.",
      images: [`${SITE_URL}/logo-og.png`],
    },
    alternates: { canonical: SITE_URL },
    category: "shopping",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FDF8F3" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1410" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}/#store`,
      name: "Malaika Nest",
      alternateName: "Tawakal Toto Shop",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      image: `${SITE_URL}/logo.png`,
      description: "Premium baby and maternity store. Handcrafted organic clothing, accessories & toys made with love in Kenya.",
      email: "hello@malaikanest.com",
      telephone: "+254726771321",
      priceRange: "KES",
      currenciesAccepted: "KES",
      paymentAccepted: "M-Pesa, Cash",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Tawakal Toto Shop",
        addressLocality: "Mombasa",
        addressRegion: "Mombasa County",
        addressCountry: "KE",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: -4.0856032,
        longitude: 39.661555,
      },
      hasMap: "https://maps.app.goo.gl/AHTa75obHAyjB3xZ8",
      openingHoursSpecification: [
        { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday"], opens: "09:00", closes: "18:00" },
        { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "09:00", closes: "16:00" },
        { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "00:00", closes: "00:00" },
      ],
      sameAs: [
        "https://web.facebook.com/profile.php?id=61592150003761",
        "https://www.instagram.com/malaikanest/",
        "https://www.tiktok.com/@malaikanest",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+254726771321",
        contactType: "customer service",
        areaServed: "KE",
        availableLanguage: ["en","sw"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Malaika Nest",
      description: "Premium baby and maternity store in Kenya — handcrafted organic clothing, accessories & toys.",
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/categories?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Store",
      "@id": `${SITE_URL}/#store`,
      name: "Malaika Nest",
      url: SITE_URL,
      telephone: "+254726771321",
      email: "hello@malaikanest.com",
      address: { "@type": "PostalAddress", addressLocality: "Mombasa", addressCountry: "KE" },
      paymentAccepted: "M-Pesa, Credit Card, Cash on Delivery",
      currenciesAccepted: "KES",
      openingHours: "Mo-Sa 09:00-18:00",
      priceRange: "KES 500 - 8000",
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="shortcut icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" type="image/png" href="/logo.png" />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}',{page_path:window.location.pathname});`,
              }}
            />
          </>
        )}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body
        className={`${cormorant.variable} ${dmSans.variable} antialiased`}
        style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
