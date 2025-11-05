import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import path from 'path';
import { Project } from './models/Project';
import { TrendingSnapshot } from './models/TrendingSnapshot';
import { Summary } from './models/Summary';

dotenv.config();

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../gh_trending.db');

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: dbPath,
  synchronize: true, // Auto-create tables (for development)
  logging: process.env.NODE_ENV === 'development',
  entities: [Project, TrendingSnapshot, Summary],
  migrations: [],
  subscribers: [],
});

export async function initializeDatabase(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('Database connection established');
  }
  return AppDataSource;
}

export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('Database connection closed');
  }
}
