// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import Providers from './providers';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GymPro - Gym Management System',
  description: 'Professional gym management system for tracking memberships and payments',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <html lang="sr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#10b981" />
        <meta name="description" content="Sistem za upravljanje članovima teretane" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* iOS specific */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Gym Pro" />
      </head>

      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {/* Only show Header for ADMIN users */}
          {isAdmin && <Header />}

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Providers>
              {children}
            </Providers>
          </main>
        </div>
      </body>
    </html>
  );
}


//kopija stanice members/[id] za usere
//izbaciti im dugmice za placanje tu
//dodati sve u admina
// "/" ovu stranicu smisliti sta sa njom