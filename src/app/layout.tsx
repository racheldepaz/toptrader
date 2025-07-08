import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { AuthModalProvider } from '@/context/AuthModalContext';
import { AuthProvider } from '@/context/AuthContext';

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
  description: "Join the social trading revolution. Share your wins, learn from the best, and climb the leaderboards.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans min-h-screen flex flex-col`}>
        <AuthProvider>
          <AuthModalProvider>
            <Header />
            <main className="flex-grow">
              {children}
            </main>
          </AuthModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}