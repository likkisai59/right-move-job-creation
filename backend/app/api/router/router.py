from fastapi import APIRouter
from app.api.job.job_routes import router as job_router
from app.api.candidate.candidate_routes import router as candidate_router

api_router = APIRouter()
api_router.include_router(job_router)
api_router.include_router(candidate_router)
