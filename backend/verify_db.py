import pymysql
conn = pymysql.connect(host='localhost', port=3306, user='root', password='Naresh@370', database='rightmove_crm')
cur = conn.cursor()
cur.execute('DESCRIBE candidates')
cols = {row[0] for row in cur.fetchall()}
required = [
    'candidate_code', 'business_unit', 'alternative_email',
    'alternative_contact_number', 'highest_qualification', 'current_designation',
    'employment_location', 'fixed_ctc', 'variable_ctc', 'source',
    'recruiter_name', 'lwd', 'comments'
]
missing = [c for c in required if c not in cols]
print('All columns:', sorted(cols))
print('MISSING:', missing if missing else 'None - all OK')
cur.execute("SHOW TABLES LIKE 'candidate_edit_history'")
print('Edit history table:', 'EXISTS' if cur.fetchone() else 'MISSING')
cur.close()
conn.close()
