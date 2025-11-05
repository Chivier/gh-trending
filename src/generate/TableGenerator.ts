import { Repository } from 'typeorm';
import { Project } from '../database/models/Project';
import { TrendingSnapshot } from '../database/models/TrendingSnapshot';

export interface TrendingData {
  rank: number;
  project: Project;
  stars_at_snapshot: number;
  date: Date;
}

export class TableGenerator {
  private projectRepo: Repository<Project>;
  private snapshotRepo: Repository<TrendingSnapshot>;

  constructor(
    projectRepo: Repository<Project>,
    snapshotRepo: Repository<TrendingSnapshot>
  ) {
    this.projectRepo = projectRepo;
    this.snapshotRepo = snapshotRepo;
  }

  async getTrendingData(limit: number = 30): Promise<TrendingData[]> {
    const snapshots = await this.snapshotRepo
      .createQueryBuilder('snapshot')
      .leftJoinAndSelect('snapshot.project', 'project')
      .orderBy('snapshot.date', 'DESC')
      .addOrderBy('snapshot.rank', 'ASC')
      .take(limit)
      .getMany();

    return snapshots.map((snapshot) => ({
      rank: snapshot.rank || 0,
      project: snapshot.project,
      stars_at_snapshot: snapshot.stars_at_snapshot,
      date: snapshot.date,
    }));
  }

  generateHtmlTable(trendingData: TrendingData[]): string {
    const rows = trendingData
      .map(
        (data) => `
      <tr>
        <td>${data.rank}</td>
        <td><a href="${data.project.url}" target="_blank">${data.project.full_name}</a></td>
        <td>${data.project.description || 'N/A'}</td>
        <td>${data.project.language || 'N/A'}</td>
        <td>${data.stars_at_snapshot.toLocaleString()}</td>
      </tr>
    `
      )
      .join('');

    return `
    <table class="trending-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Repository</th>
          <th>Description</th>
          <th>Language</th>
          <th>Stars</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    `;
  }

  generateMarkdownTable(trendingData: TrendingData[]): string {
    const header = '| Rank | Repository | Description | Language | Stars |';
    const separator = '|------|------------|-------------|----------|-------|';

    const rows = trendingData
      .map(
        (data) =>
          `| ${data.rank} | [${data.project.full_name}](${data.project.url}) | ${data.project.description || 'N/A'} | ${data.project.language || 'N/A'} | ${data.stars_at_snapshot.toLocaleString()} |`
      )
      .join('\n');

    return `${header}\n${separator}\n${rows}`;
  }

  async generateReport(format: 'html' | 'markdown' = 'markdown', limit: number = 30): Promise<string> {
    const trendingData = await this.getTrendingData(limit);

    if (format === 'html') {
      return this.generateHtmlTable(trendingData);
    } else {
      return this.generateMarkdownTable(trendingData);
    }
  }
}
