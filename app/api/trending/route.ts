import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, AppDataSource } from '@/lib/database/data-source';
import { TrendingSnapshot } from '@/lib/database/models/TrendingSnapshot';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '30');
    const language = searchParams.get('language') || undefined;

    const snapshotRepo = AppDataSource.getRepository(TrendingSnapshot);

    let query = snapshotRepo
      .createQueryBuilder('snapshot')
      .leftJoinAndSelect('snapshot.project', 'project')
      .orderBy('snapshot.date', 'DESC')
      .addOrderBy('snapshot.rank', 'ASC')
      .take(limit);

    if (language) {
      query = query.where('project.language = :language', { language });
    }

    const snapshots = await query.getMany();

    const results = snapshots.map((snapshot) => ({
      rank: snapshot.rank,
      project: {
        id: snapshot.project.id,
        name: snapshot.project.name,
        full_name: snapshot.project.full_name,
        description: snapshot.project.description,
        language: snapshot.project.language,
        stars: snapshot.project.stars,
        url: snapshot.project.url,
      },
      stars_at_snapshot: snapshot.stars_at_snapshot,
      date: snapshot.date,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching trending:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
