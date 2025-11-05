"""Analyze trends in GitHub projects"""
import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from src.database.models import Project, TrendingSnapshot

logger = logging.getLogger(__name__)


class TrendAnalyzer:
    """Analyze trends and patterns in GitHub projects"""

    def __init__(self, db_session: Session):
        """
        Initialize trend analyzer

        Args:
            db_session: Database session
        """
        self.db = db_session

    def analyze_language_trends(self, days: int = 7) -> Dict[str, Any]:
        """
        Analyze which programming languages are trending

        Args:
            days: Number of days to analyze

        Returns:
            Dictionary with language statistics
        """
        date_from = datetime.now() - timedelta(days=days)

        # Get language distribution
        results = self.db.query(
            Project.language,
            func.count(TrendingSnapshot.id).label('count'),
            func.avg(Project.stars).label('avg_stars')
        ).join(TrendingSnapshot).filter(
            TrendingSnapshot.date >= date_from,
            Project.language.isnot(None)
        ).group_by(Project.language).order_by(func.count(TrendingSnapshot.id).desc()).all()

        languages = []
        for lang, count, avg_stars in results:
            languages.append({
                'language': lang,
                'trending_count': count,
                'average_stars': int(avg_stars)
            })

        return {
            'period_days': days,
            'total_languages': len(languages),
            'languages': languages[:10]  # Top 10
        }

    def identify_rising_stars(self, min_stars: int = 100, days: int = 7) -> List[Dict[str, Any]]:
        """
        Identify projects that are rapidly gaining popularity

        Args:
            min_stars: Minimum star count
            days: Number of days to analyze

        Returns:
            List of rising star projects
        """
        # Get projects that appeared recently in trending
        date_from = datetime.now() - timedelta(days=days)

        snapshots = self.db.query(TrendingSnapshot).join(Project).filter(
            TrendingSnapshot.date >= date_from,
            Project.stars >= min_stars
        ).order_by(Project.stars.desc()).limit(10).all()

        rising_stars = []
        for snapshot in snapshots:
            project = snapshot.project
            rising_stars.append({
                'name': project.full_name,
                'stars': project.stars,
                'language': project.language,
                'description': project.description,
                'first_seen': snapshot.date
            })

        return rising_stars

    def generate_analysis_summary(self) -> str:
        """
        Generate a comprehensive trend analysis summary

        Returns:
            Text summary of trends
        """
        # Analyze language trends
        lang_trends = self.analyze_language_trends(days=7)
        rising_stars = self.identify_rising_stars(min_stars=100, days=7)

        summary = "## GitHub Trending Analysis\n\n"

        # Language trends
        summary += "### Top Trending Languages (Past 7 Days)\n\n"
        for lang_data in lang_trends['languages'][:5]:
            summary += f"- **{lang_data['language']}**: {lang_data['trending_count']} trending projects, avg {lang_data['average_stars']} stars\n"

        summary += "\n### Rising Stars\n\n"
        for star in rising_stars[:5]:
            summary += f"- **{star['name']}** ({star['language']}): {star['stars']} stars\n"
            if star['description']:
                summary += f"  {star['description'][:100]}...\n"

        return summary
