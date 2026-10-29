import { type UIMessage } from 'ai';
import { openRouterModels, type ModelId, getOpenRouterHeaders } from '@/lib/openrouter';
import { buildSystemPrompt } from '@/lib/prompt';
import { sanitizeForPrompt } from '@/lib/sanitize';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { rateLimitOrThrow } from '@/lib/security';
import { logger } from '@/lib/logger';
import { createErrorResponse, AppError, ERROR_CODES } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse(
        new AppError(
          'You must be logged in to use the chat',
          ERROR_CODES.UNAUTHORIZED,
          401
        )
      );
    }

    await rateLimitOrThrow(session.user.id);

    const body = await req.json() as {
      messages: UIMessage[];
      goal?: string;
      context?: string;
      model?: ModelId;
      stream?: boolean;
    };

    const modelId = (body.model && body.model in openRouterModels)
      ? body.model as ModelId
      : 'gpt-4o-mini';
    const modelInfo = openRouterModels[modelId];

    const system = buildSystemPrompt({
      userGoal: sanitizeForPrompt(body.goal ?? 'Help improve the solution'),
      context: sanitizeForPrompt(body.context ?? '')
    });

    const messagesForModel: Array<{ role: string; content: string }> = [
      { role: 'system', content: system },
      ...(body.messages ?? [])
    ];

    // Check if streaming is requested
    if (body.stream) {
      // Create streaming response
      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          ...getOpenRouterHeaders(),
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          model: modelInfo.id,
          messages: messagesForModel,
          temperature: 0.3,
          stream: true,
        }),
      });

      if (!openRouterResponse.ok) {
        const errorText = await openRouterResponse.text();
        logger.error('OpenRouter API streaming error', {
          status: openRouterResponse.status,
          body: errorText,
          model: modelId,
        });
        throw new AppError(
          `OpenRouter API error: ${openRouterResponse.status}`,
          ERROR_CODES.EXTERNAL_SERVICE_ERROR,
          openRouterResponse.status
        );
      }

      if (!openRouterResponse.body) {
        throw new AppError(
          'No response body from OpenRouter',
          ERROR_CODES.EXTERNAL_SERVICE_ERROR,
          500
        );
      }

      // Transform OpenRouter SSE stream to standard format
      const stream = openRouterResponse.body;
      const reader = stream.getReader();
      const encoder = new TextEncoder();
      let fullContent = '';

      const transformedStream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') {
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    continue;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content || '';
                    if (content) {
                      fullContent += content;
                      // Forward in OpenAI-compatible format
                      const forwardData = {
                        id: parsed.id,
                        object: 'chat.completion.chunk',
                        created: parsed.created,
                        model: parsed.model,
                        choices: [{
                          index: 0,
                          delta: { content },
                          finish_reason: null,
                        }],
                      };
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify(forwardData)}\n\n`));
                    }
                  } catch {
                    // Skip invalid JSON
                  }
                }
              }
            }

            // Save the complete message after streaming
            await prisma.message.create({
              data: {
                userId: session.user.id,
                role: 'assistant',
                content: fullContent,
                model: modelId,
              },
            });

            await prisma.auditLog.create({
              data: {
                userId: session.user.id,
                action: 'CHAT_COMPLETED',
                metadata: {
                  model: modelId,
                  streamed: true,
                },
              },
            });

            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(transformedStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming (backward compatible)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        ...getOpenRouterHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelInfo.id,
        messages: messagesForModel,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('OpenRouter API error', {
        status: response.status,
        body: errorText,
        model: modelId,
      });
      throw new AppError(
        `OpenRouter API error: ${response.status}`,
        ERROR_CODES.EXTERNAL_SERVICE_ERROR,
        response.status
      );
    }

    const completion = await response.json();

    const totalTokens = completion.usage?.total_tokens ?? 0;

    await prisma.message.create({
      data: {
        userId: session.user.id,
        role: 'assistant',
        content: completion.choices?.[0]?.message?.content ?? '',
        model: modelId,
        tokens: totalTokens,
        cost: totalTokens > 0 ? completion.cost ?? 0 : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CHAT_COMPLETED',
        metadata: {
          model: modelId,
          tokens: totalTokens,
          cost: completion.cost,
        },
      },
    });

    return new Response(JSON.stringify(completion), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Chat error', { error }, error as Error);
    return createErrorResponse(error);
  }
}
