import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isProduction = configService.get('NODE_ENV') === 'production';
  const databaseUrl = configService.get('DATABASE_URL');

  if (databaseUrl) {
    // Use DATABASE_URL (preferred for Railway/Supabase)
    return {
      type: 'postgres',
      url: databaseUrl,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      synchronize: !isProduction,
      migrationsRun: false,
      logging: isProduction ? ['error', 'warn'] : ['query', 'error'],
      ssl: databaseUrl.includes('supabase')
        ? { rejectUnauthorized: false }
        : false,
      extra: {
        connectionLimit: isProduction ? 20 : 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 15000,
      },
    };
  } else {
    // Fallback to individual parameters
    return {
      type: 'postgres',
      host: configService.get('DATABASE_HOST') || 'localhost',
      port: parseInt(configService.get('DATABASE_PORT') || '5432'),
      username: configService.get('DATABASE_USERNAME') || 'postgres',
      password: configService.get('DATABASE_PASSWORD'),
      database: configService.get('DATABASE_NAME') || 'datakit',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      synchronize: !isProduction,
      migrationsRun: false,
      logging: isProduction ? ['error', 'warn'] : ['query', 'error'],
      ssl:
        configService.get('DATABASE_SSL') === 'require'
          ? { rejectUnauthorized: false }
          : false,
      extra: {
        connectionLimit: isProduction ? 20 : 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 15000,
      },
    };
  }
};
