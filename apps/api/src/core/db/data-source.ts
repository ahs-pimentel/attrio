import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Carregar variaveis de ambiente
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// DataSource para CLI do TypeORM (migrations)
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'attrio',
  password: process.env.DATABASE_PASSWORD || 'attrio_dev_123',
  database: process.env.DATABASE_NAME || 'attrio_db',
  entities: [__dirname + '/../../modules/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
});
