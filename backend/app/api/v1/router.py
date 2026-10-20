from fastapi import APIRouter
from app.api.v1.endpoints import auth, scan, letters, history, admin, gmail

api_v1_router = APIRouter()

api_v1_router.include_router(auth.router)
api_v1_router.include_router(scan.router)
api_v1_router.include_router(letters.router)
api_v1_router.include_router(history.router)
api_v1_router.include_router(admin.router)
api_v1_router.include_router(gmail.router)

