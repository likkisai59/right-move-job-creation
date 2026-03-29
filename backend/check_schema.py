import sys
import os
from sqlalchemy import create_engine, text

sys.path.append(os.getcwd())

try:
    from app.core.config import settings
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        print("--- Table: jobs ---")
        result = conn.execute(text("DESCRIBE jobs"))
        for row in result:
            print(row)
            
        print("\n--- Table: job_requirements ---")
        result = conn.execute(text("DESCRIBE job_requirements"))
        for row in result:
            print(row)
except Exception as e:
    print(f"✗ ERROR: {e}")
