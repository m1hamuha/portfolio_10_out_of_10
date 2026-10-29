import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { Request, Response } from 'express';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: Partial<Response>;
  let mockRequest: Partial<Request>;
  let mockArgumentsHost: Partial<ArgumentsHost>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AllExceptionsFilter],
    }).compile();

    filter = module.get<AllExceptionsFilter>(AllExceptionsFilter);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = {
      url: '/test',
      method: 'GET',
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn(() => ({
        getResponse: jest.fn(() => mockResponse),
        getRequest: jest.fn(() => mockRequest),
      })),
    } as any;
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle HttpException correctly', () => {
    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Test error',
        error: 'HttpException',
        path: '/test',
        method: 'GET',
      }),
    );
  });

  it('should handle validation errors correctly', () => {
    const validationError = {
      message: [
        'email must be an email',
        'password must be longer than 6 characters',
      ],
      error: 'Bad Request',
      statusCode: 400,
    };

    const exception = new HttpException(
      validationError,
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        validationErrors: validationError.message,
      }),
    );
  });

  it('should handle generic Error correctly', () => {
    const exception = new Error('Generic error');

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Generic error',
        error: 'Error',
      }),
    );
  });

  it('should handle unknown exception correctly', () => {
    const exception = 'String error';

    filter.catch(exception as any, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        error: 'Internal Server Error',
      }),
    );
  });

  it('should include stack trace in development', () => {
    process.env.NODE_ENV = 'development';
    const exception = new Error('Test error');
    exception.stack = 'test stack trace';

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        stack: 'test stack trace',
      }),
    );

    // Clean up
    delete process.env.NODE_ENV;
  });

  it('should not include stack trace in production', () => {
    process.env.NODE_ENV = 'production';
    const exception = new Error('Test error');
    exception.stack = 'test stack trace';

    filter.catch(exception, mockArgumentsHost as ArgumentsHost);

    const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
    expect(responseCall.stack).toBeUndefined();

    // Clean up
    delete process.env.NODE_ENV;
  });
});
