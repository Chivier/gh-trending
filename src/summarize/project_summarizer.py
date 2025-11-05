"""Generate AI summaries for GitHub projects"""
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from src.summarize.openai_client import OpenAIClient
from src.database.models import Project, Summary

logger = logging.getLogger(__name__)


class ProjectSummarizer:
    """Generate AI-powered summaries for GitHub projects"""

    SYSTEM_MESSAGE = """You are a technical analyst specializing in evaluating open-source GitHub projects.
Provide clear, concise, and informative summaries that help developers quickly understand a project's value and purpose."""

    SUMMARY_TEMPLATE = """Analyze this GitHub project and provide a comprehensive summary:

Project Name: {name}
Description: {description}
Programming Language: {language}
Stars: {stars}
URL: {url}

Please provide:
1. What this project does (2-3 sentences)
2. Usefulness rating (1-10 with brief justification)
3. Key technologies and frameworks used
4. Target audience and use cases
5. Notable features or advantages

Format your response as a structured analysis."""

    def __init__(self, db_session: Session, openai_client: OpenAIClient = None):
        """
        Initialize project summarizer

        Args:
            db_session: Database session
            openai_client: OpenAI client instance (creates new if None)
        """
        self.db = db_session
        self.openai_client = openai_client or OpenAIClient()

    def generate_summary(self, project_data: Dict[str, Any]) -> str:
        """
        Generate AI summary for a project

        Args:
            project_data: Dictionary containing project information

        Returns:
            Generated summary text
        """
        prompt = self.SUMMARY_TEMPLATE.format(
            name=project_data.get('name', 'Unknown'),
            description=project_data.get('description', 'No description'),
            language=project_data.get('language', 'Unknown'),
            stars=project_data.get('stars', 0),
            url=project_data.get('url', '')
        )

        logger.info(f"Generating summary for project: {project_data.get('name')}")

        try:
            summary = self.openai_client.generate_completion(
                prompt=prompt,
                system_message=self.SYSTEM_MESSAGE,
                max_tokens=600,
                temperature=0.7
            )
            return summary
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            raise

    def summarize_project(self, project_id: int) -> Summary:
        """
        Generate and save summary for a project by ID

        Args:
            project_id: Project database ID

        Returns:
            Created Summary object
        """
        # Get project from database
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project with ID {project_id} not found")

        # Check if summary already exists
        existing_summary = self.db.query(Summary).filter(
            Summary.project_id == project_id
        ).first()

        if existing_summary:
            logger.info(f"Summary already exists for project {project.full_name}")
            return existing_summary

        # Prepare project data
        project_data = {
            'name': project.name,
            'description': project.description,
            'language': project.language,
            'stars': project.stars,
            'url': project.url
        }

        # Generate summary
        summary_text = self.generate_summary(project_data)

        # Save to database
        summary = Summary(
            project_id=project_id,
            summary_text=summary_text,
            analysis=summary_text,  # Can be parsed separately if needed
            created_at=datetime.now()
        )
        self.db.add(summary)
        self.db.commit()

        logger.info(f"Saved summary for project: {project.full_name}")
        return summary

    def batch_summarize(self, project_ids: list = None, limit: int = None) -> int:
        """
        Generate summaries for multiple projects

        Args:
            project_ids: List of project IDs to summarize. If None, summarize all projects
            limit: Maximum number of projects to summarize

        Returns:
            Number of summaries generated
        """
        # Get projects to summarize
        query = self.db.query(Project)

        if project_ids:
            query = query.filter(Project.id.in_(project_ids))

        # Exclude projects that already have summaries
        existing_summaries = self.db.query(Summary.project_id).all()
        existing_ids = [s[0] for s in existing_summaries]
        query = query.filter(~Project.id.in_(existing_ids))

        if limit:
            query = query.limit(limit)

        projects = query.all()

        logger.info(f"Generating summaries for {len(projects)} projects")

        count = 0
        for project in projects:
            try:
                self.summarize_project(project.id)
                count += 1
            except Exception as e:
                logger.error(f"Failed to summarize project {project.full_name}: {e}")
                continue

        logger.info(f"Successfully generated {count} summaries")
        return count
