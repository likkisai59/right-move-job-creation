import json
import io
import re
import os
import logging
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any
from fastapi import UploadFile
import docx
import PyPDF2
from app.core.config import settings

# Setup logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    ch.setFormatter(formatter)
    logger.addHandler(ch)

# ── Optional Local NLP (spaCy) ────────────────────────────────────────────────
_nlp = None
def get_spacy_nlp():
    """Lazily load spaCy model once."""
    global _nlp
    if _nlp is None:
        try:
            import spacy
            _nlp = spacy.load("en_core_web_sm")
            logger.info("[Resume Parser] spaCy NLP (en_core_web_sm) loaded successfully.")
        except Exception as e:
            logger.warning(f"[Resume Parser] spaCy model not loaded: {e}. Using pure rule-based NLP.")
            _nlp = False
    return _nlp if _nlp else None


# ── Text Extraction ──────────────────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts text using pdfplumber first (preserves 2-column layout and reading order).
    Falls back to PyPDF2 if pdfplumber is unavailable or fails.
    """
    text = ""
    # Attempt 1: pdfplumber (best for multi-column resumes)
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            pages_text = []
            for page in pdf.pages:
                page_t = page.extract_text(layout=True) or page.extract_text()
                if page_t:
                    pages_text.append(page_t)
            text = "\n".join(pages_text)
            if text.strip():
                logger.info(f"[Resume Parser] Extracted {len(text)} chars using pdfplumber.")
                return text
    except Exception as e:
        logger.warning(f"[Resume Parser] pdfplumber extraction failed/unavailable: {e}. Falling back to PyPDF2.")

    # Attempt 2: PyPDF2 fallback
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        pages_text = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                pages_text.append(t)
        text = "\n".join(pages_text)
        logger.info(f"[Resume Parser] Extracted {len(text)} chars using PyPDF2.")
        return text
    except Exception as e:
        logger.error(f"[Resume Parser] PyPDF2 extraction also failed: {e}")
        return ""

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extracts text from paragraphs as well as tables in docx files."""
    doc = docx.Document(io.BytesIO(file_bytes))
    parts = []
    for p in doc.paragraphs:
        if p.text.strip():
            parts.append(p.text.strip())
    # Also extract text from tables
    for table in doc.tables:
        for row in table.rows:
            row_text = " | ".join([cell.text.strip() for cell in row.cells if cell.text.strip()])
            if row_text:
                parts.append(row_text)
    return "\n".join(parts)


# ── Curated Skills Database ──────────────────────────────────────────────────

IT_SKILLS = [
    # Languages
    "Python", "Java", "JavaScript", "TypeScript", "C#", "C++", "C", "Go", "Golang", "Rust", "Swift", "Kotlin",
    "PHP", "Ruby", "R", "Dart", "Scala", "Shell Scripting", "Bash", "PowerShell", "Perl",
    # Frontend
    "React", "React.js", "Angular", "Vue", "Vue.js", "Next.js", "Nuxt.js", "Svelte", "Redux", "Zustand", "MobX",
    "HTML", "HTML5", "CSS", "CSS3", "SASS", "SCSS", "Bootstrap", "Tailwind CSS", "Tailwind", "Material UI", "jQuery",
    # Backend & Frameworks
    "Node.js", "Express", "Express.js", "NestJS", "FastAPI", "Django", "Flask", "Spring Boot", "Spring",
    "Hibernate", ".NET", ".NET Core", "ASP.NET", "Laravel", "Ruby on Rails", "Rails", "Fastify",
    # Databases & Caching
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite", "Oracle", "MSSQL", "SQL Server", "Cassandra",
    "DynamoDB", "Elasticsearch", "CouchDB", "Neo4j", "MariaDB", "Supabase", "Firebase",
    # Cloud, DevOps & Infra
    "AWS", "Amazon Web Services", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "K8s", "Terraform",
    "Ansible", "Jenkins", "CI/CD", "GitHub Actions", "GitLab CI", "Linux", "Unix", "Git", "GitHub", "GitLab",
    "Nginx", "Apache", "Helm", "Prometheus", "Grafana",
    # APIs & Architectures
    "REST", "REST API", "GraphQL", "gRPC", "Microservices", "Serverless", "Event Driven Architecture", "Kafka",
    "RabbitMQ", "ActiveMQ", "WebSockets", "Celery",
    # AI / ML / Data
    "Machine Learning", "Deep Learning", "Data Science", "Artificial Intelligence", "AI", "NLP", "Computer Vision",
    "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "Pandas", "NumPy", "OpenAI", "HuggingFace", "LangChain",
    "LLM", "Data Analysis", "Power BI", "Tableau", "Snowflake", "Databricks", "Apache Spark", "Hadoop", "Airflow",
    # Mobile
    "Flutter", "React Native", "Android", "iOS",
    # Testing & QA
    "Selenium", "Playwright", "Cypress", "Jest", "Mocha", "PyTest", "JUnit", "Postman", "Swagger", "JMeter",
    # Project & Management
    "Agile", "Scrum", "Jira", "Confluence"
]

BPO_SKILLS = [
    "Voice Process", "Customer Support", "Customer Service", "BPO", "Call Center", "Inbound", "Outbound",
    "Client Relationship", "Tele-calling", "Technical Support", "Chat Support", "Escalation Management",
    "Helpdesk", "CRM", "Zendesk", "Salesforce CRM"
]

FA_SKILLS = [
    "Accounts", "Finance", "Taxation", "Tally", "Tally Prime", "GST", "Bookkeeping", "Audit", "Auditing",
    "Accountant", "Financial Analysis", "Income Tax", "TDS", "Balance Sheet", "P&L", "Accounts Payable",
    "Accounts Receivable", "Payroll", "SAP FICO", "QuickBooks", "Excel", "MIS Reporting"
]


# ── Section Splitter ──────────────────────────────────────────────────────────

SECTION_PATTERNS = {
    "SUMMARY": re.compile(r'^(?:professional\s+summary|career\s+objective|summary|profile|about\s+me|objective)\b', re.I),
    "EXPERIENCE": re.compile(r'^(?:work\s+experience|professional\s+experience|employment\s+history|experience|work\s+history|career\s+history)\b', re.I),
    "EDUCATION": re.compile(r'^(?:education|academic\s+qualifications|academics|educational\s+background|qualifications)\b', re.I),
    "SKILLS": re.compile(r'^(?:technical\s+skills|core\s+competencies|key\s+skills|skills\s+and\s+tools|skills|technologies|expertise)\b', re.I),
    "PROJECTS": re.compile(r'^(?:projects|academic\s+projects|key\s+projects|personal\s+projects)\b', re.I),
    "CONTACT": re.compile(r'^(?:contact|contact\s+details|personal\s+details|personal\s+information)\b', re.I),
}

def segment_sections(text: str) -> Dict[str, str]:
    """Segments resume text into distinct logical blocks based on headings."""
    lines = text.splitlines()
    sections: Dict[str, List[str]] = {
        "HEADER": [],
        "SUMMARY": [],
        "EXPERIENCE": [],
        "EDUCATION": [],
        "SKILLS": [],
        "PROJECTS": [],
        "CONTACT": [],
        "OTHER": []
    }
    
    current_section = "HEADER"
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        
        # Check if line is a section heading (short line, matches heading pattern)
        is_heading = False
        if len(stripped.split()) <= 4:
            for sec_name, pattern in SECTION_PATTERNS.items():
                if pattern.match(stripped) or pattern.match(re.sub(r'[^A-Za-z\s]', '', stripped).strip()):
                    current_section = sec_name
                    is_heading = True
                    break
        
        if not is_heading:
            sections[current_section].append(stripped)
            
    return {k: "\n".join(v) for k, v in sections.items()}


# ── Smart Information Extractors ──────────────────────────────────────────────

def extract_candidate_name(text: str, header_text: str, email: str = "") -> Tuple[str, str]:
    """
    Extracts first and last name with multi-stage verification:
    1. spaCy NER on top lines / header block.
    2. Email-based token correlation.
    3. Structural text heuristics filtering job titles, dates, cities, headers.
    """
    ignored_words = {
        "resume", "curriculum", "vitae", "cv", "profile", "bio-data", "biodata", "personal", "details",
        "contact", "summary", "objective", "experience", "education", "skills", "projects", "certifications",
        "software", "engineer", "developer", "senior", "junior", "lead", "architect", "full", "stack", "frontend",
        "backend", "manager", "intern", "associate", "analyst", "consultant", "phone", "email", "address", "page"
    }

    known_locations = {
        "hyderabad", "bangalore", "bengaluru", "chennai", "pune", "mumbai", "delhi", "noida",
        "gurgaon", "gurugram", "kolkata", "ahmedabad", "kochi", "jaipur", "telangana", "andhra",
        "pradesh", "karnataka", "tamil", "nadu", "maharashtra", "india", "usa", "uk"
    }

    # Extract name candidate tokens from email if available (e.g. rahul.sharma99@gmail.com -> ['rahul', 'sharma'])
    email_name_tokens = []
    if email and '@' in email:
        username = email.split('@')[0]
        email_name_tokens = [t.lower() for t in re.split(r'[._\-0-9]', username) if len(t) >= 2 and t.isalpha()]

    # Stage 1: Try spaCy PERSON NER on the first 1000 characters
    nlp = get_spacy_nlp()
    if nlp:
        try:
            head_sample = (header_text or text[:1200])
            doc = nlp(head_sample[:1000])
            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    clean_ent = re.sub(r'[^A-Za-z\s]', '', ent.text).strip()
                    raw_parts = clean_ent.split()
                    parts = [p for p in raw_parts if p.lower() not in ignored_words and p.lower() not in known_locations]
                    if 1 <= len(parts) <= 4:
                        first_name = parts[0].capitalize()
                        last_name = " ".join([p.capitalize() for p in parts[1:]])
                        return first_name, last_name
        except Exception as e:
            logger.debug(f"[Resume Parser] spaCy name extraction fallback: {e}")

    # Stage 2: Structural Line Scanning in Top 15 lines
    lines = [l.strip() for l in (header_text or text).splitlines() if l.strip()]
    for line in lines[:15]:
        clean_line = re.sub(r'[^A-Za-z\s]', '', line).strip()
        raw_parts = clean_line.split()
        parts = [p for p in raw_parts if p.lower() not in ignored_words and p.lower() not in known_locations]
        if 1 <= len(parts) <= 4:
            if '@' in line or any(c.isdigit() for c in line):
                continue
            
            # Check length of first token
            if len(parts[0]) > 1:
                first_name = parts[0].capitalize()
                last_name = " ".join([p.capitalize() for p in parts[1:]])
                return first_name, last_name

    # Stage 3: Fallback using email username
    if len(email_name_tokens) >= 2:
        return email_name_tokens[0].capitalize(), " ".join([t.capitalize() for t in email_name_tokens[1:]])
    elif len(email_name_tokens) == 1:
        return email_name_tokens[0].capitalize(), ""

    return "", ""


def calculate_experience_from_dates(exp_text: str) -> Optional[float]:
    """
    Parses date intervals (e.g. 'Jan 2021 - Present', '06/2018 to 12/2020', '2019 - 2023')
    from the experience section and computes cumulative work tenure in years.
    """
    if not exp_text:
        return None

    month_map = {
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
        'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12,
        'january': 1, 'february': 2, 'march': 3, 'april': 4, 'june': 6,
        'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12
    }

    date_regex = re.compile(
        r'(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s./\-]*)?(\b20\d{2}\b|\b19\d{2}\b)'
        r'\s*(?:[-–—to]+)\s*'
        r'(?:(Present|Current|Till\s*Date|Now)|(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s./\-]*)?(\b20\d{2}\b|\b19\d{2}\b))',
        re.IGNORECASE
    )

    matches = date_regex.findall(exp_text)
    if not matches:
        return None

    now = datetime.now()
    intervals = []

    for m in matches:
        start_m_str, start_y_str, is_present, end_m_str, end_y_str = m
        try:
            start_y = int(start_y_str)
            start_m = month_map.get(start_m_str.lower(), 1) if start_m_str else 1
            start_date = datetime(start_y, start_m, 1)

            if is_present:
                end_date = now
            else:
                end_y = int(end_y_str)
                end_m = month_map.get(end_m_str.lower(), 12) if end_m_str else 12
                end_date = datetime(end_y, end_m, 1)

            if start_date <= end_date and (end_date.year - start_date.year) <= 40:
                intervals.append((start_date, end_date))
        except Exception:
            continue

    if not intervals:
        return None

    # Sort and merge overlapping intervals
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for current in intervals[1:]:
        prev_start, prev_end = merged[-1]
        if current[0] <= prev_end:
            merged[-1] = (prev_start, max(prev_end, current[1]))
        else:
            merged.append(current)

    total_months = 0
    for s, e in merged:
        total_months += (e.year - s.year) * 12 + (e.month - s.month)

    years = round(total_months / 12, 1)
    return years if years > 0 else None


def extract_experience(text: str, exp_text: str) -> str:
    """Combines explicit regex matches, fresher indicators, and calculated date ranges."""
    # Check fresher keyword
    if re.search(r'\b(?:fresher|entry\s*level|intern|student)\b', text[:2000], re.IGNORECASE) and not re.search(r'\b\d+\+?\s*(?:years?|yrs?)\b', text, re.IGNORECASE):
        return "fresher"

    # Explicit format: "X years Y months"
    ym_match = re.search(r'(\d+)\s*(?:years?|yrs?)\s*(?:and\s+)?(\d+)\s*(?:months?|mos?)', text, re.IGNORECASE)
    if ym_match:
        yrs = int(ym_match.group(1)) + round(int(ym_match.group(2)) / 12, 1)
        return f"{yrs:g} years"

    # Explicit format: "X+ years of experience" or "Total Exp: X yrs"
    exp_match = re.search(r'(?:total\s*(?:exp|experience)[:\s]*)?(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?|yr)\b(?:\s*(?:of\s+)?(?:experience|exp))?', text, re.IGNORECASE)
    if exp_match:
        years = float(exp_match.group(1))
        if years == 0:
            return "fresher"
        return f"{years:g} years"

    # Calculate from work dates
    calc_years = calculate_experience_from_dates(exp_text or text)
    if calc_years is not None:
        if calc_years == 0:
            return "fresher"
        return f"{calc_years:g} years"

    return ""


def extract_current_company_and_designation(exp_text: str, full_text: str) -> Tuple[str, str]:
    """
    Extracts current job designation and employer from the EXPERIENCE section
    using pattern heuristics and spaCy ORG entity detection.
    """
    target_text = exp_text if len(exp_text.strip()) > 30 else full_text
    nlp = get_spacy_nlp()
    
    # Common designation prefixes
    title_regex = re.compile(
        r'\b(?:Senior|Junior|Lead|Associate|Staff|Principal|Head|Director|Chief|Consultant|Executive|Manager|Architect|Engineer|Developer|Analyst|Specialist|Intern|Trainee|Officer)\b',
        re.I
    )

    lines = [l.strip() for l in target_text.splitlines() if l.strip()]
    
    # Pattern 1: "<Designation> at / @ / in <Company>"
    for line in lines[:10]:
        m = re.search(r'^([A-Z][A-Za-z\s/]{2,40})\s+(?:at|@|in|with)\s+([A-Z0-9][A-Za-z0-9\s&.,\-]{2,50})(?:\s*\(.*|\s*[-–|].*)?$', line)
        if m:
            desg, comp = m.group(1).strip(), m.group(2).strip()
            # Clean trailing prepositions
            comp = re.sub(r'\s+(?:since|from|during|present|\d{4}).*$', '', comp, flags=re.I).strip()
            if len(comp) > 2 and len(desg) > 2:
                return comp, desg

    # Pattern 2: "<Designation> | / - <Company>"
    for line in lines[:10]:
        if any(sep in line for sep in ['|', '–', '-', '—']):
            parts = [p.strip() for p in re.split(r'[|–—\-]', line) if p.strip()]
            if len(parts) >= 2:
                if title_regex.search(parts[0]) and not title_regex.search(parts[1]):
                    return parts[1], parts[0]
                elif title_regex.search(parts[1]) and not title_regex.search(parts[0]):
                    return parts[0], parts[1]

    # Pattern 3: Use spaCy NER for ORG (Company) in experience section
    if nlp and exp_text:
        try:
            doc = nlp(exp_text[:1000])
            orgs = [ent.text.strip() for ent in doc.ents if ent.label_ == "ORG" and len(ent.text.strip()) > 2]
            if orgs:
                company = orgs[0]
                # Look for designation in line before or on the company line
                for line in lines[:8]:
                    if company.lower() in line.lower():
                        clean_desg = line.replace(company, '').strip(' -|,@')
                        if clean_desg and len(clean_desg) > 3 and title_regex.search(clean_desg):
                            return company, clean_desg
                return company, ""
        except Exception:
            pass

    return "", ""


def extract_skills(text: str, skills_section_text: str) -> List[str]:
    """
    Extracts skills by:
    1. Parsing comma/bullet separated tokens directly from the candidate's SKILLS section.
    2. Comprehensive matching against IT, BPO, and F&A dictionaries.
    """
    found_skills = set()

    # Strategy 1: Dictionary lookup on full text
    for skill in IT_SKILLS + BPO_SKILLS + FA_SKILLS:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text, re.IGNORECASE):
            found_skills.add(skill)

    # Strategy 2: Parse raw items from candidate's own SKILLS section
    if skills_section_text:
        # Split on commas, bullets, pipes, newlines
        tokens = re.split(r'[,•|/\n\t*–\\]+', skills_section_text)
        for token in tokens:
            clean_token = token.strip()
            # Clean common prefixes like "Languages:", "Frontend:"
            if ':' in clean_token:
                clean_token = clean_token.split(':', 1)[1].strip()
            
            if 2 <= len(clean_token) <= 30 and not any(char in clean_token for char in ['@', 'http', '{', '}', '=']):
                # If it resembles a known skill or programming word
                if clean_token.lower() in [s.lower() for s in IT_SKILLS + BPO_SKILLS + FA_SKILLS]:
                    # Match canonical casing
                    for canonical in (IT_SKILLS + BPO_SKILLS + FA_SKILLS):
                        if canonical.lower() == clean_token.lower():
                            found_skills.add(canonical)
                            break
                elif len(clean_token.split()) <= 3 and re.match(r'^[A-Za-z0-9\s#.+]+$', clean_token):
                    # Reasonable skill title directly from candidate's skills list
                    if not re.search(r'\b(experience|worked|good|knowledge|understanding|basic|expert)\b', clean_token, re.I):
                        found_skills.add(clean_token.title())

    # Limit to top 25 skills to keep payload concise
    return sorted(list(found_skills), key=lambda x: (x not in IT_SKILLS, x))[:25]


def extract_location(text: str, header_text: str) -> str:
    """Extracts city/location using pattern match, known tech hubs, and spaCy GPE detection."""
    # Pattern match
    loc_match = re.search(r'(?:Location|Address|Based\s+in|Current\s+City|City)[:\s]+([A-Za-z\s,]+?)(?:\n|$|,)', text, re.IGNORECASE)
    if loc_match:
        loc = loc_match.group(1).strip()
        if 2 <= len(loc) <= 30 and not re.search(r'\d', loc):
            return loc.title()

    # Common major tech hubs / cities in India & Global
    common_cities = [
        "Hyderabad", "Bangalore", "Bengaluru", "Chennai", "Pune", "Mumbai", "Delhi",
        "Noida", "Gurgaon", "Gurugram", "Kolkata", "Ahmedabad", "Kochi", "Jaipur",
        "Chandigarh", "Coimbatore", "Indore", "Bhubaneswar", "Visakhapatnam", "Trivandrum"
    ]
    for city in common_cities:
        if re.search(r'\b' + city + r'\b', (header_text or text[:2000]), re.IGNORECASE):
            return city

    # spaCy GPE (Geopolitical Entity) in Header
    nlp = get_spacy_nlp()
    if nlp:
        try:
            doc = nlp((header_text or text[:1000]))
            for ent in doc.ents:
                if ent.label_ == "GPE" and len(ent.text.strip()) > 2:
                    return ent.text.strip().title()
        except Exception:
            pass

    return ""


def predict_business_unit(skills_list: List[str], text: str) -> str:
    """Classifies candidate into IT, F&A, BPO, or ITES."""
    text_lower = text.lower()
    if any(k in text_lower for k in FA_SKILLS):
        return "F&A"
    if any(k in text_lower for k in BPO_SKILLS):
        return "BPO"
    if any(s in IT_SKILLS for s in skills_list):
        return "IT"
    return "IT"


def generate_summary(data: dict) -> str:
    """Generates a professional 1-2 sentence candidate summary."""
    exp = data.get("total_experience", "")
    skills = data.get("skills", [])
    designation = data.get("current_designation", "")
    company = data.get("current_company", "")

    skill_str = ", ".join(skills[:5]) if skills else ""
    
    if exp == "fresher" or exp == "0":
        if skill_str:
            return f"Fresher skilled in {skill_str}."
        return "Fresher candidate looking for opportunities."
    elif exp:
        clean_exp = str(exp).lower().replace("years", "").replace("year", "").replace("yrs", "").strip()
        yr_label = f"{clean_exp} year{'s' if clean_exp != '1' else ''}"
        parts = []
        if designation:
            parts.append(f"{yr_label} experienced {designation}")
        else:
            parts.append(f"{yr_label} experienced professional")
        if company:
            parts.append(f" at {company}")
        if skill_str:
            parts.append(f" with expertise in {skill_str}")
        return "".join(parts) + "."
    return ""


# ── Smart Rule & Section Based Parser ─────────────────────────────────────────

def smart_parse(text: str) -> dict:
    """
    Main parsing engine utilizing:
    - Section segmentation
    - spaCy NLP Named Entity Recognition
    - Tenure/Date calculation
    - Cross-validated Name & Employer matching
    """
    data = {
        "first_name": "", "last_name": "", "email": "", "phone": "",
        "alternative_email": "", "alternative_phone": "",
        "current_location": "", "highest_qualification": "",
        "current_company": "", "current_designation": "",
        "total_experience": "", "skills": [],
        "notice_period": "", "current_ctc": "", "expected_ctc": "",
        "business_unit": "IT", "candidate_summary": "", "confidence": 0,
    }

    # 1. Segment Text into Sections
    sections = segment_sections(text)
    header_text = sections.get("HEADER", "")
    exp_text = sections.get("EXPERIENCE", "")
    edu_text = sections.get("EDUCATION", "")
    skills_text = sections.get("SKILLS", "")

    # 2. Extract Emails
    emails = re.findall(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', text)
    personal_pattern = re.compile(r'@(gmail|yahoo|hotmail|outlook|rediffmail|icloud|proton)\.', re.I)
    personal_emails = [e for e in emails if personal_pattern.search(e)]
    other_emails = [e for e in emails if not personal_pattern.search(e)]
    unique_emails = []
    for e in personal_emails + other_emails:
        if e.lower() not in [x.lower() for x in unique_emails]:
            unique_emails.append(e)
            
    if unique_emails:
        data["email"] = unique_emails[0]
    if len(unique_emails) > 1:
        data["alternative_email"] = unique_emails[1]

    # 3. Extract Phones
    raw_phones = re.findall(r'(?:\+?91[\s\-.]?|0091[\s\-.]?|091[\s\-.]?)?[6-9](?:[\s\-.]?\d){9}', text)
    clean_phones = []
    for p in raw_phones:
        c = re.sub(r'[\s\-.]', '', p)
        c = re.sub(r'^(\+91|0091|091|91)', '', c)
        c = c[-10:]
        if len(c) == 10 and c[0] in '6789' and c not in clean_phones:
            clean_phones.append(c)
    if clean_phones:
        data["phone"] = clean_phones[0]
    if len(clean_phones) > 1:
        data["alternative_phone"] = clean_phones[1]

    # 4. Extract Name
    first_name, last_name = extract_candidate_name(text, header_text, data["email"])
    data["first_name"] = first_name
    data["last_name"] = last_name

    # 5. Extract Experience
    data["total_experience"] = extract_experience(text, exp_text)

    # 6. Extract Skills
    data["skills"] = extract_skills(text, skills_text)

    # 7. Extract Qualification
    qual_patterns = [
        r'\b(?:Bachelor\s+of\s+Technology|B\.?\s*Tech)\b[^,\n]*',
        r'\b(?:Bachelor\s+of\s+Engineering|B\.?\s*E\.?)\b[^,\n]*',
        r'\b(?:Master\s+of\s+Technology|M\.?\s*Tech)\b[^,\n]*',
        r'\b(?:Master\s+of\s+Engineering|M\.?\s*E\.?)\b[^,\n]*',
        r'\b(?:Master\s+of\s+Computer\s+Applications|MCA)\b[^,\n]*',
        r'\b(?:Bachelor\s+of\s+Computer\s+Applications|BCA)\b[^,\n]*',
        r'\b(?:Master\s+of\s+Business\s+Administration|MBA)\b[^,\n]*',
        r'\b(?:Bachelor\s+of\s+Science|B\.?\s*Sc)\b[^,\n]*',
        r'\b(?:Master\s+of\s+Science|M\.?\s*Sc)\b[^,\n]*',
        r'\b(?:Bachelor\s+of\s+Commerce|B\.?\s*Com)\b[^,\n]*',
        r'\b(?:Doctor\s+of\s+Philosophy|Ph\.?\s*D)\b[^,\n]*',
        r'\bDiploma\b[^,\n]*',
        r'\b(?:Higher\s+Secondary|Intermediate|12th)\b[^,\n]*',
        r'\b(?:Secondary\s+School|SSC|10th)\b[^,\n]*',
        r'\b(?:Bachelor|Master|Degree)\b[^,\n]*',
    ]
    target_edu = edu_text if edu_text else text
    for q_pat in qual_patterns:
        qual_match = re.search(q_pat, target_edu, re.IGNORECASE)
        if qual_match:
            data["highest_qualification"] = qual_match.group(0).strip()
            break

    # 8. Notice Period
    notice_match = re.search(r'(?:Notice\s*Period|Availability)[:\s]*([^\n,]+)', text, re.IGNORECASE)
    if notice_match:
        nr = notice_match.group(1).strip().lower()
        if 'immediate' in nr: data["notice_period"] = "Immediate"
        elif 'serving' in nr or 'current' in nr: data["notice_period"] = "Currently Serving"
        elif '15' in nr: data["notice_period"] = "15 Days"
        elif '30' in nr or '1 month' in nr: data["notice_period"] = "30 Days"
        elif '45' in nr: data["notice_period"] = "45 Days"
        elif '60' in nr or '2 month' in nr: data["notice_period"] = "60 Days"
        elif '90' in nr or '3 month' in nr: data["notice_period"] = "90 Days"

    # 9. CTC
    ctc_match = re.search(r'(?:Current\s*CTC|CTC)[:\s]*(\d+(?:\.\d+)?)\s*(?:LPA|L|Lakhs?)?', text, re.IGNORECASE)
    if ctc_match:
        data["current_ctc"] = ctc_match.group(1)
    exp_ctc_match = re.search(r'(?:Expected\s*CTC)[:\s]*(\d+(?:\.\d+)?)', text, re.IGNORECASE)
    if exp_ctc_match:
        data["expected_ctc"] = exp_ctc_match.group(1)

    # 10. Company & Designation
    company, designation = extract_current_company_and_designation(exp_text, text)
    data["current_company"] = company
    data["current_designation"] = designation

    # 11. Location
    data["current_location"] = extract_location(text, header_text)

    # 12. Business Unit
    data["business_unit"] = predict_business_unit(data["skills"], text)

    # 13. Summary
    data["candidate_summary"] = generate_summary(data)

    # 14. Confidence Score
    scored_fields = ["first_name", "email", "phone", "total_experience", "current_designation", "skills", "highest_qualification", "current_location"]
    filled = sum(1 for f in scored_fields if data.get(f) and (data[f] != [] if isinstance(data[f], list) else True))
    data["confidence"] = round((filled / len(scored_fields)) * 100)

    return data


# ── Gemini AI Parser (Optional LLM Layer) ────────────────────────────────────

EXTRACTION_PROMPT = """
You are an expert ATS AI agent. Read this resume carefully and extract the information below.
Return ONLY a raw JSON object — no markdown, no code fences, no explanation.

Required JSON structure:
{
    "first_name": "",
    "last_name": "",
    "email": "",
    "phone": "",
    "alternative_email": "",
    "alternative_phone": "",
    "current_location": "",
    "highest_qualification": "",
    "current_company": "",
    "current_designation": "",
    "total_experience": "",
    "skills": [],
    "notice_period": "",
    "current_ctc": "",
    "expected_ctc": "",
    "business_unit": "",
    "candidate_summary": ""
}
"""

async def parse_with_gemini(text_or_bytes, is_pdf: bool) -> dict:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.VITE_GEMINI_API_KEY)
    models_to_try = ["gemini-2.0-flash-lite", "gemini-flash-lite-latest", "gemini-2.0-flash"]

    for model_name in models_to_try:
        try:
            logger.info(f"[Resume Parser] Trying Gemini model: {model_name}")
            if is_pdf:
                contents = [
                    types.Part.from_bytes(data=text_or_bytes, mime_type="application/pdf"),
                    EXTRACTION_PROMPT,
                ]
            else:
                contents = [EXTRACTION_PROMPT, f"\nResume Text:\n{text_or_bytes[:15000]}"]

            response = client.models.generate_content(model=model_name, contents=contents)
            response_text = response.text.strip()

            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]

            parsed = json.loads(response_text.strip())
            parsed.setdefault("business_unit", "IT")
            parsed.setdefault("candidate_summary", generate_summary(parsed))

            scored = ["first_name", "email", "phone", "total_experience", "current_designation", "skills", "highest_qualification", "current_location"]
            filled_count = sum(1 for f in scored if parsed.get(f) and (parsed[f] != [] if isinstance(parsed[f], list) else True))
            parsed["confidence"] = round((filled_count / len(scored)) * 100)

            logger.info(f"[Resume Parser] ✅ Gemini ({model_name}) succeeded. Confidence: {parsed['confidence']}%")
            return parsed
        except Exception as e:
            logger.warning(f"[Resume Parser] ⚠ Model {model_name} failed: {str(e)[:120]}. Trying next.")
            continue

    raise Exception("QUOTA_EXHAUSTED")


# ── Main Entry Point ──────────────────────────────────────────────────────────

async def parse_resume_content(file: UploadFile) -> dict:
    logger.info(f"[Resume Parser] Starting resume parse for: {file.filename}")

    file_bytes = await file.read()
    await file.seek(0)
    filename = file.filename.lower()

    extracted_text = ""
    if filename.endswith(".pdf"):
        try:
            extracted_text = extract_text_from_pdf(file_bytes)
            logger.info(f"[Resume Parser] PDF text extracted: {len(extracted_text)} chars")
        except Exception as e:
            logger.warning(f"[Resume Parser] PDF text extraction failed: {e}")
    elif filename.endswith(".docx") or filename.endswith(".doc"):
        try:
            extracted_text = extract_text_from_docx(file_bytes)
            logger.info(f"[Resume Parser] DOCX text extracted: {len(extracted_text)} chars")
        except Exception as e:
            logger.error(f"[Resume Parser] DOCX extraction failed: {e}")
            raise Exception("Could not read the document. Try converting to PDF.")
    else:
        raise Exception("Unsupported format. Please upload PDF, DOC, or DOCX.")

    # Step 1: If Gemini Key exists, try Gemini AI
    if settings.VITE_GEMINI_API_KEY:
        try:
            is_pdf = filename.endswith(".pdf")
            payload = file_bytes if is_pdf else extracted_text
            result = await parse_with_gemini(payload, is_pdf)
            return result
        except Exception as e:
            if "QUOTA_EXHAUSTED" in str(e):
                logger.warning("[Resume Parser] Gemini quota exhausted. Using Section + NLP Parser.")
            else:
                logger.warning(f"[Resume Parser] Gemini failed ({e}). Using Section + NLP Parser.")
    else:
        logger.info("[Resume Parser] No Gemini key set. Using Section + NLP Parser.")

    # Step 2: High-accuracy Section + spaCy NLP Parser
    if not extracted_text.strip():
        raise Exception("Could not extract readable text from the document. Please enter details manually.")

    logger.info("[Resume Parser] Running Enhanced Section & NLP parsing engine...")
    result = smart_parse(extracted_text)
    logger.info(f"[Resume Parser] Completed. Confidence: {result['confidence']}%, Name: {result.get('first_name')} {result.get('last_name')}, Exp: {result.get('total_experience')}, Skills count: {len(result.get('skills', []))}")
    return result
