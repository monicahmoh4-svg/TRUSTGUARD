// app/layout.tsx
import type { Metadata } from 'next';
import { DM_Sans, Space_Mono } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TrustGuard AI — Crypto Fraud Prevention',
  description: 'AI-powered real-time crypto fraud detection, smart contract risk analysis, and wallet behavioral analytics.',
  keywords: ['crypto security', 'fraud detection', 'smart contract', 'DeFi', 'blockchain security', 'rug pull detection'],
  openGraph: {
    title: 'TrustGuard AI',
    description: 'Real-time AI-powered crypto fraud prevention system',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
