"""
db_migration.py
Run once: python db_migration.py
"""
import pymysql

DB_HOST = "localhost"
DB_PORT = 3306
DB_NAME = "rightmove_crm"
DB_USER = "root"
DB_PASSWORD = "Naresh@370"

def run_migration():
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        autocommit=True,
    )
    cursor = conn.cursor()

    print("Starting migration...")

    def safe_alter(sql, description=""):
        try:
            cursor.execute(sql)
            print("  [OK] " + description)
        except pymysql.err.OperationalError as e:
            if e.args[0] == 1060:
                print("  [SKIP] Already exists: " + description)
            else:
                print("  [ERR] " + description + ": " + str(e))
                raise

    safe_alter("ALTER TABLE candidates ADD COLUMN alternative_email VARCHAR(255) NULL AFTER email_address", "alternative_email")
    safe_alter("ALTER TABLE candidates ADD COLUMN alternative_contact_number VARCHAR(20) NULL AFTER phone_number", "alternative_contact_number")
    safe_alter("ALTER TABLE candidates ADD COLUMN highest_qualification VARCHAR(255) NULL AFTER current_location", "highest_qualification")
    safe_alter("ALTER TABLE candidates ADD COLUMN business_unit VARCHAR(50) NULL DEFAULT 'IT' AFTER highest_qualification", "business_unit")
    safe_alter("ALTER TABLE candidates ADD COLUMN current_designation VARCHAR(255) NULL AFTER current_last_company", "current_designation")
    safe_alter("ALTER TABLE candidates ADD COLUMN lwd DATE NULL AFTER notice_period", "lwd")
    safe_alter("ALTER TABLE candidates ADD COLUMN employment_location VARCHAR(255) NULL AFTER lwd", "employment_location")
    safe_alter("ALTER TABLE candidates ADD COLUMN fixed_ctc VARCHAR(100) NULL AFTER current_ctc", "fixed_ctc")
    safe_alter("ALTER TABLE candidates ADD COLUMN variable_ctc VARCHAR(100) NULL AFTER fixed_ctc", "variable_ctc")
    safe_alter("ALTER TABLE candidates ADD COLUMN source VARCHAR(100) NULL AFTER reason_for_job_change", "source")
    safe_alter("ALTER TABLE candidates ADD COLUMN comments TEXT NULL AFTER source", "comments")
    safe_alter("ALTER TABLE candidates ADD COLUMN recruiter_name VARCHAR(255) NULL AFTER comments", "recruiter_name")

    try:
        cursor.execute("UPDATE candidates SET business_unit = business_category WHERE business_unit IS NULL OR business_unit = ''")
        print("  [OK] Migrated business_category -> business_unit (" + str(cursor.rowcount) + " rows)")
    except Exception as e:
        print("  [SKIP] business_category migration: " + str(e))

    try:
        cursor.execute("UPDATE candidates SET highest_qualification = highest_education WHERE highest_qualification IS NULL")
        print("  [OK] Migrated highest_education -> highest_qualification (" + str(cursor.rowcount) + " rows)")
    except Exception as e:
        print("  [SKIP] highest_education migration: " + str(e))

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS candidate_edit_history (
            id INT PRIMARY KEY AUTO_INCREMENT,
            candidate_id INT NOT NULL,
            updated_by VARCHAR(255) NULL,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            changed_fields TEXT NULL,
            previous_values TEXT NULL,
            new_values TEXT NULL,
            FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
        )
    """)
    print("  [OK] candidate_edit_history table ready")

    cursor.close()
    conn.close()
    print("Migration completed successfully.")

if __name__ == "__main__":
    run_migration()
