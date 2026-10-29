import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

/**
 * Routes that must work without a tenant context:
 * - root / health checks (uptime probes)
 * - auth (login/refresh happen before an org-scoped token exists)
 * - Stripe webhook (authenticated via Stripe signature, not JWT)
 * Patterns cover both with and without the `api/v1` global prefix so the
 * middleware behaves the same in production and in test apps.
 */
const PUBLIC_PATH_PATTERNS: RegExp[] = [
  /^\/$/,
  /^\/(api\/v1\/)?health(\/|$)/,
  /^\/(api\/v1\/)?auth(\/|$)/,
  /^\/(api\/v1\/)?payments\/webhook(\/|$)/,
];

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const path = (req.originalUrl || req.url || '').split('?')[0];
    if (PUBLIC_PATH_PATTERNS.some((pattern) => pattern.test(path))) {
      return next();
    }

    try {
      let organizationId: string | null = null;

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const secret = this.configService.get<string>('jwt.secret');
        if (!secret) {
          this.logger.error(
            'JWT secret is not configured; cannot establish tenant context',
          );
          throw new UnauthorizedException('Invalid tenant context');
        }
        try {
          // SECURITY: verify the signature. A merely decoded (unverified)
          // token would let anyone forge an org_id and switch tenants.
          const decoded = jwt.verify(token, secret);
          if (
            decoded &&
            typeof decoded === 'object' &&
            typeof decoded.org_id === 'string'
          ) {
            organizationId = decoded.org_id;
          }
        } catch {
          this.logger.warn('JWT verification failed for tenant context');
          throw new UnauthorizedException('Invalid token');
        }
      }

      const isProduction =
        this.configService.get<string>('app.nodeEnv') === 'production';
      const enableHeaderBypass =
        !isProduction &&
        this.configService.get<boolean>('app.enableTenantHeaderBypass');

      if (!organizationId && enableHeaderBypass) {
        const orgHeader =
          req.headers['x-organization-id'] || req.headers['x-tenant-id'];
        if (orgHeader) {
          const orgHeaderStr = Array.isArray(orgHeader)
            ? orgHeader[0]
            : orgHeader;
          organizationId = orgHeaderStr;
          this.logger.warn(
            `Tenant header bypass used: ${orgHeaderStr}. This is disabled automatically in production.`,
          );
        }
      }

      if (!organizationId) {
        throw new UnauthorizedException('Organization context required');
      }

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(organizationId)) {
        throw new UnauthorizedException('Invalid organization ID format');
      }

      // NOTE: Postgres `SET` does not support bind parameters, so we use
      // set_config() which does (third arg `false` = session scope, like SET).
      await this.dataSource.query(
        `SELECT set_config('app.current_organization_id', $1, false)`,
        [organizationId],
      );

      (req as { organizationId?: string }).organizationId = organizationId;

      next();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid tenant context');
    }
  }
}
