import { NextRequest, NextResponse } from 'next/server';
import { Feed } from 'feed';
import { initializeDatabase, AppDataSource } from '@/lib/database/data-source';
import { TrendingSnapshot } from '@/lib/database/models/TrendingSnapshot';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ language: string }> }
) {
  try {
    await initializeDatabase();

    const { language } = await params;
    const snapshotRepo = AppDataSource.getRepository(TrendingSnapshot);

    const snapshots = await snapshotRepo
      .createQueryBuilder('snapshot')
      .leftJoinAndSelect('snapshot.project', 'project')
      .where('LOWER(project.language) = LOWER(:language)', { language })
      .orderBy('snapshot.date', 'DESC')
      .addOrderBy('snapshot.rank', 'ASC')
      .take(30)
      .getMany();

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    const feed = new Feed({
      title: `GitHub Trending ${language} Repositories`,
      description: `Daily trending ${language} repositories on GitHub`,
      id: `${baseUrl}/api/feed/${language}`,
      link: baseUrl,
      language: 'en',
      favicon: `${baseUrl}/favicon.ico`,
      copyright: 'All rights reserved',
      updated: snapshots.length > 0 ? snapshots[0].date : new Date(),
      generator: 'GitHub Trending RSS',
      feedLinks: {
        rss: `${baseUrl}/api/feed/${language}`,
      },
    });

    snapshots.forEach((snapshot) => {
      feed.addItem({
        title: `#${snapshot.rank} ${snapshot.project.full_name}`,
        id: snapshot.project.url,
        link: snapshot.project.url,
        description: snapshot.project.description || 'No description available',
        content: `
          <h3>${snapshot.project.full_name}</h3>
          <p>${snapshot.project.description || 'No description available'}</p>
          <ul>
            <li><strong>Language:</strong> ${snapshot.project.language || 'N/A'}</li>
            <li><strong>Stars:</strong> ${snapshot.project.stars}</li>
            <li><strong>Rank:</strong> #${snapshot.rank}</li>
          </ul>
        `,
        date: snapshot.date,
      });
    });

    return new NextResponse(feed.rss2(), {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
