import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Without this file, a mistyped URL or stale bookmark lands on Next's default
// 404 — an unbranded dead end with no way back into the product. This keeps
// lost visitors inside the app with one click home.
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center dark:bg-gray-900">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">404</p>
      <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
        Page not found
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        The page you are looking for does not exist or has been moved.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back to dashboard</Link>
      </Button>
    </div>
  );
}
