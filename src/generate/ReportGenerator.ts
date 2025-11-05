import { Repository } from 'typeorm';
import { Project } from '../database/models/Project';
import { TrendingSnapshot } from '../database/models/TrendingSnapshot';
import { TableGenerator } from './TableGenerator';

export class ReportGenerator {
  private tableGen: TableGenerator;

  constructor(
    projectRepo: Repository<Project>,
    snapshotRepo: Repository<TrendingSnapshot>
  ) {
    this.tableGen = new TableGenerator(projectRepo, snapshotRepo);
  }

  async generateDailyReport(): Promise<string> {
    const today = new Date().toISOString().split('T')[0];
    const trendingData = await this.tableGen.getTrendingData(30);

    const markdownTable = this.tableGen.generateMarkdownTable(trendingData);

    const report = `# GitHub Trending - ${today}

## Top 30 Trending Repositories

${markdownTable}

---

*Generated automatically by GitHub Trending Tracker*
`;

    return report;
  }

  async generateLanguageReport(language: string, limit: number = 10): Promise<string> {
    const trendingData = await this.tableGen.getTrendingData(100);
    const filtered = trendingData.filter(
      (data) => data.project.language === language
    ).slice(0, limit);

    const markdownTable = this.tableGen.generateMarkdownTable(filtered);

    const report = `# GitHub Trending - ${language}

## Top ${limit} Trending ${language} Repositories

${markdownTable}

---

*Generated automatically by GitHub Trending Tracker*
`;

    return report;
  }
}
