import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Newsreader, Source_Serif_4, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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
  title: "Academic Journal",
  description: "A scholarly journal of original peer-reviewed research.",
};

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  const fontClasses = `${newsreader.variable} ${sourceSerif.variable} ${interTight.variable} ${jetbrainsMono.variable}`;
  return (
    <html lang="en" className={fontClasses}>
      <body>{children}</body>
    </html>
  );
}
