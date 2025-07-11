import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

// Migration-specific data source with explicit entity imports
// This ensures TypeORM can auto-generate migrations from entity changes
export const MigrationDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || undefined,
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'datakit',
  entities: [__dirname + '/**/*.entity{.ts,.js}', 'src/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: ['query', 'error'],
  ssl: (process.env.DATABASE_URL || '').includes('supabase')
    ? { rejectUnauthorized: false }
    : false,
});
