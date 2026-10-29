import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { createErrorResponse, AppError, ERROR_CODES } from '@/lib/errors';
import { rateLimitWithConfig, RATE_LIMITS } from '@/lib/security';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createConversationSchema = z.object({
  title: z.string().min(1).max(200),
  goal: z.string().optional(),
  context: z.string().optional(),
});

const updateConversationSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200).optional(),
  goal: z.string().optional(),
  context: z.string().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse(
        new AppError('You must be logged in', ERROR_CODES.UNAUTHORIZED, 401)
      );
    }

    await rateLimitWithConfig(session.user.id, RATE_LIMITS.conversations);

    const conversations = await prisma.conversation.findMany({
      where: { userId: session.user.id, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        goal: true,
        model: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    logger.error('Get conversations error', { error }, error as Error);
    return createErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse(
        new AppError('You must be logged in', ERROR_CODES.UNAUTHORIZED, 401)
      );
    }

    await rateLimitWithConfig(session.user.id, RATE_LIMITS.conversations);

    const body = await req.json();
    const validated = createConversationSchema.parse(body);

    const conversation = await prisma.conversation.create({
      data: {
        userId: session.user.id,
        title: validated.title,
        goal: validated.goal,
        context: validated.context,
        model: 'gpt-4o-mini',
      },
    });

    logger.info('Conversation created', {
      conversationId: conversation.id,
      userId: session.user.id,
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        new AppError(error.errors[0].message, ERROR_CODES.VALIDATION_ERROR, 400)
      );
    }
    logger.error('Create conversation error', { error }, error as Error);
    return createErrorResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse(
        new AppError('You must be logged in', ERROR_CODES.UNAUTHORIZED, 401)
      );
    }

    await rateLimitWithConfig(session.user.id, RATE_LIMITS.conversations);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return createErrorResponse(
        new AppError('Conversation ID is required', ERROR_CODES.VALIDATION_ERROR, 400)
      );
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: session.user.id, deletedAt: null },
    });

    if (!conversation) {
      return createErrorResponse(
        new AppError('Conversation not found', ERROR_CODES.NOT_FOUND, 404)
      );
    }

    await prisma.conversation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    logger.info('Conversation soft deleted', { conversationId: id, userId: session.user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Delete conversation error', { error }, error as Error);
    return createErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse(
        new AppError('You must be logged in', ERROR_CODES.UNAUTHORIZED, 401)
      );
    }

    await rateLimitWithConfig(session.user.id, RATE_LIMITS.conversations);

    const body = await req.json();
    const validated = updateConversationSchema.parse(body);

    const existingConversation = await prisma.conversation.findFirst({
      where: { id: validated.id, userId: session.user.id, deletedAt: null },
    });

    if (!existingConversation) {
      return createErrorResponse(
        new AppError('Conversation not found', ERROR_CODES.NOT_FOUND, 404)
      );
    }

    const conversation = await prisma.conversation.update({
      where: { id: validated.id },
      data: {
        ...(validated.title !== undefined && { title: validated.title }),
        ...(validated.goal !== undefined && { goal: validated.goal }),
        ...(validated.context !== undefined && { context: validated.context }),
        updatedAt: new Date(),
      },
    });

    logger.info('Conversation updated', {
      conversationId: conversation.id,
      userId: session.user.id,
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        new AppError(error.errors[0].message, ERROR_CODES.VALIDATION_ERROR, 400)
      );
    }
    logger.error('Update conversation error', { error }, error as Error);
    return createErrorResponse(error);
  }
}
