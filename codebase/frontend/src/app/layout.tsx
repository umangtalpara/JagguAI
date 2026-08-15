import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const font = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'jagguAI - Enterprise SaaS AI Agent Platform',
  description: 'Instant customer support chatbots trained on your product docs and crawled website pages.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${font.className} bg-background text-foreground antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
