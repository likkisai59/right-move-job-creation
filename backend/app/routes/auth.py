from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(payload: LoginRequest):
    # Mock authentication logic
    if payload.username == "admin" and payload.password == "admin123":
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=success_response("Login successful", {
                "token": "mock-jwt-token-for-demo",
                "user": {
                    "username": "admin",
                    "role": "administrator",
                    "email": "admin@rightmove.in"
                }
            })
        )
    
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content=error_response("Invalid credentials")
    )
