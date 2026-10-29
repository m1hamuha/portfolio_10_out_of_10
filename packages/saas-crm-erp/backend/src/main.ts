import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, UnauthorizedException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import helmet from 'helmet';
import * as express from 'express';

function validateRequiredSecrets() {
  const requiredSecrets = [
    { name: 'JWT_SECRET', value: process.env.JWT_SECRET },
    { name: 'JWT_REFRESH_SECRET', value: process.env.JWT_REFRESH_SECRET },
  ];

  const missingSecrets = requiredSecrets
    .filter((secret) => !secret.value)
    .map((secret) => secret.name);

  if (missingSecrets.length > 0) {
    throw new UnauthorizedException(
      `Missing required environment variables: ${missingSecrets.join(', ')}. ` +
        'Please configure these before starting the application.',
    );
  }

  if (process.env.NODE_ENV === 'production') {
    const defaultCredentials = [
      {
        name: 'DB_PASSWORD',
        value: process.env.DB_PASSWORD,
        default: 'postgres',
      },
      {
        name: 'RABBITMQ_PASSWORD',
        value: process.env.RABBITMQ_PASSWORD,
        default: 'guest',
      },
      {
        name: 'REDIS_PASSWORD',
        value: process.env.REDIS_PASSWORD,
        default: '',
      },
    ];

    const weakCredentials = defaultCredentials.filter(
      (cred) => cred.value === cred.default,
    );

    if (weakCredentials.length > 0) {
      throw new UnauthorizedException(
        `Default credentials detected for: ${weakCredentials.map((c) => c.name).join(', ')}. ` +
          'Please configure secure credentials for production.',
      );
    }
  }
}

async function bootstrap() {
  validateRequiredSecrets();

  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Raw body parsing for Stripe webhooks
  app.use(
    '/api/v1/payments/webhook',
    express.raw({ type: 'application/json' }),
  );

  // Security middleware
  app.use(helmet());
  app.use(cookieParser());

  // CORS configuration
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Tenant-Id',
    ],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ?? 3001;

  // Swagger configuration
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Unified CRM/ERP SaaS Platform API')
      .setDescription(
        'Multi-tenant API with authentication, RBAC, and payment processing',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('auth', 'Authentication endpoints')
      .addTag('organizations', 'Organization management')
      .addTag('customers', 'Customer management')
      .addTag('users', 'User management')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(
      `Swagger documentation available at: http://localhost:${port}/api/docs`,
    );
  }

  // Drain DB/Redis connections and Bull workers cleanly on SIGTERM/SIGINT
  // (e.g. container/orchestrator rollouts) instead of dropping them.
  app.enableShutdownHooks();

  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}/api/v1`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}
void bootstrap();
