import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Buna BeNet — Premium Ethiopian Dining',
  description: 'QR-powered digital menu and ordering system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <ServiceWorkerRegister />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#fff', color: '#1a1a1a', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)' },
            success: { iconTheme: { primary: '#f59e0b', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
