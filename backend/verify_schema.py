import sys
import os
from sqlalchemy import create_engine, text

sys.path.append(os.getcwd())

try:
    from app.core.config import settings
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        print("--- Table: organizations ---")
        result = conn.execute(text("DESCRIBE organizations"))
        for row in result:
            print(row)
except Exception as e:
    print(f"ERROR: {e}")
