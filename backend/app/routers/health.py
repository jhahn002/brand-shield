"""Health check endpoint — verifies DB, Redis, and DataForSEO connections."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database import get_db
from app.config import get_settings
from app.services.dataforseo import test_connection as test_dataforseo
import redis.asyncio as aioredis

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    settings = get_settings()

    # Check Postgres
    db_status = "disconnected"
    try:
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)[:100]}"

    # Check Redis
    redis_status = "disconnected"
    try:
        r = aioredis.from_url(settings.redis_url)
        await r.ping()
        redis_status = "connected"
        await r.close()
    except Exception as e:
        redis_status = f"error: {str(e)[:100]}"

    # Check DataForSEO
    dataforseo_status = "not configured"
    if settings.dataforseo_login:
        try:
            connected = await test_dataforseo()
            dataforseo_status = "connected" if connected else "auth failed"
        except Exception as e:
            dataforseo_status = f"error: {str(e)[:100]}"

    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "database": db_status,
        "redis": redis_status,
        "dataforseo": dataforseo_status,
        "version": "0.2.0",
    }
