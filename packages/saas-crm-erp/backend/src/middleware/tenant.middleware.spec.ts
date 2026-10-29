import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { TenantMiddleware } from './tenant.middleware';

const JWT_SECRET = 'test-secret';
const ORG_ID = '123e4567-e89b-42d3-a456-426614174000';

describe('TenantMiddleware', () => {
  let middleware: TenantMiddleware;
  let dataSource: { query: jest.Mock };
  let config: Record<string, unknown>;

  const makeReq = (overrides: Partial<Request> = {}): Request =>
    ({
      headers: {},
      originalUrl: '/api/v1/customers',
      url: '/api/v1/customers',
      ...overrides,
    }) as unknown as Request;

  const res = {} as Response;
  let next: jest.Mock;

  beforeEach(() => {
    dataSource = { query: jest.fn().mockResolvedValue(undefined) };
    config = {
      'jwt.secret': JWT_SECRET,
      'app.nodeEnv': 'test',
      'app.enableTenantHeaderBypass': false,
    };
    const configService = {
      get: jest.fn((key: string) => config[key]),
    } as unknown as ConfigService;
    middleware = new TenantMiddleware(
      dataSource as unknown as DataSource,
      configService,
    );
    next = jest.fn();
  });

  it('sets tenant context from a validly signed token', async () => {
    const token = jwt.sign({ org_id: ORG_ID }, JWT_SECRET);
    const req = makeReq({
      headers: { authorization: `Bearer ${token}` },
    } as Partial<Request>);

    await middleware.use(req, res, next);

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('app.current_organization_id'),
      [ORG_ID],
    );
    expect((req as { organizationId?: string }).organizationId).toBe(ORG_ID);
    expect(next).toHaveBeenCalled();
  });

  it('rejects a token signed with the wrong secret (forged org_id)', async () => {
    const forged = jwt.sign({ org_id: ORG_ID }, 'attacker-secret');
    const req = makeReq({
      headers: { authorization: `Bearer ${forged}` },
    } as Partial<Request>);

    await expect(middleware.use(req, res, next)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(dataSource.query).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects requests without organization context', async () => {
    await expect(middleware.use(makeReq(), res, next)).rejects.toThrow(
      'Organization context required',
    );
  });

  it('rejects non-UUID org ids', async () => {
    const token = jwt.sign({ org_id: 'not-a-uuid' }, JWT_SECRET);
    const req = makeReq({
      headers: { authorization: `Bearer ${token}` },
    } as Partial<Request>);

    await expect(middleware.use(req, res, next)).rejects.toThrow(
      'Invalid organization ID format',
    );
  });

  it('allows header bypass outside production when enabled', async () => {
    config['app.enableTenantHeaderBypass'] = true;
    const req = makeReq({
      headers: { 'x-organization-id': ORG_ID },
    } as Partial<Request>);

    await middleware.use(req, res, next);

    expect((req as { organizationId?: string }).organizationId).toBe(ORG_ID);
    expect(next).toHaveBeenCalled();
  });

  it('ignores header bypass in production even when flag is enabled', async () => {
    config['app.enableTenantHeaderBypass'] = true;
    config['app.nodeEnv'] = 'production';
    const req = makeReq({
      headers: { 'x-organization-id': ORG_ID },
    } as Partial<Request>);

    await expect(middleware.use(req, res, next)).rejects.toThrow(
      'Organization context required',
    );
  });

  it.each([
    '/',
    '/health',
    '/api/v1/health',
    '/api/v1/health/ready',
    '/auth/login',
    '/api/v1/auth/login',
    '/api/v1/payments/webhook',
  ])('passes through public path %s without tenant context', async (path) => {
    const req = makeReq({ originalUrl: path, url: path } as Partial<Request>);

    await middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it('does not treat tenant routes as public', async () => {
    const req = makeReq({
      originalUrl: '/api/v1/customers',
      url: '/api/v1/customers',
    } as Partial<Request>);

    await expect(middleware.use(req, res, next)).rejects.toThrow(
      'Organization context required',
    );
  });
});
