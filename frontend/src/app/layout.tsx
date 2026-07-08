import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/malaika/providers";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://malaikanest.duckdns.org"),
  title: {
    default: "Malaika Nest — Premium Baby & Maternity Store in Kenya",
    template: "%s · Malaika Nest",
  },
  description:
    "Handcrafted organic baby clothing, accessories & toys made with love in Kenya. Premium quality for little ones aged 0-12 years. Free delivery in Mombasa, M-Pesa accepted.",
  keywords: [
    "baby clothes Kenya",
    "newborn clothing",
    "organic baby clothes",
    "baby shop Mombasa",
    "maternity Kenya",
    "baby gifts",
    "Malaika Nest",
    "children's clothing Kenya",
    "baby essentials",
    "M-Pesa baby shop",
  ],
  authors: [{ name: "Malaika Nest" }],
  creator: "Malaika Nest",
  publisher: "Malaika Nest",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "Malaika Nest — Premium Baby & Maternity Store in Kenya",
    description:
      "Handcrafted organic baby clothing, accessories & toys made with love in Kenya. Premium quality for ages 0-12 years.",
    url: "https://malaikanest.duckdns.org",
    siteName: "Malaika Nest",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Malaika Nest — Premium Baby Store",
    description:
      "Handcrafted organic baby clothing & essentials made with love in Kenya.",
  },
  alternates: {
    canonical: "https://malaikanest.duckdns.org",
  },
  category: "shopping",
};

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
  description:
    "Premium baby and maternity store. Handcrafted organic clothing, accessories & toys made with love in Kenya.",
  url: "https://malaikanest.duckdns.org",
  telephone: "+254726771321",
  email: "malaikanest7@gmail.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Mombasa",
    addressCountry: "KE",
  },
  paymentAccepted: "M-Pesa, Credit Card, Cash on Delivery",
  currenciesAccepted: "KES",
  openingHours: "Mo-Sa 09:00-18:00",
  priceRange: "KES 500 - 8000",
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${cormorant.variable} ${dmSans.variable} antialiased`}
        style={{
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
