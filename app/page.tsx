import Link from 'next/link';

interface Project {
  id: number;
  name: string;
  full_name: string;
  description: string;
  language?: string;
  stars: number;
  url: string;
}

interface TrendingItem {
  rank: number;
  project: Project;
  stars_at_snapshot: number;
  date: Date;
}

async function getTrendingData(): Promise<TrendingItem[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/trending?limit=30`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to fetch trending data');
      return [];
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching trending data:', error);
    return [];
  }
}

export default async function Home() {
  const trendingData = await getTrendingData();

  return (
    <div className="container">
      <header className="header">
        <h1>🚀 GitHub Trending</h1>
        <p>Daily trending repositories on GitHub with RSS feeds</p>
      </header>

      <div className="rss-links">
        <h2>📡 RSS Feeds</h2>
        <ul>
          <li>
            <Link href="/api/feed" className="btn">
              All Languages RSS Feed
            </Link>
          </li>
          <li>
            <Link href="/api/feed/javascript" className="btn">
              JavaScript RSS Feed
            </Link>
          </li>
          <li>
            <Link href="/api/feed/python" className="btn">
              Python RSS Feed
            </Link>
          </li>
          <li>
            <Link href="/api/feed/typescript" className="btn">
              TypeScript RSS Feed
            </Link>
          </li>
          <li>
            <Link href="/api/feed/go" className="btn">
              Go RSS Feed
            </Link>
          </li>
          <li>
            <Link href="/api/feed/rust" className="btn">
              Rust RSS Feed
            </Link>
          </li>
        </ul>
      </div>

      <div className="trending-list">
        {trendingData.length === 0 ? (
          <div className="loading">
            <p>No trending data available. Please run the fetch task first.</p>
            <p style={{ marginTop: '20px' }}>
              Run: <code>curl -X POST http://localhost:3000/api/fetch</code>
            </p>
          </div>
        ) : (
          trendingData.map((item) => (
            <div key={`${item.project.id}-${item.rank}`} className="trending-item">
              <div className="trending-item-header">
                <a
                  href={item.project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="trending-item-title"
                >
                  {item.project.full_name}
                </a>
                <span className="trending-item-rank">#{item.rank}</span>
              </div>
              <p className="trending-item-description">
                {item.project.description || 'No description available'}
              </p>
              <div className="trending-item-meta">
                {item.project.language && (
                  <div className="meta-item">
                    <span className="language-dot"></span>
                    <span>{item.project.language}</span>
                  </div>
                )}
                <div className="meta-item">
                  <span>⭐</span>
                  <span>{item.project.stars.toLocaleString()} stars</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
