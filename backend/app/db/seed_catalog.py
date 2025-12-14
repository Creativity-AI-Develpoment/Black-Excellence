from sqlalchemy.orm import Session

from app.models.catalog import HistoricalFigure, HistoricalEvent, Product
from app.seed_data.historical_figures import HISTORICAL_FIGURES
from app.seed_data.historical_events import HISTORICAL_EVENTS
from app.seed_data.marketplace_products import MARKETPLACE_PRODUCTS


def seed_catalog(db: Session) -> None:
    """Seed figures, events, and products if tables are empty."""
    if db.query(HistoricalFigure).count() == 0:
        for fig in HISTORICAL_FIGURES:
            db.add(
                HistoricalFigure(
                    id=fig["id"],
                    name=fig["name"],
                    birth_year=fig["birth_year"],
                    death_year=fig.get("death_year"),
                    profession=fig["profession"],
                    achievements=fig["achievements"],
                    biography=fig["biography"],
                    image_url=fig["image_url"],
                    category=fig["category"],
                    is_featured=True,
                )
            )

    if db.query(HistoricalEvent).count() == 0:
        for event in HISTORICAL_EVENTS:
            db.add(
                HistoricalEvent(
                    id=event["id"],
                    title=event["title"],
                    year=event["year"],
                    description=event["description"],
                    significance=event["significance"],
                    location=event["location"],
                    key_figures=event["key_figures"],
                    is_featured=True,
                )
            )

    if db.query(Product).count() == 0:
        for prod in MARKETPLACE_PRODUCTS:
            db.add(
                Product(
                    id=prod["id"],
                    name=prod["name"],
                    description=prod["description"],
                    price=prod["price"],
                    category=prod["category"],
                    seller_id=prod.get("seller_id"),
                    image_urls=prod.get("image_urls") or [],
                    tags=prod.get("tags") or [],
                    is_active=prod.get("is_active", True),
                    stock_quantity=prod.get("stock_quantity", 0),
                )
            )

    db.commit()
