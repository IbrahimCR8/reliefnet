import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DisclaimerBanner } from '@/components/layout/DisclaimerBanner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ReliefNet — Disaster Response Intelligence Platform',
  description:
    'ReliefNet is a community-driven disaster response coordination platform for reporting incidents, coordinating volunteers, and tracking relief efforts during floods, cyclones, and other emergencies.',
  keywords: ['disaster relief', 'emergency response', 'volunteer coordination', 'flood relief', 'crisis management'],
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen flex flex-col`}>
        <DisclaimerBanner />
        <Suspense fallback={<div className="h-16 bg-slate-950 border-b border-slate-800" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1">
          <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center text-slate-400">Loading...</div>}>
            {children}
          </Suspense>
        </main>
        <Footer />
      </body>
    </html>
  );
}
