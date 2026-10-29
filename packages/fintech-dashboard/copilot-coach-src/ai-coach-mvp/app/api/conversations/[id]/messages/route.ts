import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { createErrorResponse, AppError, ERROR_CODES } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse(
        new AppError('You must be logged in', ERROR_CODES.UNAUTHORIZED, 401)
      );
    }

    const { id } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: session.user.id, deletedAt: null },
    });

    if (!conversation) {
      return createErrorResponse(
        new AppError('Conversation not found', ERROR_CODES.NOT_FOUND, 404)
      );
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        model: true,
        tokens: true,
        cost: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        goal: conversation.goal,
        context: conversation.context,
        model: conversation.model,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
      messages,
    });
  } catch (error) {
    logger.error('Get messages error', { error }, error as Error);
    return createErrorResponse(error);
  }
}
