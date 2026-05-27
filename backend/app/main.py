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
from app.models import candidate_edit_history  # noqa: F401
from app.models import organization  # noqa: F401
from app.models import job_candidate  # noqa: F401
from app.models import employee  # noqa: F401
from app.models import attendance as attendance_model  # noqa: F401
from app.models import shift as shift_model  # noqa: F401
from app.models import leave as leave_model  # noqa: F401
from app.models import designation  # noqa: F401
from app.models import business_unit  # noqa: F401
from app.models import work_mode  # noqa: F401

# Import routers
from app.routes import jobs
from app.routes import candidates
from app.routes import organizations
from app.routes import auth
from app.routes import employees
from app.routes import attendance
from app.routes import designation as designation_router
from app.routes import business_unit as business_unit_router
from app.routes import work_mode as work_mode_router


# ── Lifespan: runs once on startup ────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Creates all DB tables on server startup (dev convenience).
    In production, replace with Alembic migrations.
    """
    Base.metadata.create_all(bind=engine)
    print(f"[*] Database tables ready - {settings.APP_NAME} started")
    
    # Auto-seed default designations, business units, and work modes if empty
    from app.core.database import SessionLocal
    from app.models.designation import Designation
    from app.models.business_unit import BusinessUnit
    from app.models.work_mode import WorkMode
    
    db = SessionLocal()
    try:
        # Seed Designations
        if db.query(Designation).count() == 0:
            initial_names = [
                'Director', 'Sr.Manager', 'Manager', 'Asst Manager', 
                'Team Lead', 'ATL', 'Senior Executive', 'Executive', 
                'Trainee', 'Intern'
            ]
            for name in initial_names:
                db.add(Designation(name=name, is_active=True))
            db.commit()
            print("✓ Seeded 10 default designations to database")

        # Seed Business Units
        if db.query(BusinessUnit).count() == 0:
            initial_bu = ['IT', 'HR', 'Sales', 'Marketing', 'Finance', 'Operations']
            for name in initial_bu:
                db.add(BusinessUnit(name=name, is_active=True))
            db.commit()
            print("✓ Seeded default business units to database")

        # Seed Work Modes
        if db.query(WorkMode).count() == 0:
            initial_wm = ['WFH', 'Office', 'Hybrid']
            for name in initial_wm:
                db.add(WorkMode(name=name, is_active=True))
            db.commit()
            print("✓ Seeded default work modes to database")
            
    except Exception as e:
        db.rollback()
        print(f"⚠️ Warning: Failed to seed default data: {e}")
    finally:
        db.close()
        
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
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routers ──────────────────────────────────────────
app.include_router(jobs.router)
app.include_router(candidates.router)
app.include_router(organizations.router)
app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(attendance.router)
app.include_router(designation_router.router)
app.include_router(business_unit_router.router)
app.include_router(work_mode_router.router)

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
