# 测试爬虫功能

## 测试无需 Token 的爬取

```bash
# 激活虚拟环境
source venv/bin/activate

# 启动 Python
python3 << 'PYTHON'
from src.database.base import SessionLocal
from src.fetch_data import TrendingScraper

# 创建数据库会话
db = SessionLocal()

# 创建爬虫
scraper = TrendingScraper(db)

# 测试爬取
print("开始爬取 GitHub Trending...")
data = scraper.scrape_trending(since="daily")

print(f"\n成功爬取 {len(data)} 个项目:")
for i, repo in enumerate(data[:5], 1):
    print(f"{i}. {repo['full_name']} - {repo['stars']} stars - {repo['language']}")

# 保存到数据库
count = scraper.save_to_database(data)
print(f"\n已保存 {count} 个项目到数据库")

db.close()
PYTHON
```

## 预期输出

```
开始爬取 GitHub Trending...
成功爬取 25 个项目:
1. owner/repo-name - 1234 stars - Python
2. owner/another-repo - 5678 stars - JavaScript
...
已保存 25 个项目到数据库
```
