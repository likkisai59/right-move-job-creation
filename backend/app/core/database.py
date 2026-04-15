# core/database.py
# ─────────────────────────────────────────────────────────────
# Sets up the SQLAlchemy engine, session factory, and Base.
# Also provides a FastAPI dependency (get_db) that opens a DB
# session for each request and closes it automatically after.
# ─────────────────────────────────────────────────────────────

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings


# ── Engine ────────────────────────────────────────────────────
# pool_pre_ping=True: checks the connection is alive before use
# (prevents "MySQL has gone away" errors on idle connections).
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,            # Max persistent connections
    max_overflow=20,         # Max temporary extra connections
    echo=(settings.APP_ENV == "development"),  # logs SQL in dev mode
)

# ── Session Factory ───────────────────────────────────────────
# autocommit=False : we commit transactions manually (safer)
# autoflush=False  : we control when to flush to DB
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


# ── Declarative Base ──────────────────────────────────────────
# All SQLAlchemy models will inherit from this class.
class Base(DeclarativeBase):
    pass


# ── FastAPI Dependency ────────────────────────────────────────
def get_db():
    """
    Yields a DB session for each request, then closes it.
    Usage in routes:
        db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
