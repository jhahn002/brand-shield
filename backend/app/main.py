"""Brand Shield API — FastAPI entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import get_settings
from app.database import init_db
from app.routers import health, brands, threats, keywords, setup

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables if they don't exist
    await init_db()
    print("✅ Database tables initialized")
    yield
    # Shutdown
    print("👋 Shutting down")


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS — allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.up.railway.app",
        "*",  # TODO: tighten for production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers under /api/v1
app.include_router(health.router, prefix="/api/v1")
app.include_router(brands.router, prefix="/api/v1")
app.include_router(threats.router, prefix="/api/v1")
app.include_router(keywords.router, prefix="/api/v1")
app.include_router(setup.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"service": "Brand Shield API", "version": "0.1.0", "docs": "/api/docs"}
