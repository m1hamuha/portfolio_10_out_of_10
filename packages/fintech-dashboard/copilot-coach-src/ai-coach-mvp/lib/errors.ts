export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    context?: Record<string, any>
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
} as const;

export function handleError(error: unknown): { code: string; message: string; statusCode: number } {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: process.env.NODE_ENV === "production"
        ? "An internal error occurred"
        : error.message,
      statusCode: 500,
    };
  }

  return {
    code: ERROR_CODES.INTERNAL_ERROR,
    message: "An unknown error occurred",
    statusCode: 500,
  };
}

export function createErrorResponse(error: unknown) {
  const { code, message, statusCode } = handleError(error);
  return new Response(
    JSON.stringify({
      error: {
        code,
        message,
      },
    }),
    {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
