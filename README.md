# GitHub Trending Analysis Tool

A lightweight GitHub Trending scraper and analysis tool that requires no GitHub Token and updates automatically every day.

## ✨ Features

- **🚫 No Token Required**: Directly scrapes GitHub Trending pages without needing an API Token
- **⏰ Auto Updates**: Automatically fetches the latest trending projects daily
- **💾 Data Storage**: Stores historical data using SQLite
- **📊 Data Visualization**: Beautiful Web Dashboard
- **🤖 AI Summaries** (optional): Uses OpenAI to generate project summaries
- **📈 Trend Analysis**: Analyzes programming language trends

## 🏗️ Architecture

```
gh-trending/
├── src/
│   ├── fetch_data/        # Web scraping (BeautifulSoup)
│   ├── summarize/         # AI summaries (optional)
│   ├── generate/          # Report generation
│   ├── database/          # Database models
│   └── api.py             # FastAPI server
├── frontend/              # Web Dashboard
├── scheduler.py           # Daily scheduled tasks
└── reports/               # Generated reports
```

## 📦 Installation

### Prerequisites

- Python 3.8+
- (Optional) OpenAI API Key - Only required for project summaries

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/gh-trending.git
cd gh-trending
```

2. **Install dependencies**
```bash
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Configure environment variables** (optional)
```bash
cp .env.example .env
# If you need AI summary functionality, edit .env and add OPENAI_API_KEY
# Otherwise you can skip this step
```

4. **Initialize the database**
```bash
alembic upgrade head
```

5. **Run the application**
```bash
# Start the Web API
python src/api.py

# Start the scheduler (auto-updates daily at 10:00 AM)
python scheduler.py
```

## 🚀 Usage

### Web Interface

After starting the API, visit:
- Dashboard: Open `frontend/index.html`
- HTML Report: http://localhost:8000/api/report/html

### Manual Fetch

Manually trigger data fetching via the API:
```bash
curl -X POST http://localhost:8000/api/fetch
```

### View Data

```bash
# Get trending list
curl http://localhost:8000/api/trending

# Filter by language
curl http://localhost:8000/api/trending?language=Python
```

## ⏰ Automation

The scheduler automatically executes daily at 10:00 AM:
1. Fetch the latest trending projects
2. (Optional) Generate AI summaries for new projects (up to 5)
3. Generate daily reports

## 📊 API Endpoints

| Endpoint | Method | Description |
|------|------|------|
| `/api/trending` | GET | Get list of trending projects |
| `/api/projects/{id}` | GET | Get project details |
| `/api/projects/{id}/summary` | GET | Get project summary |
| `/api/report/html` | GET | Get report in HTML format |
| `/api/fetch` | POST | Manually trigger data fetch |

## 🐳 Docker Deployment

```bash
docker-compose up -d
```

This will start:
- API server (port 8000)
- Scheduled task scheduler

## 🔄 CI/CD

The project includes GitHub Actions workflows for continuous integration and deployment:

### Available Workflows

1. **CI Tests** (`.github/workflows/ci-test.yml`)
   - Runs on every push and pull request
   - Tests Python environment setup
   - Verifies database initialization
   - Tests API endpoints
   - Validates frontend files

2. **Frontend Deploy** (`.github/workflows/frontend-deploy.yml`)
   - Deploys both backend and frontend
   - Runs health checks
   - Provides service URLs for testing

### Running Locally with CI

The workflows can be triggered manually via GitHub Actions UI or will run automatically on:
- Push to `main`, `master`, or `develop` branches
- Pull requests to these branches

### Frontend Configuration

The frontend automatically detects the API endpoint:
- Default: `http://localhost:8000`
- Can be configured by setting `window.ENV_API_URL` before loading the page

## 📝 Tech Stack

- **Web Scraping**: BeautifulSoup4 + Requests
- **Web Framework**: FastAPI
- **Database**: SQLite + SQLAlchemy
- **Frontend**: HTML/CSS/JavaScript
- **AI**: OpenAI (optional)
- **Scheduling**: Schedule

## 🔧 Configuration

### Environment Variables

```env
# OpenAI API Key (optional - only for AI summaries)
OPENAI_API_KEY=sk-...

# Database
DATABASE_URL=sqlite:///./gh_trending.db

# Application
DEBUG=True
LOG_LEVEL=INFO
```

### Schedule Time

Modify the time in `scheduler.py`:
```python
schedule.every().day.at("10:00").do(daily_job)  # Daily at 10:00 AM
```

## 📂 Database Structure

### Projects Table
- id, name, full_name, description
- language, stars, url
- created_at, updated_at

### TrendingSnapshots Table
- id, date, project_id
- stars_at_snapshot, rank

### Summaries Table (optional)
- id, project_id
- summary_text, analysis

## 🎯 Key Improvements

Compared to the full version, this lightweight version:

1. ✅ **No GitHub Token Required** - Uses web scraping instead of API
2. ✅ **Simplified Scheduling** - Merged from 3 tasks to 1 daily task
3. ✅ **Lower Costs** - Reduced AI summaries from 10 to 5
4. ✅ **More Lightweight** - Removed PyGithub dependency

## 📄 License

MIT License

## 🤝 Contributing

Issues and Pull Requests are welcome!
