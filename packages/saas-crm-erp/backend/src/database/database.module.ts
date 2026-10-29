import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<string>('DB_TYPE') || 'postgres';

        if (dbType === 'mock') {
          // Mock database for testing - no external dependencies
          return {
            type: 'sqlite',
            database: ':memory:',
            entities: [],
            synchronize: true,
            logging: false,
          };
        }

        if (dbType === 'sqlite') {
          return {
            type: 'sqlite',
            database: configService.get<string>('DB_DATABASE') || ':memory:',
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            synchronize: true,
            logging: configService.get<string>('app.nodeEnv') === 'development',
          };
        }

        return {
          type: 'postgres',
          host: configService.get<string>('database.host'),
          port: configService.get<number>('database.port'),
          username: configService.get<string>('database.username'),
          password: configService.get<string>('database.password'),
          database: configService.get<string>('database.database'),
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize:
            configService.get<string>('app.nodeEnv') === 'development',
          logging: configService.get<string>('app.nodeEnv') === 'development',
          poolSize: configService.get<number>('database.poolSize', 10),
          maxQueryExecutionTime: 10000,
          extra: {
            max: configService.get<number>('database.poolSize', 10),
            idleTimeoutMillis: configService.get<number>(
              'database.idleTimeout',
              30000,
            ),
            connectionTimeoutMillis: configService.get<number>(
              'database.connectionTimeout',
              10000,
            ),
            statement_timeout: 300000,
          },
          migrations: [__dirname + '/../migrations/*{.ts,.js}'],
          migrationsRun:
            configService.get<string>('app.nodeEnv') === 'production',
          migrationsTableName: 'migrations',
          retryAttempts: 3,
          retryDelay: 3000,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
