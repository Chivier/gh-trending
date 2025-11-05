"""FastAPI backend for GitHub Trending"""
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from pydantic import BaseModel

from src.database.base import get_db
from src.database.models import Project, TrendingSnapshot, Summary
from src.fetch_data import TrendingScraper
from src.generate import TableGenerator, ReportGenerator

app = FastAPI(title="GitHub Trending API", version="0.1.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models
class ProjectResponse(BaseModel):
    id: int
    name: str
    full_name: str
    description: str | None
    language: str | None
    stars: int
    url: str

    class Config:
        from_attributes = True


class TrendingResponse(BaseModel):
    rank: int
    project: ProjectResponse
    stars_at_snapshot: int
    date: datetime


@app.get("/")
async def root():
    return {"message": "GitHub Trending API", "version": "0.1.0"}


@app.get("/api/trending", response_model=List[TrendingResponse])
async def get_trending(
    limit: int = 30,
    language: str | None = None,
    db: Session = Depends(get_db)
):
    """Get current trending repositories"""
    query = db.query(TrendingSnapshot).join(Project).order_by(
        TrendingSnapshot.date.desc(),
        TrendingSnapshot.rank
    )

    if language:
        query = query.filter(Project.language == language)

    snapshots = query.limit(limit).all()

    results = []
    for snapshot in snapshots:
        results.append({
            "rank": snapshot.rank,
            "project": snapshot.project,
            "stars_at_snapshot": snapshot.stars_at_snapshot,
            "date": snapshot.date
        })

    return results


@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int, db: Session = Depends(get_db)):
    """Get project details"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.get("/api/projects/{project_id}/summary")
async def get_project_summary(project_id: int, db: Session = Depends(get_db)):
    """Get project summary"""
    summary = db.query(Summary).filter(Summary.project_id == project_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    return {
        "project_id": summary.project_id,
        "summary_text": summary.summary_text,
        "analysis": summary.analysis,
        "created_at": summary.created_at
    }


@app.get("/api/report/html")
async def get_html_report(db: Session = Depends(get_db)):
    """Get trending report as HTML"""
    table_gen = TableGenerator(db)
    trending_data = table_gen.get_trending_data(limit=30)
    html_table = table_gen.generate_html_table(trending_data)

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>GitHub Trending Report</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }}
            h1 {{
                color: #333;
            }}
            .trending-table {{
                width: 100%;
                border-collapse: collapse;
            }}
            .trending-table th, .trending-table td {{
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #ddd;
            }}
            .trending-table th {{
                background-color: #24292e;
                color: white;
            }}
            .trending-table tr:hover {{
                background-color: #f5f5f5;
            }}
        </style>
    </head>
    <body>
        <h1>GitHub Trending - {datetime.now().strftime('%Y-%m-%d')}</h1>
        {html_table}
    </body>
    </html>
    """
    return HTMLResponse(content=html)


@app.post("/api/fetch")
async def trigger_fetch(db: Session = Depends(get_db)):
    """Manually trigger trending data fetch"""
    scraper = TrendingScraper(db)
    count = scraper.fetch_and_save(since="daily")
    return {"message": f"Fetched {count} trending repositories"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
