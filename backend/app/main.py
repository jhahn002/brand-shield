"""Brand Shield API — FastAPI entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import get_settings
from app.database import init_db
from app.routers import health, brands, threats, keywords, setup, debug, dashboard, dev_auth

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    print("✅ Database tables initialized")
    yield
    print("👋 Shutting down")

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.up.railway.app",
        "*",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(health.router, prefix="/api/v1")
app.include_router(brands.router, prefix="/api/v1")
app.include_router(threats.router, prefix="/api/v1")
app.include_router(keywords.router, prefix="/api/v1")
app.include_router(setup.router, prefix="/api/v1")
app.include_router(debug.router, prefix="/api/v1")
app.include_router(dev_auth.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"service": "Brand Shield API", "version": "0.1.0", "docs": "/api/docs"}
