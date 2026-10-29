import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AI CopilotCoach',
    short_name: 'CopilotCoach',
    description:
      'AI-powered coaching for developers. Get instant, actionable feedback on your code, algorithms, and engineering decisions.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d1117',
    theme_color: '#0d1117',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
