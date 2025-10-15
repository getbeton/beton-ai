import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { PosthogProvider } from '@/components/providers/PosthogProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Beton-AI - Automation Platform',
  description: 'Open source automation platform for seamless API integration and workflow management',
  keywords: ['automation', 'API', 'workflow', 'integration', 'productivity'],
  authors: [{ name: 'Beton-AI Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50`}>
        <PosthogProvider>
          <div className="min-h-full">
            {children}
          </div>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </PosthogProvider>
      </body>
    </html>
  );
}