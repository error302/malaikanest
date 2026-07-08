import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/malaika/providers";
import { getSiteSettings } from "@/lib/settings";

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

// Fetch branding for metadata (store name, favicon, etc.)
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
    metadataBase: new URL("https://malaikanest.duckdns.org"),
    title: {
      default: `${storeName} — Premium Baby & Maternity Store in Kenya`,
      template: `%s · ${storeName}`,
    },
    description:
      "Handcrafted organic baby clothing, accessories & toys made with love in Kenya. Premium quality for little ones aged 0-12 years. Free delivery in Mombasa, M-Pesa accepted.",
    keywords: [
      "baby clothes Kenya", "newborn clothing", "organic baby clothes",
      "baby shop Mombasa", "maternity Kenya", "baby gifts", storeName,
      "children's clothing Kenya", "baby essentials", "M-Pesa baby shop",
    ],
    authors: [{ name: storeName }],
    creator: storeName,
    publisher: storeName,
    icons: {
      icon: favicon,
      apple: favicon,
    },
    openGraph: {
      title: `${storeName} — Premium Baby & Maternity Store in Kenya`,
      description: "Handcrafted organic baby clothing, accessories & toys made with love in Kenya. Premium quality for ages 0-12 years.",
      url: "https://malaikanest.duckdns.org",
      siteName: storeName,
      locale: "en_KE",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${storeName} — Premium Baby Store`,
      description: "Handcrafted organic baby clothing & essentials made with love in Kenya.",
    },
    alternates: { canonical: "https://malaikanest.duckdns.org" },
    category: "shopping",
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
  "@type": "Store",
  name: "Malaika Nest",
  description: "Premium baby and maternity store. Handcrafted organic clothing, accessories & toys made with love in Kenya.",
  url: "https://malaikanest.duckdns.org",
  telephone: "+254726771321",
  email: "malaikanest7@gmail.com",
  address: { "@type": "PostalAddress", addressLocality: "Mombasa", addressCountry: "KE" },
  paymentAccepted: "M-Pesa, Credit Card, Cash on Delivery",
  currenciesAccepted: "KES",
  openingHours: "Mo-Sa 09:00-18:00",
  priceRange: "KES 500 - 8000",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const branding = await getBranding();
  const favicon = branding?.favicon_url || "/logo.svg";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href={favicon} />
        <link rel="apple-touch-icon" href={favicon} />
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
