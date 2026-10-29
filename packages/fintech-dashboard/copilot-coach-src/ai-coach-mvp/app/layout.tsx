import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const title = 'AI CopilotCoach';
const description =
  'AI-powered coaching for developers. Get instant, actionable feedback on your code, algorithms, and engineering decisions.';

export const metadata: Metadata = {
  title: {
    default: title,
    template: `%s | ${title}`,
  },
  description,
  applicationName: title,
  keywords: [
    'AI coach',
    'developer coaching',
    'code review',
    'pair programming',
    'AI assistant',
  ],
  openGraph: {
    title,
    description,
    siteName: title,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: '#0d1117',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}