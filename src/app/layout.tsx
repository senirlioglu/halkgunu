// halkgunu-web/src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { PwaInit } from "@/components/PwaInit";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Halk Günü — İndirimli Ürünler",
  description:
    "Belirli mağazalarda belirli günlerde geçerli indirimli ürünler. halkgunu.net",
  manifest: "/manifest.json",
  applicationName: "Halk Günü",
  appleWebApp: {
    capable: true,
    title: "Halk Günü",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "Halk Günü",
    description: "Belirli günlerde, belirli mağazalarda, indirimli fiyatlar.",
    url: "https://halkgunu.net",
    siteName: "Halk Günü",
    locale: "tr_TR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#c1272d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`${inter.variable} ${bricolage.variable}`}>
      <body>
        {children}
        <PwaInit />
      </body>
    </html>
  );
}
