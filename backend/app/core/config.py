# core/config.py
# ─────────────────────────────────────────────────────────────
# Reads environment variables (from .env file) and exposes
# a clean Settings object used across the application.
# ─────────────────────────────────────────────────────────────

from urllib.parse import quote_plus
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "rightmove_crm"
    DB_USER: str = "root"
    DB_PASSWORD: str = ""

    # App
    APP_NAME: str = "Right Move CRM"
    APP_ENV: str = "development"

    @property
    def DATABASE_URL(self) -> str:
        """
        Builds the SQLAlchemy-compatible MySQL connection string.
        Uses quote_plus() to safely encode special characters in the password
        (e.g. @, #, $ are common in passwords and break URL parsing).
        """
        safe_password = quote_plus(self.DB_PASSWORD)
        return (
            f"mysql+pymysql://{self.DB_USER}:{safe_password}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


# Single shared instance – import this everywhere
settings = Settings()
