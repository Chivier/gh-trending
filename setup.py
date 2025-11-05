"""
Setup configuration for GitHub Trending Analysis Tool
"""
from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="gh-trending",
    version="0.1.0",
    author="Your Name",
    author_email="your.email@example.com",
    description="A tool to fetch, analyze, and summarize GitHub trending repositories",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/gh-trending",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
    install_requires=[
        "PyGithub>=2.1.1",
        "openai>=1.12.0",
        "SQLAlchemy>=2.0.25",
        "alembic>=1.13.1",
        "fastapi>=0.109.2",
        "uvicorn>=0.27.1",
        "python-dotenv>=1.0.1",
        "pandas>=2.2.0",
        "tabulate>=0.9.0",
        "requests>=2.31.0",
        "python-dateutil>=2.8.2",
    ],
    extras_require={
        "dev": [
            "pytest>=8.0.0",
            "pytest-asyncio>=0.23.4",
        ],
    },
    entry_points={
        "console_scripts": [
            "gh-trending=main:main",
        ],
    },
)
