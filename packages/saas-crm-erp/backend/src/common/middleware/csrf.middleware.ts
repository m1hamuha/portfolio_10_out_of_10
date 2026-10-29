import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly CSRF_TOKEN_HEADER = 'X-CSRF-Token';
  private readonly CSRF_TOKEN_COOKIE = 'csrf_token';
  private readonly CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF for GET, HEAD, OPTIONS requests and API endpoints
    if (this.shouldSkipCsrf(req)) {
      return next();
    }

    // Generate CSRF token if not present
    if (!req.cookies?.[this.CSRF_TOKEN_COOKIE]) {
      this.generateCsrfToken(res);
    }

    // Validate CSRF token for state-changing requests
    if (this.isStateChangingMethod(req.method)) {
      const tokenFromHeader = req.headers[
        this.CSRF_TOKEN_HEADER.toLowerCase()
      ] as string;
      const tokenFromCookie = req.cookies?.[this.CSRF_TOKEN_COOKIE];

      if (
        !tokenFromHeader ||
        !tokenFromCookie ||
        tokenFromHeader !== tokenFromCookie
      ) {
        res.status(403).json({
          statusCode: 403,
          message: 'Invalid CSRF token',
          error: 'Forbidden',
        });
        return;
      }
    }

    next();
  }

  private shouldSkipCsrf(req: Request): boolean {
    const { method, path } = req;

    // Skip for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    // Skip for API endpoints that use token-based auth
    if (path.startsWith('/api/') && req.headers.authorization) {
      return true;
    }

    // Skip for webhook endpoints
    if (path.includes('/webhook/')) {
      return true;
    }

    return false;
  }

  private isStateChangingMethod(method: string): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  }

  private generateCsrfToken(res: Response): void {
    const token = crypto.randomBytes(32).toString('hex');

    res.cookie(this.CSRF_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: this.CSRF_TOKEN_EXPIRY,
      path: '/',
    });
  }

  /**
   * Generate CSRF token for response (for forms)
   */
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate CSRF token
   */
  static validateToken(
    tokenFromHeader: string,
    tokenFromCookie: string,
  ): boolean {
    return tokenFromHeader === tokenFromCookie;
  }
}
