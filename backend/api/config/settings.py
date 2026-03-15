from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    # Supabase
    supabase_url: str = "http://localhost:54321"
    supabase_anon_key: str = "test_anon_key"
    supabase_service_role_key: str = "test_service_role_key"
    supabase_jwt_secret: str = "test_jwt_secret"

    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/lovesult"

    # App
    env: str = "development"
    debug: bool = True
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
