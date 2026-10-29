import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coach',
  description:
    'Chat with your AI coach for instant, actionable feedback on your code, algorithms, and engineering decisions.',
};

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
