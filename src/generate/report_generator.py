"""Generate daily reports for GitHub trending projects"""
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional
from sqlalchemy.orm import Session
from src.generate.table_generator import TableGenerator
from src.generate.trend_analyzer import TrendAnalyzer
from src.summarize.openai_client import OpenAIClient

logger = logging.getLogger(__name__)


class ReportGenerator:
    """Generate comprehensive daily reports"""

    def __init__(self, db_session: Session, output_dir: str = "reports"):
        """
        Initialize report generator

        Args:
            db_session: Database session
            output_dir: Directory to save reports
        """
        self.db = db_session
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)

        self.table_gen = TableGenerator(db_session)
        self.trend_analyzer = TrendAnalyzer(db_session)

    def generate_daily_report(
        self,
        date: datetime = None,
        include_analysis: bool = True,
        include_commentary: bool = True
    ) -> str:
        """
        Generate complete daily report

        Args:
            date: Date for the report (default: today)
            include_analysis: Include trend analysis
            include_commentary: Include AI-generated commentary

        Returns:
            Report content as markdown
        """
        if not date:
            date = datetime.now()

        date_str = date.strftime("%Y-%m-%d")
        logger.info(f"Generating daily report for {date_str}")

        # Build report
        report = f"# GitHub Trending Daily Report\n"
        report += f"**Date**: {date_str}\n\n"
        report += "---\n\n"

        # Get trending data
        trending_data = self.table_gen.get_trending_data(date=date.date(), limit=30)

        if not trending_data:
            report += "No trending data available for this date.\n"
            return report

        # Add summary statistics
        report += "## Summary Statistics\n\n"
        report += f"- **Total Trending Projects**: {len(trending_data)}\n"

        languages = set(d['language'] for d in trending_data if d['language'] != 'N/A')
        report += f"- **Languages Represented**: {len(languages)}\n"

        total_stars = sum(d['stars'] for d in trending_data)
        report += f"- **Total Stars**: {total_stars:,}\n"
        report += f"- **Average Stars**: {total_stars // len(trending_data):,}\n\n"

        # Add trending table
        report += "## Top Trending Projects\n\n"
        table = self.table_gen.generate_markdown_table(trending_data)
        report += table + "\n\n"

        # Add trend analysis
        if include_analysis:
            report += self.trend_analyzer.generate_analysis_summary()
            report += "\n"

        # Add AI commentary (optional)
        if include_commentary:
            try:
                commentary = self._generate_commentary(trending_data)
                report += "## AI Analysis & Commentary\n\n"
                report += commentary + "\n\n"
            except Exception as e:
                logger.error(f"Failed to generate commentary: {e}")

        # Add footer
        report += "---\n\n"
        report += f"*Report generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n"

        return report

    def _generate_commentary(self, trending_data: list) -> str:
        """Generate AI commentary on trends"""
        try:
            client = OpenAIClient()

            # Prepare summary of top projects
            top_5 = trending_data[:5]
            projects_summary = "\n".join([
                f"{i+1}. {p['name']} ({p['language']}) - {p['stars']} stars"
                for i, p in enumerate(top_5)
            ])

            prompt = f"""Based on these top 5 trending GitHub projects today:

{projects_summary}

Provide a brief analysis (3-4 sentences) covering:
1. Notable patterns or themes
2. Interesting insights about the trending technologies
3. What this might indicate about current developer interests"""

            commentary = client.generate_completion(
                prompt=prompt,
                max_tokens=300,
                temperature=0.7
            )
            return commentary
        except Exception as e:
            logger.error(f"Error generating commentary: {e}")
            return "Commentary generation unavailable."

    def save_report(self, report: str, filename: str = None) -> str:
        """
        Save report to file

        Args:
            report: Report content
            filename: Output filename (default: auto-generated)

        Returns:
            Path to saved file
        """
        if not filename:
            filename = f"trending_report_{datetime.now().strftime('%Y%m%d')}.md"

        filepath = self.output_dir / filename
        filepath.write_text(report, encoding='utf-8')

        logger.info(f"Report saved to {filepath}")
        return str(filepath)

    def generate_and_save(self, date: datetime = None) -> str:
        """
        Generate and save daily report

        Args:
            date: Date for the report

        Returns:
            Path to saved report
        """
        report = self.generate_daily_report(date=date)
        return self.save_report(report)
