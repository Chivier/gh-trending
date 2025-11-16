import 'reflect-metadata';
import * as cron from 'node-cron';
import * as dotenv from 'dotenv';
import { initializeDatabase, AppDataSource } from '../lib/database/data-source';
import { Project } from '../lib/database/models/Project';
import { TrendingSnapshot } from '../lib/database/models/TrendingSnapshot';
import { TrendingScraper } from '../lib/scraper/TrendingScraper';

dotenv.config();

async function fetchTrendingData() {
  console.log('Starting scheduled trending fetch...');
  try {
    const projectRepo = AppDataSource.getRepository(Project);
    const snapshotRepo = AppDataSource.getRepository(TrendingSnapshot);

    const scraper = new TrendingScraper(projectRepo, snapshotRepo);
    const count = await scraper.fetchAndSave(undefined, 'daily');

    console.log(`✓ Successfully fetched ${count} trending repositories`);
  } catch (error) {
    console.error('Error fetching trending data:', error);
  }
}

async function main() {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('✓ Database initialized');

    // Schedule tasks
    // Fetch trending data every day at 9:00 AM UTC
    cron.schedule('0 9 * * *', fetchTrendingData, {
      scheduled: true,
      timezone: 'UTC',
    });
    console.log('✓ Scheduled daily trending fetch at 9:00 AM UTC');

    // Run once immediately on startup
    console.log('\nRunning initial data fetch...');
    await fetchTrendingData();

    console.log('\nScheduler is running. Press Ctrl+C to exit.');

    // Keep the process alive
    process.on('SIGINT', async () => {
      console.log('\nShutting down scheduler...');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\nShutting down scheduler...');
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start scheduler:', error);
    process.exit(1);
  }
}

main();
