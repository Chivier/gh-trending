#!/usr/bin/env python3
"""
Scheduler for automated trending data fetching and report generation
"""
import logging
import schedule
import time
from datetime import datetime
from src.config.settings import settings
from src.database.base import SessionLocal
from src.summarize import ProjectSummarizer
from src.generate import ReportGenerator

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def daily_job():
    """Single daily job - fetch, summarize, and generate report"""
    logger.info("Starting daily GitHub trending job...")
    db = SessionLocal()

    try:
        # 1. Fetch trending repositories
        logger.info("Fetching trending repositories...")
        from src.fetch_data import TrendingScraper
        scraper = TrendingScraper(db)
        count = scraper.fetch_and_save(since="daily")
        logger.info(f"Fetched {count} trending repositories")

        # 2. Generate AI summaries (optional, limited to save costs)
        logger.info("Generating summaries for new projects...")
        summarizer = ProjectSummarizer(db)
        summary_count = summarizer.batch_summarize(limit=5)  # Only 5 to save costs
        logger.info(f"Generated {summary_count} summaries")

        # 3. Generate daily report
        logger.info("Generating daily report...")
        report_gen = ReportGenerator(db)
        filepath = report_gen.generate_and_save()
        logger.info(f"Report generated: {filepath}")

        logger.info("Daily job completed successfully!")

    except Exception as e:
        logger.error(f"Error in daily job: {e}", exc_info=True)
    finally:
        db.close()


def main():
    """Main scheduler loop"""
    logger.info("GitHub Trending Scheduler started")

    # Schedule single daily job at 10:00 AM
    schedule.every().day.at("10:00").do(daily_job)

    logger.info("Job scheduled: Daily update at 10:00 AM")

    # Run immediately on start (optional)
    # daily_fetch_job()

    # Keep running
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute


if __name__ == "__main__":
    main()
