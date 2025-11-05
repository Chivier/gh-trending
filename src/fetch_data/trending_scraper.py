"""Scrape trending repositories from GitHub without API token"""
import logging
import requests
from datetime import datetime
from typing import List, Dict, Any
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from src.database.models import Project, TrendingSnapshot

logger = logging.getLogger(__name__)


class TrendingScraper:
    """Scrape GitHub trending page without API token"""

    BASE_URL = "https://github.com/trending"

    def __init__(self, db_session: Session):
        """
        Initialize trending scraper

        Args:
            db_session: Database session
        """
        self.db = db_session
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

    def scrape_trending(self, language: str = None, since: str = "daily") -> List[Dict[str, Any]]:
        """
        Scrape trending repositories from GitHub

        Args:
            language: Programming language filter (e.g., "python")
            since: Time range - "daily", "weekly", or "monthly"

        Returns:
            List of repository data dictionaries
        """
        # Build URL
        url = self.BASE_URL
        params = {}
        if language:
            params['spoken_language_code'] = language
        if since:
            params['since'] = since

        logger.info(f"Scraping GitHub trending: {url} with params {params}")

        try:
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'lxml')

            # Find all repository articles
            repos = soup.select('article.Box-row')

            trending_data = []
            for rank, repo in enumerate(repos, 1):
                try:
                    # Extract repository name and owner
                    h2 = repo.select_one('h2 a')
                    if not h2:
                        continue

                    full_name = h2['href'].strip('/')
                    name = full_name.split('/')[-1]
                    owner = full_name.split('/')[0]

                    # Extract description
                    desc_elem = repo.select_one('p')
                    description = desc_elem.text.strip() if desc_elem else ""

                    # Extract language
                    lang_elem = repo.select_one('[itemprop="programmingLanguage"]')
                    language = lang_elem.text.strip() if lang_elem else None

                    # Extract stars
                    stars_elem = repo.select_one('a[href*="/stargazers"]')
                    stars = 0
                    if stars_elem:
                        stars_text = stars_elem.text.strip().replace(',', '')
                        try:
                            stars = int(stars_text)
                        except ValueError:
                            pass

                    # Build URL
                    url = f"https://github.com/{full_name}"

                    repo_data = {
                        'rank': rank,
                        'name': name,
                        'full_name': full_name,
                        'owner': owner,
                        'description': description,
                        'language': language,
                        'stars': stars,
                        'url': url,
                    }

                    trending_data.append(repo_data)

                except Exception as e:
                    logger.warning(f"Failed to parse repo: {e}")
                    continue

            logger.info(f"Successfully scraped {len(trending_data)} trending repositories")
            return trending_data

        except Exception as e:
            logger.error(f"Error scraping trending: {e}")
            raise

    def save_to_database(self, trending_data: List[Dict[str, Any]]) -> int:
        """
        Save scraped data to database

        Args:
            trending_data: List of repository data dictionaries

        Returns:
            Number of saved repositories
        """
        saved_count = 0
        snapshot_date = datetime.now()

        try:
            for repo_data in trending_data:
                # Check if project exists
                project = self.db.query(Project).filter(
                    Project.full_name == repo_data['full_name']
                ).first()

                if project:
                    # Update existing project
                    project.stars = repo_data['stars']
                    project.description = repo_data['description']
                    project.updated_at = datetime.now()
                else:
                    # Create new project
                    project = Project(
                        name=repo_data['name'],
                        full_name=repo_data['full_name'],
                        description=repo_data['description'],
                        language=repo_data['language'],
                        stars=repo_data['stars'],
                        url=repo_data['url'],
                        created_at=datetime.now()
                    )
                    self.db.add(project)
                    self.db.flush()

                # Create snapshot
                snapshot = TrendingSnapshot(
                    date=snapshot_date,
                    project_id=project.id,
                    stars_at_snapshot=repo_data['stars'],
                    rank=repo_data['rank'],
                    created_at=datetime.now()
                )
                self.db.add(snapshot)
                saved_count += 1

            self.db.commit()
            logger.info(f"Saved {saved_count} repositories to database")
            return saved_count

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error saving to database: {e}")
            raise

    def fetch_and_save(self, language: str = None, since: str = "daily") -> int:
        """
        Scrape and save trending repositories

        Args:
            language: Programming language filter
            since: Time range

        Returns:
            Number of saved repositories
        """
        trending_data = self.scrape_trending(language=language, since=since)
        return self.save_to_database(trending_data)
