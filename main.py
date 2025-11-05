#!/usr/bin/env python3
"""
GitHub Trending Analysis Tool - Main Entry Point
"""
import sys
import logging
from src.config.settings import settings


def setup_logging():
    """Configure logging for the application"""
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('gh_trending.log')
        ]
    )


def main():
    """Main application entry point"""
    setup_logging()
    logger = logging.getLogger(__name__)

    try:
        # Validate environment configuration
        settings.validate()
        logger.info("GitHub Trending Analysis Tool started successfully")
        logger.info(f"Debug mode: {settings.DEBUG}")

        # TODO: Add main application logic here
        logger.info("Application initialized. Ready to fetch trending repositories.")

    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        logger.error("Please check your .env file and ensure all required variables are set")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
