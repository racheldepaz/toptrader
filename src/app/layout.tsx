import type React from "react"
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TopTrader - Social Trading Platform",
  description: "Track your trades like athletes track their workouts. Join the social trading revolution.",
  keywords: ["trading", "social trading", "stocks", "crypto", "leaderboard"],
  authors: [{ name: "TopTrader" }],
  openGraph: {
    title: "TopTrader - Social Trading Platform",
    description: "Track your trades like athletes track their workouts. Join the social trading revolution.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans min-h-screen flex flex-col`}>
        <Providers>
          <main className="flex-grow">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
