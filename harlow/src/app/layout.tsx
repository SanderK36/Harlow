import type { Metadata, Viewport } from "next";
import { Cinzel, Crimson_Pro, Oswald } from "next/font/google";
import "./globals.css";

// Display face: Trajan-style inscriptional capitals, the classic horror
// poster look, for the HARLOW wordmark and window titles.
const displayFont = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

// Body face: a bookish serif with a generous reading rhythm for narration,
// inner thoughts, and dialogue.
const bodyFont = Crimson_Pro({
  variable: "--font-crimson",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

// UI face: a condensed grotesque for labels, stats, and controls, echoing
// 1980s VHS sleeves and paperback spines.
const uiFont = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Harlow",
  applicationName: "Harlow",
  description:
    "Harlow: 1982 — a moody small-town murder mystery. Play as Ethan Parker, explore an autumn town full of secrets, and find out what happened last night.",
  openGraph: {
    title: "Harlow: 1982",
    description:
      "A moody small-town murder mystery set in autumn 1982. Play as Ethan Parker and find out what happened last night.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#080405",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${uiFont.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
