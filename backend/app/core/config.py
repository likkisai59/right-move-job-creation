# core/config.py
# ─────────────────────────────────────────────────────────────
# Reads environment variables (from .env file) and exposes
# a clean Settings object used across the application.
# ─────────────────────────────────────────────────────────────

from pathlib import Path
from urllib.parse import quote_plus
from typing import Optional, Self
from pydantic_settings import BaseSettings
from pydantic import model_validator

# Resolve the .env file path relative to this file's directory (app/.env)
ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "rightmove_crm"
    DB_USER: str = "root"
    DB_PASSWORD: str = ""

    # This field will be populated from the DATABASE_URL environment variable if it exists.
    # Otherwise, it will be assembled in the validator below.
    DATABASE_URL: Optional[str] = None

    # App
    APP_NAME: str = "Right Move CRM"
    APP_ENV: str = "development"

    @model_validator(mode="after")
    def assemble_db_url(self) -> Self:
        """
        If DATABASE_URL was not provided in the environment/env file,
        build it from the individual DB_ variables.
        """
        if not self.DATABASE_URL:
            safe_password = quote_plus(str(self.DB_PASSWORD))
            self.DATABASE_URL = (
                f"mysql+pymysql://{self.DB_USER}:{safe_password}"
                f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            )
        return self

    model_config = {
        "env_file": str(ENV_FILE),
        "env_file_encoding": "utf-8",
        "extra": "ignore",  # Allow extra env vars without crashing
    }


# Single shared instance – import this everywhere
settings = Settings()
