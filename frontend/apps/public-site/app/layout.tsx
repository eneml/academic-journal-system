import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Newsreader, Source_Serif_4, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { resolveLocale } from "@/lib/locale";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "http://localhost:3000";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-newsreader",
});
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-source-serif",
});
const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter-tight",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "The Academic Journal",
  description: "A scholarly journal of original peer-reviewed research.",
  metadataBase: new URL(SITE_URL),
  alternates: {
    languages: {
      en: "/",
      ro: "/?lang=ro",
      "x-default": "/",
    },
  },
};

export default async function RootLayout({ children }: { children: ReactNode }): Promise<ReactNode> {
  const fontClasses = `${newsreader.variable} ${sourceSerif.variable} ${interTight.variable} ${jetbrainsMono.variable}`;
  const locale = await resolveLocale();
  return (
    <html lang={locale} className={fontClasses}>
      <body>{children}</body>
    </html>
  );
}
