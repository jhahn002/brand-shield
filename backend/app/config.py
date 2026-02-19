from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "Brand Shield API"
    debug: bool = False
    secret_key: str = "change-me-in-production"
    
    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/brandshield"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # DataForSEO
    dataforseo_login: str = ""
    dataforseo_password: str = ""
    
    # Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    
    # S3 / Object Storage
    s3_bucket: str = "brand-shield"
    s3_region: str = "auto"
    s3_endpoint: str = ""
    s3_access_key: str = ""
    s3_secret_key: str = ""
    
    # JWT
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    
    # WHOIS
    whoisxml_api_key: str = ""
    
    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
