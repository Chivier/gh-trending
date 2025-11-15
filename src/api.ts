import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import path from 'path';
import { Feed } from 'feed';
import { initializeDatabase, AppDataSource } from './database/data-source';
import { Project } from './database/models/Project';
import { TrendingSnapshot } from './database/models/TrendingSnapshot';
import { TrendingScraper } from './fetch/TrendingScraper';
import { TableGenerator } from './generate/TableGenerator';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'GitHub Trending RSS Feed',
    version: '1.0.0',
    endpoints: {
      'RSS Feed (All Languages)': '/feed.xml',
      'RSS Feed (By Language)': '/feed/:language.xml (e.g., /feed/javascript.xml)',
      'JSON API': '/api/trending',
      'HTML Report': '/api/report/html',
    },
  });
});

app.get('/api/trending', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 30;
    const language = req.query.language as string | undefined;

    const projectRepo = AppDataSource.getRepository(Project);
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

    res.json(results);
  } catch (error) {
    console.error('Error fetching trending:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/projects/:projectId', async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const projectRepo = AppDataSource.getRepository(Project);

    const project = await projectRepo.findOne({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      id: project.id,
      name: project.name,
      full_name: project.full_name,
      description: project.description,
      language: project.language,
      stars: project.stars,
      url: project.url,
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/report/html', async (req: Request, res: Response) => {
  try {
    const projectRepo = AppDataSource.getRepository(Project);
    const snapshotRepo = AppDataSource.getRepository(TrendingSnapshot);
    const tableGen = new TableGenerator(projectRepo, snapshotRepo);

    const trendingData = await tableGen.getTrendingData(30);
    const htmlTable = tableGen.generateHtmlTable(trendingData);

    const today = new Date().toISOString().split('T')[0];

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>GitHub Trending Report</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }
            h1 {
                color: #333;
            }
            .trending-table {
                width: 100%;
                border-collapse: collapse;
            }
            .trending-table th, .trending-table td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #ddd;
            }
            .trending-table th {
                background-color: #24292e;
                color: white;
            }
            .trending-table tr:hover {
                background-color: #f5f5f5;
            }
        </style>
    </head>
    <body>
        <h1>GitHub Trending - ${today}</h1>
        ${htmlTable}
    </body>
    </html>
    `;

    res.header('Content-Type', 'text/html').send(html);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// RSS Feed endpoints
app.get('/feed.xml', async (req: Request, res: Response) => {
  try {
    const snapshotRepo = AppDataSource.getRepository(TrendingSnapshot);

    const snapshots = await snapshotRepo
      .createQueryBuilder('snapshot')
      .leftJoinAndSelect('snapshot.project', 'project')
      .orderBy('snapshot.date', 'DESC')
      .addOrderBy('snapshot.rank', 'ASC')
      .take(30)
      .getMany();

    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

    const feed = new Feed({
      title: 'GitHub Trending Repositories',
      description: 'Daily trending repositories on GitHub',
      id: baseUrl,
      link: baseUrl,
      language: 'en',
      favicon: `${baseUrl}/favicon.ico`,
      copyright: 'All rights reserved',
      updated: snapshots.length > 0 ? snapshots[0].date : new Date(),
      generator: 'GitHub Trending RSS',
      feedLinks: {
        rss: `${baseUrl}/feed.xml`,
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

    res.header('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(feed.rss2());
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/feed/:language.xml', async (req: Request, res: Response) => {
  try {
    const language = req.params.language;
    const snapshotRepo = AppDataSource.getRepository(TrendingSnapshot);

    const snapshots = await snapshotRepo
      .createQueryBuilder('snapshot')
      .leftJoinAndSelect('snapshot.project', 'project')
      .where('LOWER(project.language) = LOWER(:language)', { language })
      .orderBy('snapshot.date', 'DESC')
      .addOrderBy('snapshot.rank', 'ASC')
      .take(30)
      .getMany();

    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

    const feed = new Feed({
      title: `GitHub Trending ${language} Repositories`,
      description: `Daily trending ${language} repositories on GitHub`,
      id: `${baseUrl}/feed/${language}.xml`,
      link: baseUrl,
      language: 'en',
      favicon: `${baseUrl}/favicon.ico`,
      copyright: 'All rights reserved',
      updated: snapshots.length > 0 ? snapshots[0].date : new Date(),
      generator: 'GitHub Trending RSS',
      feedLinks: {
        rss: `${baseUrl}/feed/${language}.xml`,
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

    res.header('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(feed.rss2());
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/fetch', async (req: Request, res: Response) => {
  try {
    const projectRepo = AppDataSource.getRepository(Project);
    const snapshotRepo = AppDataSource.getRepository(TrendingSnapshot);

    const scraper = new TrendingScraper(projectRepo, snapshotRepo);
    const count = await scraper.fetchAndSave(undefined, 'daily');

    res.json({ message: `Fetched ${count} trending repositories` });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch trending data' });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    // Start listening
    app.listen(PORT, () => {
      console.log(`GitHub Trending API running on http://0.0.0.0:${PORT}`);
      console.log(`API documentation: http://0.0.0.0:${PORT}/`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;
