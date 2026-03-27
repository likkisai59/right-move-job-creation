import sys
import os
from sqlalchemy import create_engine, text

# Add the current directory to sys.path so we can import 'app'
sys.path.append(os.getcwd())

try:
    from app.core.config import settings
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        print("--- Candidates Table Columns ---")
        # For MySQL, use DESCRIBE
        result = conn.execute(text("DESCRIBE candidates"))
        for row in result:
            print(row)
except Exception as e:
    print(f"✗ ERROR: {e}")
