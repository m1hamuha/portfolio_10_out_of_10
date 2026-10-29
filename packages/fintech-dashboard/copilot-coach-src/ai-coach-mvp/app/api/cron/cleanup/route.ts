import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    logger.warn('CRON_SECRET not configured');
    return NextResponse.json({ error: 'Cron not configured' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${expectedSecret}`) {
    logger.warn('Unauthorized cron request', { ip: req.headers.get('x-forwarded-for') });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const requestLogsResult = await prisma.requestLog.deleteMany({
      where: { createdAt: { lt: thirtyDaysAgo } },
    });

    logger.info('Cleanup completed', {
      deletedRequestLogs: requestLogsResult.count,
    });

    return NextResponse.json({
      success: true,
      deleted: {
        requestLogs: requestLogsResult.count,
      },
    });
  } catch (error) {
    logger.error('Cleanup failed', { error }, error as Error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
