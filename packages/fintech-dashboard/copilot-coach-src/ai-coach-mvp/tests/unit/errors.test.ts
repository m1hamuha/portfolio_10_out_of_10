import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError, handleError, createErrorResponse, ERROR_CODES } from '@/lib/errors';

describe('Error Handling', () => {
  describe('AppError', () => {
    it('creates error with all properties', () => {
      const error = new AppError('Test message', 'TEST_CODE', 400, { field: 'test' });
      
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.context).toEqual({ field: 'test' });
      expect(error.isOperational).toBe(true);
    });

    it('uses default status code', () => {
      const error = new AppError('Test message', 'TEST_CODE');
      expect(error.statusCode).toBe(500);
    });

    it('extends Error class', () => {
      const error = new AppError('Test', 'CODE');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('ERROR_CODES', () => {
    it('has all expected error codes', () => {
      expect(ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN');
      expect(ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND');
      expect(ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ERROR_CODES.RATE_LIMITED).toBe('RATE_LIMITED');
      expect(ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(ERROR_CODES.EXTERNAL_SERVICE_ERROR).toBe('EXTERNAL_SERVICE_ERROR');
      expect(ERROR_CODES.QUOTA_EXCEEDED).toBe('QUOTA_EXCEEDED');
    });
  });

  describe('handleError', () => {
    it('handles AppError correctly', () => {
      const error = new AppError('Auth failed', 'UNAUTHORIZED', 401);
      const result = handleError(error);
      
      expect(result.code).toBe('UNAUTHORIZED');
      expect(result.message).toBe('Auth failed');
      expect(result.statusCode).toBe(401);
    });

    it('handles generic Error correctly', () => {
      const error = new Error('Something went wrong');
      const result = handleError(error);
      
      expect(result.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(result.statusCode).toBe(500);
    });

    it('handles unknown errors', () => {
      const result = handleError('unknown error');
      
      expect(result.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(result.statusCode).toBe(500);
    });

    it('redacts sensitive data in production', () => {
      vi.stubEnv('NODE_ENV', 'production');
      
      const error = new Error('API Key: sk-test123');
      const result = handleError(error);
      
      expect(result.message).not.toContain('sk-test123');
      vi.unstubAllEnvs();
    });

    it('shows error message in development', () => {
      vi.stubEnv('NODE_ENV', 'development');
      
      const error = new Error('Debug info');
      const result = handleError(error);
      
      expect(result.message).toBe('Debug info');
      vi.unstubAllEnvs();
    });
  });

  describe('createErrorResponse', () => {
    it('returns JSON response with correct structure', () => {
      const error = new AppError('Not found', 'NOT_FOUND', 404);
      const response = createErrorResponse(error);
      
      expect(response.status).toBe(404);
    });

    it('returns 500 for unknown errors', () => {
      const response = createErrorResponse('unknown');
      expect(response.status).toBe(500);
    });
  });
});
