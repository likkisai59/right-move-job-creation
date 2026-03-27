# Right Move CRM

A modern Recruitment Operations Management System designed to handle end-to-end job requirement publishing, candidate tracking, and hiring pipeline analytics.

## 🚀 Built With

### Frontend
- **React 18** (via Vite)
- **Tailwind CSS** (for styling & glassmorphism UI)
- **Lucide React** (for modern icons)
- **React Hook Form** (for seamless data inputs)
- **React Router v6** (for routing & navigation)

### Backend
- **FastAPI** (Python lightweight async web framework)
- **SQLAlchemy** (ORM for database architecture)
- **MySQL** (Relational structured database)
- **Pydantic v2** (Strict typing and validation)

## ✨ Core Features

* **Real-time Analytics Dashboard:** Features live dynamic tracking of active open positions, candidate sign-ups (computed across timeframes like "new this week"), and pipeline metric distributions.
* **Job Requirement Management:** Complete implementation of Job creation, editing, and listing tables. Equipped with filters scanning for company names, titles, and creation dates.
* **Candidate Database:** A dedicated CRM module containing detailed candidate inputs, resume files, skill-chips, and dynamic timeline states.
* **Intelligent Global Search:** An optimized, unified search capability to query across "Job Titles", "Company Names", "Candidate Names", "Skills", and "Experience" seamlessly. Retrieves split-results dynamically in a global view.

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
