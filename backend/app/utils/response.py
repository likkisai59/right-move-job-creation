# utils/response.py
# ─────────────────────────────────────────────────────────────
# Reusable helpers that build consistent API response dicts.
#
# All routes use these helpers so every response has the same
# top-level structure:  { "success", "message", "data"/"errors" }
# ─────────────────────────────────────────────────────────────

from typing import Any, Optional


def success_response(message: str, data: Any = None) -> dict:
    """
    Build a standardized success response.

    Returns:
        {
            "success": true,
            "message": "...",
            "data": { ... }   ← None if not provided
        }
    """
    return {
        "success": True,
        "message": message,
        "data": data,
    }


def error_response(message: str, errors: Optional[list] = None) -> dict:
    """
    Build a standardized error response.

    Returns:
        {
            "success": false,
            "message": "...",
            "errors": [ { "field": "...", "message": "..." }, ... ]
        }
    """
    return {
        "success": False,
        "message": message,
        "errors": errors or [],
    }
