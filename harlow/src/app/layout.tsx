import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";

// Latin subsets only. Each family is a variable font, so one file covers the
// weights the UI actually uses. They are committed under src/app/fonts so the
// build never asks fonts.googleapis.com (Turbopack rejects next/font/google
// when a family is requested at more than one weight).
const displayFont = localFont({
  src: "./fonts/cinzel-latin.woff2",
  variable: "--font-cinzel",
  weight: "500 700",
  display: "swap",
});

const bodyFont = localFont({
  src: [
    {
      path: "./fonts/crimson-roman-latin.woff2",
      weight: "400 600",
      style: "normal",
    },
    {
      path: "./fonts/crimson-italic-latin.woff2",
      weight: "400 600",
      style: "italic",
    },
  ],
  variable: "--font-crimson",
  display: "swap",
});

const uiFont = localFont({
  src: "./fonts/oswald-latin.woff2",
  variable: "--font-oswald",
  weight: "300 700",
  display: "swap",
});

// Typewriter face for the stats index card. Static regular only.
const typewriterFont = localFont({
  src: "./fonts/specialelite-latin.woff2",
  variable: "--font-special-elite",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Harlow",
  applicationName: "Harlow",
  description:
    "Harlow: 1982 — a moody small-town murder mystery. Play as Ethan Parker, explore an autumn town full of secrets, and find out what really happened to his sister ten years ago.",
  openGraph: {
    title: "Harlow: 1982",
    description:
      "A moody small-town murder mystery set in autumn 1982. Play as Ethan Parker and find out what really happened to his sister ten years ago.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#080405",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${uiFont.variable} ${typewriterFont.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
