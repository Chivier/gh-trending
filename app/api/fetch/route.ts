import { NextResponse } from 'next/server';
import { initializeDatabase, AppDataSource } from '@/lib/database/data-source';
import { Project } from '@/lib/database/models/Project';
import { TrendingSnapshot } from '@/lib/database/models/TrendingSnapshot';
import { TrendingScraper } from '@/lib/scraper/TrendingScraper';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await initializeDatabase();

    const projectRepo = AppDataSource.getRepository(Project);
    const snapshotRepo = AppDataSource.getRepository(TrendingSnapshot);

    const scraper = new TrendingScraper(projectRepo, snapshotRepo);
    const count = await scraper.fetchAndSave(undefined, 'daily');

    return NextResponse.json({
      message: `Fetched ${count} trending repositories`,
      count,
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending data' },
      { status: 500 }
    );
  }
}
