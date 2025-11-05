# GitHub Trending 分析工具

一个轻量级的 GitHub Trending 抓取和分析工具，无需 GitHub Token，每天自动更新。

## ✨ 特性

- **🚫 无需 Token**: 直接爬取 GitHub Trending 页面，无需 API Token
- **⏰ 自动更新**: 每天自动抓取最新的 trending 项目
- **💾 数据存储**: 使用 SQLite 存储历史数据
- **📊 数据可视化**: 美观的 Web Dashboard
- **🤖 AI 摘要** (可选): 使用 OpenAI 生成项目摘要
- **📈 趋势分析**: 分析编程语言趋势

## 🏗️ 架构

```
gh-trending/
├── src/
│   ├── fetch_data/        # 网页爬取 (BeautifulSoup)
│   ├── summarize/         # AI 摘要 (可选)
│   ├── generate/          # 报告生成
│   ├── database/          # 数据库模型
│   └── api.py             # FastAPI 服务器
├── frontend/              # Web Dashboard
├── scheduler.py           # 每日定时任务
└── reports/               # 生成的报告
```

## 📦 安装

### 前置要求

- Python 3.8+
- (可选) OpenAI API Key - 仅用于生成项目摘要

### 快速开始

1. **克隆项目**
```bash
git clone https://github.com/yourusername/gh-trending.git
cd gh-trending
```

2. **安装依赖**
```bash
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **配置环境变量** (可选)
```bash
cp .env.example .env
# 如果需要 AI 摘要功能，编辑 .env 添加 OPENAI_API_KEY
# 否则可以跳过此步骤
```

4. **初始化数据库**
```bash
alembic upgrade head
```

5. **运行**
```bash
# 启动 Web API
python src/api.py

# 启动定时任务 (每天 10:00 AM 自动更新)
python scheduler.py
```

## 🚀 使用

### Web 界面

启动 API 后，访问：
- Dashboard: 打开 `frontend/index.html`
- HTML 报告: http://localhost:8000/api/report/html

### 手动抓取

通过 API 手动触发数据抓取：
```bash
curl -X POST http://localhost:8000/api/fetch
```

### 查看数据

```bash
# 获取 trending 列表
curl http://localhost:8000/api/trending

# 按语言过滤
curl http://localhost:8000/api/trending?language=Python
```

## ⏰ 自动化

调度器每天 10:00 AM 自动执行：
1. 抓取最新的 trending 项目
2. (可选) 为新项目生成 AI 摘要 (最多 5 个)
3. 生成每日报告

## 📊 API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/trending` | GET | 获取 trending 项目列表 |
| `/api/projects/{id}` | GET | 获取项目详情 |
| `/api/projects/{id}/summary` | GET | 获取项目摘要 |
| `/api/report/html` | GET | 获取 HTML 格式报告 |
| `/api/fetch` | POST | 手动触发数据抓取 |

## 🐳 Docker 部署

```bash
docker-compose up -d
```

这将启动：
- API 服务器 (端口 8000)
- 定时任务调度器

## 📝 技术栈

- **网页爬取**: BeautifulSoup4 + Requests
- **Web 框架**: FastAPI
- **数据库**: SQLite + SQLAlchemy
- **前端**: HTML/CSS/JavaScript
- **AI**: OpenAI (可选)
- **调度**: Schedule

## 🔧 配置

### 环境变量

```env
# OpenAI API Key (可选 - 仅用于 AI 摘要)
OPENAI_API_KEY=sk-...

# 数据库
DATABASE_URL=sqlite:///./gh_trending.db

# 应用
DEBUG=True
LOG_LEVEL=INFO
```

### 调度时间

修改 `scheduler.py` 中的时间：
```python
schedule.every().day.at("10:00").do(daily_job)  # 每天 10:00
```

## 📂 数据库结构

### Projects (项目表)
- id, name, full_name, description
- language, stars, url
- created_at, updated_at

### TrendingSnapshots (趋势快照表)
- id, date, project_id
- stars_at_snapshot, rank

### Summaries (摘要表) - 可选
- id, project_id
- summary_text, analysis

## 🎯 主要改进

相比完整版本，此轻量级版本：

1. ✅ **无需 GitHub Token** - 使用网页爬取替代 API
2. ✅ **简化调度** - 从 3 个任务合并为 1 个每日任务
3. ✅ **降低成本** - AI 摘要数量从 10 个减少到 5 个
4. ✅ **更轻量** - 移除 PyGithub 依赖

## 📄 License

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
