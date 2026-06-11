import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TrustGuard AI — Crypto Fraud Prevention',
  description: 'AI-powered real-time crypto fraud detection, smart contract risk analysis, and wallet behavioral analytics.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
