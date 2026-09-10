import json
import io
import re
import logging
import docx
import PyPDF2
from fastapi import UploadFile
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


# ── Text Extraction ──────────────────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in reader.pages:
        t = page.extract_text()
        if t:
            text += t + "\n"
    return text

def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = docx.Document(io.BytesIO(file_bytes))
    return "\n".join([p.text for p in doc.paragraphs])


# ── Regex-Based Fallback Parser ───────────────────────────────────────────────

IT_SKILLS = [
    "Python", "Java", "JavaScript", "TypeScript", "C#", "C++", "C", "Ruby", "Go", "Rust", "Swift", "Kotlin",
    "React", "React.js", "Angular", "Vue", "Next.js", "Node.js", "Express", "Django", "Flask", "FastAPI",
    "Spring Boot", "Spring", "Hibernate", ".NET", "ASP.NET", "Laravel", "Rails",
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite", "Oracle", "MSSQL", "Cassandra", "Elasticsearch",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Ansible", "Jenkins", "CI/CD", "GitHub Actions",
    "Linux", "Git", "REST", "GraphQL", "gRPC", "Microservices", "HTML", "HTML5", "CSS", "CSS3", "SASS", "Bootstrap", "Tailwind", "Redux", "PHP",
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-learn", "NLP", "OpenAI",
    "Excel", "Power BI", "Tableau", "Selenium", "Playwright", "Cypress",
]

BPO_SKILLS = ["voice process", "customer support", "customer service", "bpo", "call center", "inbound", "outbound"]
FA_SKILLS = ["accounts", "finance", "taxation", "tally", "gst", "bookkeeping", "audit", "accountant", "financial"]

def predict_business_unit(skills_list, text):
    text_lower = text.lower()
    skill_names_lower = [s.lower() for s in skills_list]
    if any(k in text_lower for k in FA_SKILLS):
        return "F&A"
    if any(k in text_lower for k in BPO_SKILLS):
        return "BPO"
    if skills_list:
        return "IT"
    return "IT"  # default

def generate_summary(data: dict) -> str:
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
        yr_label = f"{exp} year{'s' if exp != '1' else ''}"
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

def regex_parse(text: str) -> dict:
    data = {
        "first_name": "", "last_name": "", "email": "", "phone": "",
        "alternative_email": "", "alternative_phone": "",
        "current_location": "", "highest_qualification": "",
        "current_company": "", "current_designation": "",
        "total_experience": "", "skills": [],
        "notice_period": "", "current_ctc": "", "expected_ctc": "",
        "business_unit": "IT", "candidate_summary": "", "confidence": 0,
    }

    # ── Emails ────────────────────────────────────────────────────────────
    emails = re.findall(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', text)
    personal_pattern = re.compile(r'@(gmail|yahoo|hotmail|outlook|rediffmail|icloud|proton)\.', re.I)
    personal_emails = [e for e in emails if personal_pattern.search(e)]
    other_emails = [e for e in emails if not personal_pattern.search(e)]
    ordered_emails = personal_emails + other_emails
    unique_emails = []
    for e in ordered_emails:
        if e.lower() not in [x.lower() for x in unique_emails]:
            unique_emails.append(e)
    if unique_emails:
        data["email"] = unique_emails[0]
    if len(unique_emails) > 1:
        data["alternative_email"] = unique_emails[1]

    # ── Phones (supports +91, spaces, dashes, dots) ───────────────────────
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

    # ── Experience (supports decimal years e.g. 3.5 years, fresher) ───────
    if re.search(r'\b[Ff]resher\b', text):
        data["total_experience"] = "fresher"
    else:
        # Check "X years Y months"
        ym_match = re.search(r'(\d+)\s*(?:years?|yrs?)\s*(?:and\s+)?(\d+)\s*(?:months?|mos?)', text, re.IGNORECASE)
        if ym_match:
            yrs = int(ym_match.group(1)) + round(int(ym_match.group(2)) / 12, 1)
            data["total_experience"] = f"{yrs:g} years"
        else:
            exp_match = re.search(r'(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?|yr)\b(?:\s*(?:of\s+)?(?:experience|exp))?', text, re.IGNORECASE)
            if exp_match:
                years = float(exp_match.group(1))
                if years == 0:
                    data["total_experience"] = "fresher"
                else:
                    data["total_experience"] = f"{years:g} years"

    # ── Skills ────────────────────────────────────────────────────────────
    found_skills = []
    for skill in IT_SKILLS:
        if re.search(r'\b' + re.escape(skill) + r'\b', text, re.IGNORECASE):
            found_skills.append(skill)
    data["skills"] = found_skills

    # ── Qualification ─────────────────────────────────────────────────────
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
    for q_pat in qual_patterns:
        qual_match = re.search(q_pat, text, re.IGNORECASE)
        if qual_match:
            data["highest_qualification"] = qual_match.group(0).strip()
            break

    # ── Notice Period ─────────────────────────────────────────────────────
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

    # ── CTC ───────────────────────────────────────────────────────────────
    ctc_match = re.search(r'(?:Current\s*CTC|CTC)[:\s]*(\d+(?:\.\d+)?)\s*(?:LPA|L|Lakhs?)?', text, re.IGNORECASE)
    if ctc_match:
        data["current_ctc"] = ctc_match.group(1)
    exp_ctc_match = re.search(r'(?:Expected\s*CTC)[:\s]*(\d+(?:\.\d+)?)', text, re.IGNORECASE)
    if exp_ctc_match:
        data["expected_ctc"] = exp_ctc_match.group(1)

    # ── Company & Designation ─────────────────────────────────────────────
    # Pattern 1: "Software Engineer at / - / | Infosys"
    desg_at_match = re.search(
        r'([A-Z][A-Za-z\s]+?)\s+(?:at|@|in|with|[-|])\s+([A-Z][A-Za-z\s&.,]+?)(?:\s*[\n|]|$)',
        text
    )
    if desg_at_match:
        data["current_designation"] = desg_at_match.group(1).strip()
        data["current_company"] = desg_at_match.group(2).strip()
    else:
        working_match = re.search(
            r'(?:[Ww]orking|[Ww]orked)\s+as\s+([A-Za-z\s]+?)\s+(?:at|in|with|@)\s+([A-Za-z\s&.,]+?)(?:\s*[\n|]|$)',
            text
        )
        if working_match:
            data["current_designation"] = working_match.group(1).strip()
            data["current_company"] = working_match.group(2).strip()

    # ── Location ──────────────────────────────────────────────────────────
    loc_match = re.search(r'(?:Location|Address|Based\s+in|City)[:\s]+([A-Za-z\s,]+?)(?:\n|$)', text, re.IGNORECASE)
    if loc_match:
        data["current_location"] = loc_match.group(1).strip()
    else:
        # Check common cities
        common_cities = ["Hyderabad", "Bangalore", "Bengaluru", "Chennai", "Pune", "Mumbai", "Delhi", "Noida", "Gurgaon", "Gurugram", "Kolkata", "Ahmedabad", "Kochi", "Jaipur"]
        for city in common_cities:
            if re.search(r'\b' + city + r'\b', text[:2000], re.IGNORECASE):
                data["current_location"] = city
                break

    # ── Name (first non-header, non-email line, 1-4 words of letters only) ──
    ignored_headers = {"resume", "curriculum vitae", "cv", "profile", "bio-data", "biodata", "personal details", "contact", "summary", "contact info", "career objective"}
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    for line in lines[:15]:
        line_clean = re.sub(r'[^A-Za-z\s\.]', '', line).strip()
        if '@' not in line and line.lower() not in ignored_headers and len(line_clean.split()) <= 4 and len(line_clean.split()) >= 1 and re.match(r'^[A-Za-z\s\.]+$', line_clean):
            parts = line_clean.split()
            if parts and len(parts[0]) > 1 and parts[0].lower() not in ignored_headers:
                data["first_name"] = parts[0].capitalize()
                data["last_name"] = " ".join(parts[1:]).title() if len(parts) > 1 else ""
                break

    # ── Business Unit Prediction ──────────────────────────────────────────
    data["business_unit"] = predict_business_unit(found_skills, text)

    # ── Candidate Summary ─────────────────────────────────────────────────
    data["candidate_summary"] = generate_summary(data)

    # ── Confidence Score ──────────────────────────────────────────────────
    scored_fields = ["first_name", "email", "phone", "total_experience", "current_designation", "skills", "highest_qualification", "current_location"]
    filled = sum(1 for f in scored_fields if data.get(f) and (data[f] != [] if isinstance(data[f], list) else True))
    data["confidence"] = round((filled / len(scored_fields)) * 100)

    return data


# ── Gemini AI Parser ─────────────────────────────────────────────────────────

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

Rules:
1. Split full name into first_name / last_name. Middle names go to last_name.
2. phone: 10-digit number, strip any country code (e.g. +91).
3. total_experience: "fresher" for 0 yrs, just the number string for N yrs (e.g. "5").
4. skills: IT/technical skills only. No soft skills.
5. current_company / current_designation: Extract from experience section. Current/latest role.
6. business_unit: one of "IT", "ITES", "BPO", "F&A" based on skills and domain.
7. candidate_summary: 1-2 sentence human-readable summary, e.g. "5 years experienced Java developer skilled in Spring Boot and AWS."
8. Multiple emails: prefer personal (gmail/yahoo etc) as primary, company email as alternative_email.
9. Multiple phones: primary as phone, second as alternative_phone.
10. Empty string "" for missing string fields, [] for missing arrays.
"""

async def parse_with_gemini(text_or_bytes, is_pdf: bool) -> dict:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.VITE_GEMINI_API_KEY)
    models_to_try = ["gemini-2.0-flash-lite", "gemini-flash-lite-latest", "gemini-2.0-flash"]

    for model_name in models_to_try:
        try:
            logger.info(f"[Resume Parser] Trying model: {model_name}")
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

            # Enrich with server-side generated fields
            parsed.setdefault("business_unit", "IT")
            parsed.setdefault("candidate_summary", generate_summary(parsed))

            # Confidence score based on filled fields
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
    logger.info(f"[Resume Parser] Starting: {file.filename}")

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

    # Step 1: Try Gemini AI (best accuracy)
    if settings.VITE_GEMINI_API_KEY:
        try:
            is_pdf = filename.endswith(".pdf")
            payload = file_bytes if is_pdf else extracted_text
            result = await parse_with_gemini(payload, is_pdf)
            return result
        except Exception as e:
            if "QUOTA_EXHAUSTED" in str(e):
                logger.warning("[Resume Parser] All Gemini models quota-exhausted. Using regex fallback.")
            else:
                logger.warning(f"[Resume Parser] Gemini failed ({e}). Using regex fallback.")
    else:
        logger.info("[Resume Parser] No Gemini key — using regex parser.")

    # Step 2: Regex fallback
    if not extracted_text.strip():
        raise Exception("Could not extract text from the document. Please enter details manually.")

    logger.info("[Resume Parser] Using regex-based extraction.")
    result = regex_parse(extracted_text)
    logger.info(f"[Resume Parser] Regex done. Confidence: {result['confidence']}%")
    return result
