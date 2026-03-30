# app/main.py
# ─────────────────────────────────────────────────────────────
# Entry point of the Right Move CRM FastAPI application.
#
# Responsibilities:
#   - Initialize the FastAPI app
#   - Create DB tables on startup (dev convenience)
#   - Register all routers
#   - Expose health check endpoint
#   - Configure CORS for frontend integration
# ─────────────────────────────────────────────────────────────

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.core.database import engine, Base

# Import models so SQLAlchemy knows about them before create_all()
from app.models import job_requirement  # noqa: F401
from app.models import candidate  # noqa: F401

# Import routers
from app.routes import jobs
from app.routes import candidates


# ── Lifespan: runs once on startup ────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Creates all DB tables on server startup (dev convenience).
    In production, replace with Alembic migrations.
    """
    Base.metadata.create_all(bind=engine)
    print(f"✓ Database tables ready – {settings.APP_NAME} started")
    yield  # server runs here
    # (cleanup on shutdown goes after yield)


# ── FastAPI App ───────────────────────────────────────────────
app = FastAPI(
    lifespan=lifespan,
    title=settings.APP_NAME,
    description="Recruitment Operations Management System – Backend API",
    version="1.0.0",
    docs_url="/docs",        # Swagger UI → http://localhost:8000/docs
    redoc_url="/redoc",      # ReDoc UI  → http://localhost:8000/redoc
)

# ── CORS Middleware ───────────────────────────────────────────
# Allows the React frontend (localhost:5173) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server (frontend)
        "http://localhost:3000",   # fallback if on CRA or Next
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routers ──────────────────────────────────────────
app.include_router(jobs.router)
app.include_router(candidates.router)

# ── Static Files ──────────────────────────────────────────────
# Ensure uploads directory exists
if not os.path.exists("uploads"):
    os.makedirs("uploads")

# Mount /uploads to serve resumes and other files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── Health Check ──────────────────────────────────────────────
@app.get("/", tags=["Health"], summary="Root / Health Check")
def root():
    """Quick check that the API is up and running."""
    return JSONResponse(content={
        "success": True,
        "message": f"{settings.APP_NAME} API is running",
        "environment": settings.APP_ENV,
    })


@app.get("/health", tags=["Health"], summary="Health Check")
def health():
    """Health check endpoint for monitoring tools."""
    return JSONResponse(content={
        "success": True,
        "status": "healthy",
        "app": settings.APP_NAME,
    })
