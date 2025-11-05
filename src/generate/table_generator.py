"""Generate formatted tables from trending project data"""
import logging
from typing import List, Dict, Any
from datetime import datetime
import pandas as pd
from tabulate import tabulate
from sqlalchemy.orm import Session
from src.database.models import Project, TrendingSnapshot, Summary

logger = logging.getLogger(__name__)


class TableGenerator:
    """Generate formatted tables for trending projects"""

    def __init__(self, db_session: Session):
        """
        Initialize table generator

        Args:
            db_session: Database session
        """
        self.db = db_session

    def get_trending_data(self, date: datetime = None, limit: int = 30) -> List[Dict[str, Any]]:
        """
        Get trending projects data for a specific date

        Args:
            date: Date to get trending data for (default: today)
            limit: Maximum number of projects

        Returns:
            List of project data dictionaries
        """
        if not date:
            date = datetime.now().date()

        # Query trending snapshots for the date
        snapshots = self.db.query(TrendingSnapshot).join(Project).filter(
            TrendingSnapshot.date >= date,
            TrendingSnapshot.date < datetime.combine(date, datetime.max.time())
        ).order_by(TrendingSnapshot.rank).limit(limit).all()

        data = []
        for snapshot in snapshots:
            project = snapshot.project

            # Get summary if available
            summary = self.db.query(Summary).filter(
                Summary.project_id == project.id
            ).first()

            data.append({
                'rank': snapshot.rank,
                'name': project.name,
                'full_name': project.full_name,
                'description': project.description[:100] + '...' if project.description and len(project.description) > 100 else project.description,
                'language': project.language or 'N/A',
                'stars': project.stars,
                'url': project.url,
                'has_summary': summary is not None
            })

        return data

    def generate_markdown_table(self, data: List[Dict[str, Any]]) -> str:
        """
        Generate Markdown formatted table

        Args:
            data: List of project data dictionaries

        Returns:
            Markdown table string
        """
        if not data:
            return "No trending data available."

        # Create DataFrame
        df = pd.DataFrame(data)

        # Select and rename columns for display
        display_columns = {
            'rank': 'Rank',
            'name': 'Project Name',
            'language': 'Language',
            'stars': 'Stars',
            'description': 'Description'
        }

        df_display = df[list(display_columns.keys())].rename(columns=display_columns)

        # Generate markdown table
        markdown = tabulate(df_display, headers='keys', tablefmt='pipe', showindex=False)
        return markdown

    def generate_html_table(self, data: List[Dict[str, Any]]) -> str:
        """
        Generate HTML formatted table

        Args:
            data: List of project data dictionaries

        Returns:
            HTML table string
        """
        if not data:
            return "<p>No trending data available.</p>"

        # Create DataFrame
        df = pd.DataFrame(data)

        # Add clickable links
        df['name_link'] = df.apply(
            lambda row: f'<a href="{row["url"]}" target="_blank">{row["name"]}</a>',
            axis=1
        )

        # Select columns for display
        display_df = df[['rank', 'name_link', 'language', 'stars', 'description']].copy()
        display_df.columns = ['Rank', 'Project', 'Language', 'Stars', 'Description']

        # Generate HTML table
        html = display_df.to_html(escape=False, index=False, classes=['trending-table'])
        return html

    def generate_csv(self, data: List[Dict[str, Any]]) -> str:
        """
        Generate CSV formatted data

        Args:
            data: List of project data dictionaries

        Returns:
            CSV string
        """
        if not data:
            return ""

        df = pd.DataFrame(data)
        return df.to_csv(index=False)
