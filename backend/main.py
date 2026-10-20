import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.models.schemas import HealthResponse
from app.api.v1.router import api_v1_router

# Initialize FastAPI application
app = FastAPI(
    title="DataRaksha AI Backend API",
    description="Privacy protection, cyber risk detection, and statutory data rights platform.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Central Route Registrations
app.include_router(api_v1_router, prefix="/api/v1")


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["System Health"],
    summary="Health Check Endpoint",
)
async def health_check():
    """Returns the operational status of the DataRaksha AI backend service."""
    return HealthResponse(
        status="ok",
        app="DataRaksha AI",
        version="1.0.0",
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=True if settings.ENVIRONMENT == "development" else False,
    )
