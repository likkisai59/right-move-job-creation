"""
app/utils/email_validator.py
Industry-standard email validation utility.
1. RFC 5322 syntax and format validation via `email-validator`
2. Algorithmic typo detection (Levenshtein distance) on common mail providers.
"""

import re
from typing import Optional

try:
    from email_validator import validate_email as py_validate_email, EmailNotValidError
except ImportError:
    py_validate_email = None
    class EmailNotValidError(Exception):
        pass

POPULAR_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"]


def levenshtein_distance(s1: str, s2: str) -> int:
    """Calculates edit distance between two strings."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]


def detect_domain_typo(domain: str) -> Optional[str]:
    """
    Checks if a domain is a close typo (distance <= 2) of a popular provider.
    Returns the suggested domain if a typo is detected, otherwise None.
    """
    domain = domain.lower().strip()
    if not domain or domain in POPULAR_DOMAINS:
        return None

    for pop in POPULAR_DOMAINS:
        if levenshtein_distance(domain, pop) <= 2:
            return pop
    return None


def validate_and_normalize_email(val: str, check_deliverability: bool = False) -> str:
    """
    Validates email format using RFC standards and checks for popular domain typos.
    Raises ValueError with a helpful message on error.
    """
    if not val or not str(val).strip():
        raise ValueError("Email address cannot be empty")

    val = str(val).strip()

    # Step 1: Check for obvious syntax flaws (consecutive dots, etc.)
    if ".." in val:
        raise ValueError("Enter a valid email address (e.g. user@example.com)")

    # Step 2: RFC Syntax & Deliverability Validation via email-validator (with regex fallback)
    if py_validate_email:
        try:
            email_info = py_validate_email(val, check_deliverability=check_deliverability)
            normalized = email_info.normalized
            domain = email_info.domain
        except EmailNotValidError as exc:
            raise ValueError(f"Enter a valid email address: {str(exc)}") from exc
    else:
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$", val):
            raise ValueError("Enter a valid email address (e.g. user@example.com)")
        normalized = val.lower()
        domain = val.split('@')[1].lower() if '@' in val else ''

    # Step 3: Algorithmic Typo Detection for popular providers
    suggested = detect_domain_typo(domain)
    if suggested:
        raise ValueError(f"Invalid email domain '{domain}'. Did you mean '{suggested}'?")

    return normalized
