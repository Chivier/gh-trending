import axios from 'axios';
import * as cheerio from 'cheerio';
import { Repository } from 'typeorm';
import { Project } from '../database/models/Project';
import { TrendingSnapshot } from '../database/models/TrendingSnapshot';

export interface TrendingRepoData {
  rank: number;
  name: string;
  full_name: string;
  owner: string;
  description: string;
  language?: string;
  stars: number;
  url: string;
}

export class TrendingScraper {
  private static readonly BASE_URL = 'https://github.com/trending';
  private projectRepo: Repository<Project>;
  private snapshotRepo: Repository<TrendingSnapshot>;

  constructor(
    projectRepo: Repository<Project>,
    snapshotRepo: Repository<TrendingSnapshot>
  ) {
    this.projectRepo = projectRepo;
    this.snapshotRepo = snapshotRepo;
  }

  async scrapeTrending(
    language?: string,
    since: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<TrendingRepoData[]> {
    const url = TrendingScraper.BASE_URL;
    const params: Record<string, string> = {};

    if (language) {
      params.spoken_language_code = language;
    }
    if (since) {
      params.since = since;
    }

    console.log(`Scraping GitHub trending: ${url}`, params);

    try {
      const response = await axios.get(url, {
        params,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 30000,
        maxRedirects: 5,
      });

      const $ = cheerio.load(response.data);
      const repos = $('article.Box-row');
      const trendingData: TrendingRepoData[] = [];

      repos.each((index, element) => {
        try {
          const $repo = $(element);

          // Extract repository name and owner
          const h2 = $repo.find('h2 a');
          if (!h2.length) return;

          const href = h2.attr('href');
          if (!href) return;

          const fullName = href.replace(/^\//, '');
          const parts = fullName.split('/');
          const owner = parts[0];
          const name = parts[1];

          // Extract description
          const descElem = $repo.find('p');
          const description = descElem.text().trim();

          // Extract language
          const langElem = $repo.find('[itemprop="programmingLanguage"]');
          const language = langElem.length ? langElem.text().trim() : undefined;

          // Extract stars
          let stars = 0;
          const starsElem = $repo.find('a[href*="/stargazers"]');
          if (starsElem.length) {
            const starsText = starsElem.text().trim().replace(/,/g, '');
            const parsedStars = parseInt(starsText, 10);
            if (!isNaN(parsedStars)) {
              stars = parsedStars;
            }
          }

          const url = `https://github.com/${fullName}`;
          const rank = index + 1;

          trendingData.push({
            rank,
            name,
            full_name: fullName,
            owner,
            description,
            language,
            stars,
            url,
          });
        } catch (error) {
          console.warn(`Failed to parse repo:`, error);
        }
      });

      console.log(
        `Successfully scraped ${trendingData.length} trending repositories`
      );
      return trendingData;
    } catch (error) {
      console.error('Error scraping trending:', error);
      throw error;
    }
  }

  async saveToDatabase(trendingData: TrendingRepoData[]): Promise<number> {
    let savedCount = 0;
    const snapshotDate = new Date();

    try {
      for (const repoData of trendingData) {
        // Check if project exists
        let project = await this.projectRepo.findOne({
          where: { full_name: repoData.full_name },
        });

        if (project) {
          // Update existing project
          project.stars = repoData.stars;
          project.description = repoData.description;
          project.updated_at = new Date();
          await this.projectRepo.save(project);
        } else {
          // Create new project
          project = this.projectRepo.create({
            name: repoData.name,
            full_name: repoData.full_name,
            description: repoData.description,
            language: repoData.language,
            stars: repoData.stars,
            url: repoData.url,
          });
          await this.projectRepo.save(project);
        }

        // Create snapshot
        const snapshot = this.snapshotRepo.create({
          date: snapshotDate,
          project_id: project.id,
          stars_at_snapshot: repoData.stars,
          rank: repoData.rank,
        });
        await this.snapshotRepo.save(snapshot);
        savedCount++;
      }

      console.log(`Saved ${savedCount} repositories to database`);
      return savedCount;
    } catch (error) {
      console.error('Error saving to database:', error);
      throw error;
    }
  }

  async fetchAndSave(
    language?: string,
    since: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<number> {
    const trendingData = await this.scrapeTrending(language, since);
    return await this.saveToDatabase(trendingData);
  }
}
