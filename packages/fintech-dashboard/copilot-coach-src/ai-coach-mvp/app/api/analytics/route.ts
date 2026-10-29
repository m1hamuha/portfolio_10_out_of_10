import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { createErrorResponse, AppError, ERROR_CODES } from '@/lib/errors';
import { rateLimitWithConfig, RATE_LIMITS } from '@/lib/security';
import { openRouterModels, type ModelId } from '@/lib/openrouter';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse(
        new AppError('You must be logged in', ERROR_CODES.UNAUTHORIZED, 401)
      );
    }

    await rateLimitWithConfig(session.user.id, RATE_LIMITS.analytics);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalMessages,
      messagesByModel,
      feedbackStats,
      recentActivity,
    ] = await Promise.all([
      prisma.message.count({
        where: { userId: session.user.id },
      }),
      prisma.message.groupBy({
        by: ['model'],
        where: { userId: session.user.id },
        _count: true,
        _sum: {
          tokens: true,
          cost: true,
        },
      }),
      prisma.feedback.aggregate({
        where: { userId: session.user.id },
        _avg: { rating: true },
        _count: true,
      }),
      prisma.message.findMany({
        where: {
          userId: session.user.id,
          createdAt: { gte: thirtyDaysAgo },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          role: true,
          content: true,
          model: true,
          tokens: true,
          cost: true,
          createdAt: true,
        },
      }),
    ]);

    const modelBreakdown = messagesByModel.map((item) => ({
      model: item.model as ModelId,
      modelName: openRouterModels[item.model as ModelId]?.name || item.model,
      count: item._count,
      tokens: item._sum.tokens ?? 0,
      cost: item._sum.cost ?? 0,
    }));

    const totalCost = modelBreakdown.reduce((sum: number, m) => sum + m.cost, 0);
    const totalTokens = modelBreakdown.reduce((sum: number, m) => sum + m.tokens, 0);

    return NextResponse.json({
      summary: {
        totalMessages,
        totalCost,
        totalTokens,
        averageRating: feedbackStats._avg.rating ?? null,
        totalFeedbackCount: feedbackStats._count,
      },
      modelBreakdown,
      recentActivity: recentActivity.map((msg) => ({
        id: msg.id,
        role: msg.role,
        preview: msg.content.substring(0, 100),
        model: msg.model,
        tokens: msg.tokens,
        cost: msg.cost,
        createdAt: msg.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    logger.error('Analytics error', { error }, error as Error);
    return createErrorResponse(error);
  }
}
