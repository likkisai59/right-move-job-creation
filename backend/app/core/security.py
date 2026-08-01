import bcrypt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain text password against a stored bcrypt hash.
    Includes backwards compatibility for legacy plain-text stored passwords during transition.
    """
    if not plain_password or not hashed_password:
        return False
    
    # Check if the stored string is a bcrypt hash (starts with $2b$ or $2a$)
    if not hashed_password.startswith("$2b$") and not hashed_password.startswith("$2a$"):
        return plain_password.strip() == hashed_password.strip()
        
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """
    Hashes a plain text password using bcrypt algorithm.
    """
    if not password:
        return ""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')
