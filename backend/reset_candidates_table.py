import sys
import os
from sqlalchemy import create_engine, text

# Add the current directory to sys.path so we can import 'app'
sys.path.append(os.getcwd())

try:
    from app.core.config import settings
    # Create engine and connect
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        print("Dropping 'candidates' table to fix schema mismatch...")
        # Drop the table
        conn.execute(text("DROP TABLE IF EXISTS candidates"))
        print("✓ Candidates table dropped.")
        
        # We don't need to manually recreate it here because 
        # main.py does 'Base.metadata.create_all' on startup.
        
        conn.commit()
        print("\nReset complete. The table will be recreated automatically when the backend restarts.")
except Exception as e:
    print(f"✗ Error: {e}")
