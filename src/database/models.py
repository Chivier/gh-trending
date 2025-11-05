"""SQLAlchemy ORM models for GitHub trending projects"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from src.database.base import Base


class Project(Base):
    """Model for storing GitHub project information"""
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    full_name = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    language = Column(String(100), nullable=True, index=True)
    stars = Column(Integer, default=0, index=True)
    url = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    trending_snapshots = relationship("TrendingSnapshot", back_populates="project", cascade="all, delete-orphan")
    summaries = relationship("Summary", back_populates="project", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Project(id={self.id}, full_name='{self.full_name}', stars={self.stars})>"


class TrendingSnapshot(Base):
    """Model for storing daily trending snapshots"""
    __tablename__ = "trending_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    stars_at_snapshot = Column(Integer, default=0)
    rank = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="trending_snapshots")

    # Composite index for efficient queries
    __table_args__ = (
        Index('idx_date_rank', 'date', 'rank'),
    )

    def __repr__(self):
        return f"<TrendingSnapshot(id={self.id}, date={self.date}, project_id={self.project_id})>"


class Summary(Base):
    """Model for storing AI-generated project summaries"""
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    summary_text = Column(Text, nullable=False)
    analysis = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="summaries")

    def __repr__(self):
        return f"<Summary(id={self.id}, project_id={self.project_id})>"
