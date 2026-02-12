import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MediaSidebar from "@/components/MediaSidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.ecomoving.cl'),
  title: {
    default: "Ecomoving",
    template: "%s | Ecomoving - Merchandising Corporativo de Alto Nivel"
  },
  description: "Elevamos tu marca con merchandising de alta calidad. Catálogo premium y soluciones masivas con personalización avanzada. Calidad garantizada.",
  keywords: [
    "merchandising corporativo", "regalos de empresa personalizados", "artículos publicitarios premium",
    "proveedores de merchandising para empresas", "regalos corporativos de alta gama",
    "catálogo de productos personalizados para eventos", "merchandising para empresas",
    "regalos corporativos chile", "artículos publicitarios santiago"
  ],
  authors: [{ name: "Ecomoving Studio" }],
  creator: "Ecomoving SpA",
  publisher: "Ecomoving SpA",
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: "Ecomoving | Redefiniendo los Regalos Corporativos Premium",
    description: "Fusionamos artesanía digital e IA para crear artículos publicitarios que cuentan historias. Exclusividad y elegancia en cada detalle.",
    url: 'https://www.ecomoving.cl',
    siteName: 'Ecomoving',
    locale: 'es_CL',
    type: 'website',
    images: [
      {
        url: '/hero-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Ecomoving Colección Premium',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Ecomoving | Regalos Corporativos de Vanguardia",
    description: "Diseño, calidad y sustentabilidad en merchandising para empresas.",
    images: ['/hero-image.jpg'],
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
  alternates: {
    canonical: 'https://www.ecomoving.cl',
  },
};

import JsonLd from "../components/JsonLd";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <JsonLd />
        <MediaSidebar />
        {children}
      </body>
    </html>
  );
}
