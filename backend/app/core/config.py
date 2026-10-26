from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application runtime configuration settings."""

    # Server Settings
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:5174,http://127.0.0.1:5174"

    # AI & Threat Intelligence APIs
    GEMINI_API_KEY: str = ""
    SAFE_BROWSING_API_KEY: str = ""

    # Supabase Auth & Database
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""

    # Google OAuth 2.0 & Gmail API Settings
    GOOGLE_CLIENT_ID: str = "1083257758857-um0n173p6sab1kic6b06g1qtrvnv5vaj.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/gmail/callback"
    FRONTEND_URL: str = "http://localhost:5173"
    GMAIL_STATE_SECRET: str = "dataraksha-gmail-oauth-state-secret-key"

    # Administrative Privileges Configuration (Allowlist UUIDs & Emails)
    ADMIN_USER_IDS: str = ""
    ADMIN_EMAILS: str = "mk9205507@gmail.com"
    INITIAL_ADMIN_EMAILS: str = "mk9205507@gmail.com"

    # Pydantic v2 configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    @property
    def cors_origins(self) -> List[str]:
        """Parsed list of allowed CORS origins."""
        if not self.ALLOWED_ORIGINS:
            return ["*"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()


settings = get_settings()
