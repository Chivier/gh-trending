"""Application settings and environment configuration"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings:
    """Application configuration settings"""

    # OpenAI Configuration (Optional - only for summaries)
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

    # Database Configuration
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./gh_trending.db')

    # Application Configuration
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

    @classmethod
    def validate(cls):
        """Validate required environment variables"""
        # OPENAI_API_KEY is optional - only needed for summaries
        return True


# Create global settings instance
settings = Settings()
