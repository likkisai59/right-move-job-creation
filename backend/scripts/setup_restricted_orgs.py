import sys
import os
from sqlalchemy.orm import Session
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal, engine, Base
from app.models.organization import Organization
from app.services.organization_service import ALLOWED_ORGANIZATIONS, generate_organization_id

def setup():
    db: Session = SessionLocal()
    try:
        # PART 1: CLEAN DATABASE
        print("Cleaning organizations table...")
        db.execute(text("DELETE FROM organizations"))
        db.commit()
        
        # Reset auto-increment if possible (standard SQL)
        try:
            db.execute(text("ALTER TABLE organizations AUTO_INCREMENT = 1"))
            db.commit()
        except:
            pass # Ignore if not supported

        print(f"Seeding {len(ALLOWED_ORGANIZATIONS)} organizations...")
        
        # PART 2: INSERT ONLY GIVEN COMPANIES
        imported_count = 0
        
        # Sort for consistent IDs
        sorted_orgs = sorted(list(ALLOWED_ORGANIZATIONS))
        
        for org_name in sorted_orgs:
            org_id = generate_organization_id(db)
            
            new_org = Organization(
                organization_id=org_id,
                organization_name=org_name.strip(),
                status='in_progress',
                commission_percentage=0.0,
                is_active=1
            )
            db.add(new_org)
            db.commit()
            db.refresh(new_org)
            imported_count += 1
            if imported_count % 10 == 0:
                print(f"Imported {imported_count} organizations...")

        print(f"\nSetup Complete!")
        print(f"Total Restricted Organizations: {imported_count}")

    except Exception as e:
        print(f"Error during setup: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Ensure tables are created first (in case model changed)
    # Note: create_all doesn't update existing tables. 
    # If is_active column is missing, this script will fail.
    # We should add the column via raw SQL if it doesn't exist.
    
    db = SessionLocal()
    try:
        print("Checking for is_active column...")
        db.execute(text("SELECT is_active FROM organizations LIMIT 1"))
    except Exception:
        print("Adding is_active column...")
        db.rollback()
        try:
            db.execute(text("ALTER TABLE organizations ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1"))
            db.commit()
        except Exception as e:
            print(f"Could not add column: {e}")
    finally:
        db.close()

    setup()
