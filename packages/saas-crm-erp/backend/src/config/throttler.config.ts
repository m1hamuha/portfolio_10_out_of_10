import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const throttlerConfig: ThrottlerModuleOptions = {
  throttlers: [
    {
      ttl: 60000, // 1 minute in milliseconds
      limit: 100, // maximum number of requests per ttl
    },
    {
      ttl: 3600000, // 1 hour in milliseconds
      limit: 1000, // maximum number of requests per hour
    },
  ],
  errorMessage: 'Too many requests, please try again later.',
  skipIf: (context) => {
    // Skip rate limiting for health checks and certain paths
    const request = context.switchToHttp().getRequest();
    const path = request.url;

    return (
      path.includes('/health') ||
      path.includes('/api/docs') ||
      path.includes('/favicon.ico')
    );
  },
};
