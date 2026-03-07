from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", operation_id="healthCheck")
async def health_check() -> dict:
    return {
        "status": "healthy",
        "service": "LoveTalk API",
        "version": "0.1.0",
    }