from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, JSON, String, Text

from app.db.database import Base


class HistoricalFigure(Base):
    __tablename__ = "historical_figures"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    birth_year = Column(Integer)
    death_year = Column(Integer, nullable=True)
    profession = Column(String)
    achievements = Column(JSON)
    biography = Column(Text)
    image_url = Column(String)
    category = Column(String, index=True)
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class HistoricalEvent(Base):
    __tablename__ = "historical_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    year = Column(Integer)
    description = Column(Text)
    significance = Column(Text)
    location = Column(String)
    key_figures = Column(JSON)
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text)
    price = Column(Float)
    category = Column(String, index=True)
    seller_id = Column(Integer, nullable=True)
    image_urls = Column(JSON)
    tags = Column(JSON)
    is_active = Column(Boolean, default=True)
    stock_quantity = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
