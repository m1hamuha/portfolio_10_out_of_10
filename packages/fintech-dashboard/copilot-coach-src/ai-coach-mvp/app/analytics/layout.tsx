import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics',
  description:
    'Track your coaching usage, model breakdown, and recent activity across your AI CopilotCoach sessions.',
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
