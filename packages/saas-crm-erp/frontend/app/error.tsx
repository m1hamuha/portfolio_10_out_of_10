'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Without this file, any unhandled runtime error renders Next's default
// unbranded "Application error" screen with no way to recover. This keeps
// users inside the product with a one-click retry and a route back home.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center dark:bg-gray-900">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
        Error
      </p>
      <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
        Something went wrong
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        An unexpected error occurred. Please try again.
      </p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
      <Link
        href="/"
        className="mt-4 text-sm text-gray-600 underline underline-offset-4 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
