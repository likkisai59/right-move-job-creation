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

    print("Starting employees table migration...")

    def safe_alter(sql, description=""):
        try:
            cursor.execute(sql)
            print("  [OK] " + description)
        except pymysql.err.OperationalError as e:
            if e.args[0] == 1060: # Error code for Duplicate column name
                print("  [SKIP] Already exists: " + description)
            else:
                print("  [ERR] " + description + ": " + str(e))
                # raise

    columns_to_add = [
        ("date_of_birth", "DATE NULL"),
        ("contact_number_office", "VARCHAR(255) NULL"),
        ("emergency_contact_number", "VARCHAR(255) NULL"),
        ("aadhar_number", "VARCHAR(255) NULL"),
        ("aadhar_url", "VARCHAR(255) NULL"),
        ("pan_number", "VARCHAR(255) NULL"),
        ("pan_url", "VARCHAR(255) NULL"),
        ("marksheet_10th_url", "VARCHAR(255) NULL"),
        ("marksheet_12th_url", "VARCHAR(255) NULL"),
        ("marksheet_graduation_url", "VARCHAR(255) NULL"),
        ("present_address_proof_url", "VARCHAR(255) NULL"),
        ("permanent_address_proof_url", "VARCHAR(255) NULL"),
        ("photo_url", "VARCHAR(255) NULL"),
        ("medical_condition", "VARCHAR(255) NULL"),
        ("resume_url", "VARCHAR(255) NULL"),
        ("salary_slips_url", "VARCHAR(255) NULL"),
        ("offer_letter_url", "VARCHAR(255) NULL"),
        ("last_company_name", "VARCHAR(255) NULL"),
        ("bank_name", "VARCHAR(255) NULL"), # changed from NOT NULL to NULL for migration to not break existing rows
        ("bank_account_number", "VARCHAR(255) NULL"),
        ("bank_ifsc_code", "VARCHAR(100) NULL"),
        ("assigned_business_unit", "VARCHAR(255) NULL"),
        ("reporting_to", "VARCHAR(255) NULL"),
        ("work_mode", "VARCHAR(255) NULL"),
        ("ctc", "FLOAT NULL"),
        ("compliance", "VARCHAR(255) NULL"),
        ("system_assigned", "VARCHAR(50) NULL"),
        ("sim_card_assigned", "VARCHAR(50) NULL"),
        ("email_id_configured", "VARCHAR(50) NULL"),
        ("linkedin_configured", "VARCHAR(50) NULL"),
        ("google_sheet_configured", "VARCHAR(50) NULL"),
        ("whatsapp_business_configured", "VARCHAR(50) NULL")
    ]

    for col_name, col_type in columns_to_add:
        sql = f"ALTER TABLE employees ADD COLUMN {col_name} {col_type}"
        safe_alter(sql, f"Added column {col_name}")

    cursor.close()
    conn.close()
    print("Migration completed successfully.")

if __name__ == "__main__":
    run_migration()
