# Right Move CRM

A modern, comprehensive Recruitment Operations Management System (ROMS) and Applicant Tracking System (ATS) designed to handle end-to-end job requirement publishing, intelligent candidate tracking, hiring pipeline analytics, and employee management.

## 🚀 Built With

### Frontend
- **React 18** (via Vite)
- **Tailwind CSS** (for styling & glassmorphism UI)
- **Lucide React** (for modern, crisp icons)
- **React Hook Form** (for seamless data inputs and complex validation)
- **React Router v6** (for routing & navigation)

### Backend
- **FastAPI** (Python lightweight async web framework)
- **SQLAlchemy** (ORM for database architecture)
- **MySQL** (Relational structured database)
- **Pydantic v2** (Strict typing and request/response validation)

---

## ✨ Core Features & Modules

### 1. 📊 Real-time Analytics Dashboard
- Features live dynamic tracking of active open positions, candidate sign-ups (computed across timeframes like "new this week"), and pipeline metric distributions.
- Intelligent Global Search: Optimized, unified search capability to query across "Job Titles", "Company Names", "Candidate Names", "Skills", and "Experience" seamlessly, retrieving split-results dynamically in a global view.

### 2. 🏢 Organization Management
- Complete end-to-end management of client organizations.
- **Contract Renewal Notice System:** Automated alert banner actively tracks and displays client contracts reaching their termination date within the next 30 days.
- **Excel Data Export:** Specialized Excel generation and export utility, including an isolated export trigger exclusively for expiring organizational contracts.
- **Contract Document Uploads:** Secure attachment and management of business contracts.

### 3. 💼 Job Requirement Pipeline
- Advanced Job Requisition creation, editing, and listing tables.
- **Dynamic Ageing Calculation:** Real-time computation of Requisition Ageing (Current Date - Requisition Open Date), completely integrated into dashboard viewing, data sorting (Oldest to Newest), and CSV/Excel exports.
- **Matching & Shortlisting:** Backend algorithms mapping the most relevant candidates directly to job requirements based on parsed skills, tracking pipeline progress (Shortlisted, Interview, Rejected, Hired).

### 4. 🧑‍💻 Intelligent Candidate Database
- Centralized Candidate CRM containing detailed inputs, skill-chips, and dynamic timeline states.
- **Smart Resume Parsing:** Integrated AI/Parser engine that reads uploaded resumes (PDF/DOCX) to automatically auto-fill the Candidate Registration form (mapping skills, experience, qualifications, and personal details) complete with confidence accuracy scores.
- **Automated Duplicate Detection:** Real-time database checks preventing duplicate candidate entries via Name, Email, or Phone Number validation.
- **Form State Management:** Robust input control, automatically sanitizing values, calculating variable CTCs, and strictly managing blank defaults (e.g., Business Unit) for superior data integrity.

### 5. 👥 Employee & HR Operations (3-Stage Onboarding)
- Dynamic management of internal employees and recruiters.
- **3-Stage Enterprise Onboarding:** Enforces strict role boundaries where `HR` role populates HR details, `Admin User` role populates CTC/Compliance details, and `Super Admin` / `Admin Admin` assigns system roles in `/settings`.
- **Save as Draft & Profile Completeness:** Allows recruiters/HR to save partial employee records as "Drafts" bypassing strict validation, computing and visualizing real-time Profile Completion Percentages.

### 6. ⚙️ Dynamic 7-Role RBAC & Settings Module
- Enterprise 7-System Role Access Control Matrix (`User`, `Leader`, `HR`, `Admin User`, `Admin Admin`, `Super Admin`, `Unassigned`).
- **Settings Dashboard (`/settings`):** Role Assignment Management UI for Super Admin and Admin Admin to search employees and assign/change System Roles in real time.
- **Visual Permission Matrix Grid:** Interactive live permission viewer mapping role privileges across Candidate, Job, Organization, RMEP, Employee, Accounts, and Settings modules.
- **Zero-Trust Default Security:** Newly registered or unassigned employees receive 0% module access until assigned a role by an Administrator.
- **`libphonenumber-js` Phone Validation:** Google's official ITU international phone validation library integrated across Employee, Candidate, and Organization forms.
- **Flexible Login:** Login authentication supports Employee ID (`RM0011`, `RM0013`), Full Name, or Email Address using salted `bcrypt` password verification.

### 7. 📄 PDF Annotation & Evaluation Pipeline (Specialized Module)
- **Question Paper & Student Analysis:** Backend architecture built to evaluate student answer sheets against predefined question paper structures.
- **Automated PDF Rendering:** Rendering pipeline designed to dynamically overlay annotations, evaluation marks, and ticks across precise coordinates on PDF documents.
- **Force Download Capabilities:** Cross-origin bypassing mechanisms to reliably serve annotated evaluations over reliable public CDNs.

---

## 📦 Getting Started

### 1. Backend Setup
1. Open the `/backend` directory in your terminal.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set your environment variables in `.env`:
   ```env
   DATABASE_URL="mysql+pymysql://<user>:<password>@localhost:3306/rightmove_crm"
   # Add any required API Keys or Secret Tokens
   ```
4. Run the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```

### 2. Frontend Setup
1. Open the `/frontend` directory in your terminal.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Boot the Vite application:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173/`.

---
*Built with modern architecture patterns, ensuring high-performance scalability and seamless recruiter experiences.*
