"""OpenAI API client for project summarization"""
import logging
from typing import Optional, Dict, Any
from openai import OpenAI, OpenAIError, RateLimitError
from src.config.settings import settings

logger = logging.getLogger(__name__)


class OpenAIClient:
    """Wrapper for OpenAI API client with error handling"""

    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-3.5-turbo"):
        """
        Initialize OpenAI client

        Args:
            api_key: OpenAI API key. If None, uses settings.OPENAI_API_KEY
            model: Model to use (default: gpt-3.5-turbo)
        """
        key = api_key or settings.OPENAI_API_KEY
        if not key:
            raise ValueError("OpenAI API key is required")

        self.client = OpenAI(api_key=key)
        self.model = model
        logger.info(f"OpenAI client initialized with model: {model}")

    def generate_completion(
        self,
        prompt: str,
        max_tokens: int = 500,
        temperature: float = 0.7,
        system_message: str = None
    ) -> str:
        """
        Generate text completion using OpenAI API

        Args:
            prompt: User prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0-1)
            system_message: Optional system message

        Returns:
            Generated text
        """
        try:
            messages = []
            if system_message:
                messages.append({"role": "system", "content": system_message})
            messages.append({"role": "user", "content": prompt})

            logger.debug(f"Generating completion for prompt: {prompt[:100]}...")

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature
            )

            content = response.choices[0].message.content
            logger.debug(f"Generated {len(content)} characters")
            return content

        except RateLimitError:
            logger.error("OpenAI API rate limit exceeded")
            raise
        except OpenAIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in generate_completion: {e}")
            raise
