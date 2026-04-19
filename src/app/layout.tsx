import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

// Note: NextAuth SessionProvider will be integrated directly where needed, 
// or wrapped in a separate client component below.

const inter = Inter({ subsets: ['latin'] });

import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'InsureFlow | Insurance Agency CRM',
  description: 'Management System for Indian Insurance Agents.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'InsureFlow',
  },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
