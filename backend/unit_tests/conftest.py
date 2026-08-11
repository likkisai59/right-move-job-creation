import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add project root to sys.path
project_root = Path(__file__).resolve().parents[1]
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from app.core.database import Base, get_db
from app.main import app

# Import all models to register them with SQLAlchemy Base
from app.models import (
    job_requirement, candidate, candidate_edit_history, organization,
    job_candidate, employee, attendance as attendance_model, leave as leave_model,
    designation, business_unit, work_mode, exit_type, account
)

# Test Database URL
TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(test_engine):
    connection = test_engine.connect()
    transaction = connection.begin()
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    session = SessionLocal()
    
    # Seed default data
    seed_test_master_data(session)
    
    yield session
    
    session.close()
    try:
        if transaction.is_active:
            transaction.rollback()
    except Exception:
        pass
    connection.close()

def seed_test_master_data(db):
    from app.models.designation import Designation
    from app.models.business_unit import BusinessUnit
    from app.models.work_mode import WorkMode
    from app.models.exit_type import ExitType

    # Seed Designations
    if db.query(Designation).count() == 0:
        initial_names = [
            'Director', 'Sr.Manager', 'Manager', 'Asst Manager', 
            'Team Lead', 'ATL', 'Senior Executive', 'Executive', 
            'Trainee', 'Intern', 'HR'
        ]
        for name in initial_names:
            db.add(Designation(name=name, is_active=True))
        db.flush()

    # Seed Business Units
    if db.query(BusinessUnit).count() == 0:
        initial_bu = ['IT', 'HR', 'Sales', 'Marketing', 'Finance', 'Operations']
        for name in initial_bu:
            db.add(BusinessUnit(name=name, is_active=True))
        db.flush()

    # Seed Work Modes
    if db.query(WorkMode).count() == 0:
        initial_wm = ['WFH', 'Office', 'Hybrid']
        for name in initial_wm:
            db.add(WorkMode(name=name, is_active=True))
        db.flush()
        
    # Seed Exit Types
    if db.query(ExitType).count() == 0:
        initial_et = ['Resignation', 'Termination', 'Absconding', 'Retirement', 'Other']
        for name in initial_et:
            db.add(ExitType(name=name, is_active=True))
        db.flush()

    # Seed Default Super Admins (RM0011 & RM0013)
    from app.models.employee import Employee
    from app.core.security import get_password_hash
    from app.core.config import settings
    from datetime import date

    if db.query(Employee).filter(Employee.employee_id == "RM0011").count() == 0:
        sunmeet = Employee(
            employee_id="RM0011",
            first_name="Sunmeet",
            last_name="Singh",
            designation="Director",
            system_role="super_admin",
            status="Active",
            profile_status="Completed",
            completion_percentage=100,
            profile_status_hr="Completed",
            completion_percentage_hr=100,
            profile_status_admin="Completed",
            completion_percentage_admin=100,
            gender="Male",
            blood_group="O+",
            country_code="+91",
            email="sunmeet980@gmail.com",
            contact_number="9999999999",
            date_of_joining=date(2024, 1, 1),
            date_of_birth=date(1990, 1, 1),
            date=date(2024, 1, 1),
            permanent_address="Hyderabad",
            current_address="Hyderabad",
            assigned_business_unit="IT",
            reporting_to="Self",
            work_mode="Office",
            ctc=25.0,
            compliance="TDS",
            employee_password=get_password_hash(settings.SUPERADMIN_SUNMEET_PASS)
        )
        db.add(sunmeet)

    if db.query(Employee).filter(Employee.employee_id == "RM0013").count() == 0:
        saurabh = Employee(
            employee_id="RM0013",
            first_name="Saurabh",
            last_name="Jadge",
            designation="HR",
            system_role="super_admin",
            status="Active",
            profile_status="Completed",
            completion_percentage=100,
            profile_status_hr="Completed",
            completion_percentage_hr=100,
            profile_status_admin="Completed",
            completion_percentage_admin=100,
            gender="Male",
            blood_group="A+",
            country_code="+91",
            email="saurabh123@gmail.com",
            contact_number="8888888888",
            date_of_joining=date(2024, 1, 1),
            date_of_birth=date(1990, 1, 1),
            date=date(2024, 1, 1),
            permanent_address="Hyderabad",
            current_address="Hyderabad",
            assigned_business_unit="HR",
            reporting_to="Sunmeet Singh",
            work_mode="Office",
            ctc=8.0,
            compliance="TDS",
            employee_password=get_password_hash(settings.SUPERADMIN_SAURABH_PASS)
        )
        db.add(saurabh)
    db.flush()

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
