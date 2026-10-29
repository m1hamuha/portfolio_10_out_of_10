import { prisma } from '@/lib/prisma';
import { AppError, ERROR_CODES } from '@/lib/errors';

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100;

export async function rateLimitOrThrow(userId: string) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW);

  const requestCount = await prisma.requestLog.count({
    where: {
      userId,
      createdAt: {
        gte: windowStart
      }
    }
  });

  if (requestCount >= MAX_REQUESTS) {
    throw new AppError(
      'Rate limit exceeded. Please try again later.',
      ERROR_CODES.RATE_LIMITED,
      429
    );
  }

  await prisma.requestLog.create({
    data: {
      userId,
      createdAt: now
    }
  });
}

export async function rateLimitByIp(ip: string, endpoint: string) {
  const RATE_LIMIT_WINDOW_IP = 60 * 1000; // 1 minute
  const MAX_REQUESTS_IP = 30;

  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_IP);

  const requestCount = await prisma.requestLog.count({
    where: {
      ip,
      endpoint,
      createdAt: {
        gte: windowStart
      }
    }
  });

  if (requestCount >= MAX_REQUESTS_IP) {
    throw new AppError(
      'Too many requests from this IP. Please try again later.',
      ERROR_CODES.RATE_LIMITED,
      429
    );
  }
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  endpoint: string;
}

export async function rateLimitWithConfig(
  userId: string,
  config: RateLimitConfig
) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  const requestCount = await prisma.requestLog.count({
    where: {
      userId,
      endpoint: config.endpoint,
      createdAt: {
        gte: windowStart
      }
    }
  });

  if (requestCount >= config.maxRequests) {
    throw new AppError(
      'Rate limit exceeded. Please try again later.',
      ERROR_CODES.RATE_LIMITED,
      429
    );
  }

  await prisma.requestLog.create({
    data: {
      userId,
      endpoint: config.endpoint,
      createdAt: now
    }
  });
}

export const RATE_LIMITS = {
  chat: { windowMs: 15 * 60 * 1000, maxRequests: 100, endpoint: 'chat' },
  conversations: { windowMs: 60 * 1000, maxRequests: 30, endpoint: 'conversations' },
  feedback: { windowMs: 60 * 1000, maxRequests: 20, endpoint: 'feedback' },
  analytics: { windowMs: 60 * 1000, maxRequests: 10, endpoint: 'analytics' },
  health: { windowMs: 60 * 1000, maxRequests: 60, endpoint: 'health' },
} as const;