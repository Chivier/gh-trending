# GitHub Trending RSS Feed

A Next.js-based GitHub Trending scraper that generates RSS feeds and provides a beautiful web dashboard. No GitHub Token required!

[![CI Tests](https://github.com/Chivier/gh-trending/workflows/CI%20Tests/badge.svg)](https://github.com/Chivier/gh-trending/actions)

## 🌐 Links

- **Website**: [https://chivier.github.io/gh-trending/](https://chivier.github.io/gh-trending/)
- **Repository**: [https://github.com/Chivier/gh-trending](https://github.com/Chivier/gh-trending)

## ✨ Features

- **🚫 No Token Required**: Directly scrapes GitHub Trending pages without needing an API Token
- **⏰ Auto Updates**: Automatically fetches the latest trending projects daily
- **📡 RSS Feeds**: Generate RSS feeds for all languages or specific programming languages
- **💾 Data Storage**: Stores historical data using SQLite
- **📊 Beautiful Dashboard**: Modern Next.js web interface
- **🎨 Dark Theme**: GitHub-style dark theme UI

## 🏗️ Architecture

Built with Next.js for a unified full-stack experience:

```
gh-trending/
├── app/                   # Next.js App Router
│   ├── api/              # API Routes
│   │   ├── trending/     # Trending data API
│   │   ├── fetch/        # Manual fetch trigger
│   │   └── feed/         # RSS feed endpoints
│   ├── page.tsx          # Main dashboard
│   └── layout.tsx        # App layout
├── lib/                  # Shared libraries
│   ├── database/         # Database models & TypeORM
│   └── scraper/          # Web scraping logic
├── scripts/              # Utility scripts
│   └── scheduler.ts      # Cron job scheduler
└── __tests__/            # Jest tests
```

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/Chivier/gh-trending.git
cd gh-trending
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables** (optional)
```bash
cp .env.local.example .env.local
# Edit .env.local to customize settings if needed
```

4. **Fetch initial data**
```bash
npm run scheduler
# Or manually trigger via API after starting the dev server:
# curl -X POST http://localhost:3000/api/fetch
```

5. **Run the application**
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

The application will be available at `http://localhost:3000`

## 🚀 Usage

### Web Interface

Open your browser and visit `http://localhost:3000` to see:
- 📊 Trending repositories dashboard
- 📡 RSS feed links for different programming languages

### RSS Feeds

Access RSS feeds at:
- All languages: `http://localhost:3000/api/feed`
- JavaScript: `http://localhost:3000/api/feed/javascript`
- Python: `http://localhost:3000/api/feed/python`
- TypeScript: `http://localhost:3000/api/feed/typescript`
- Go: `http://localhost:3000/api/feed/go`
- Rust: `http://localhost:3000/api/feed/rust`
- Or any other language: `http://localhost:3000/api/feed/{language}`

### API Endpoints

```bash
# Get trending list
curl http://localhost:3000/api/trending

# Filter by language
curl http://localhost:3000/api/trending?language=TypeScript

# Manually trigger data fetch
curl -X POST http://localhost:3000/api/fetch
```

## ⏰ Automation

Run the scheduler to automatically fetch trending data daily at 9:00 AM UTC:

```bash
npm run scheduler
```

The scheduler will:
1. Fetch the latest trending projects from GitHub
2. Save them to the SQLite database
3. Make them available via RSS feeds and the web dashboard

## 📊 API Endpoints

| Endpoint | Method | Description |
|------|------|------|
| `/api/trending` | GET | Get list of trending projects (JSON) |
| `/api/trending?language={lang}` | GET | Filter trending by language |
| `/api/feed` | GET | RSS feed for all languages |
| `/api/feed/{language}` | GET | RSS feed for specific language |
| `/api/fetch` | POST | Manually trigger data fetch |

## 🐳 Docker Deployment

```bash
docker-compose up -d
```

This will start:
- Next.js application (port 3000)
- Scheduled task scheduler

## 🔄 CI/CD

The project includes GitHub Actions workflows for continuous integration and deployment:

### Available Workflows

1. **CI Tests** (`.github/workflows/ci-test.yml`)
   - Runs on every push and pull request
   - Tests database initialization
   - Validates API endpoints
   - Runs Jest tests

2. **Frontend Deploy** (`.github/workflows/frontend-deploy.yml`)
   - Deploys both backend and frontend
   - Runs health checks
   - Provides service URLs for testing

### Running Locally with CI

The workflows can be triggered manually via GitHub Actions UI or will run automatically on:
- Push to `main`, `master`, or `develop` branches
- Pull requests to these branches

## 📝 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Web Scraping**: Cheerio + Axios
- **Database**: SQLite + TypeORM
- **RSS Generation**: feed
- **Scheduling**: node-cron
- **Testing**: Jest + React Testing Library

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
# Database path
DATABASE_PATH=./gh_trending.db

# Application URL (for RSS feed links)
BASE_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Node Environment
NODE_ENV=development
```

### Schedule Time

Modify the time in `scripts/scheduler.ts`:
```typescript
// Daily at 9:00 AM UTC
cron.schedule('0 9 * * *', fetchTrendingData, {
  scheduled: true,
  timezone: 'UTC',
});
```

## 📂 Database Structure

### Projects Table
- id, name, full_name, description
- language, stars, url
- created_at, updated_at

### TrendingSnapshots Table
- id, date, project_id
- stars_at_snapshot, rank

## 🎯 Key Features

1. ✅ **No GitHub Token Required** - Uses web scraping instead of API
2. ✅ **Unified Full-Stack** - Built with Next.js for seamless frontend/backend
3. ✅ **RSS Feeds** - Generate feeds for any programming language
4. ✅ **Modern UI** - GitHub-style dark theme interface
5. ✅ **Automated Updates** - Daily cron job to fetch latest trending repos

## 📄 License

Apache-2.0 License

## 🤝 Contributing

Issues and Pull Requests are welcome!
