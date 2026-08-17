# TalentFlow AI ⚡
> **Autonomous Recruiter Intelligence & Follow-Up Engine**  
> Streamline your job hunt with AI-powered job sourcing, candidate fit scoring, writing style calibration, and automated recruiter follow-ups.

---

## 🚀 Overview

**TalentFlow AI** is a background intelligence agent designed to automate the job search and cold recruiter outreach process. Instead of spending hours scrolling job boards, copying email addresses, writing repetitive emails, and forgetting to follow up, TalentFlow AI runs in the background to handle the heavy lifting while giving you full 1-click review control.

---

## ✨ Key Features

- **🌐 100% Free Web Job Sourcing**: Automatically aggregates job listings from open sources:
  - **Reddit**: Subreddits like `r/forhire`, `r/pythonjobs`, `r/jobbit`, `r/reactjs`
  - **Hacker News**: Monthly *"Who is Hiring?"* threads
  - **Remotive & RemoteOK**: Free developer & tech job feeds
  - **WeWorkRemotely**: Real-time RSS job postings
- **📍 Location & Work Arrangement Targeting**: Filter leads by:
  - **Work Type**: `Remote Only`, `Hybrid`, `Onsite`, or `Any / Worldwide`
  - **Target Locations**: Specific countries or cities (e.g. *Remote Worldwide*, *United States*, *Canada*, *Europe*, *India*, *San Francisco*)
  - **Posting Freshness**: Filter out stale postings older than 1, 3, 7, or 14 days
- **📑 PDF Resume Parsing**: Automatically parses uploaded `.pdf` resumes using Python `pypdf` to extract skills and compute a candidate fit score ($0-100\%$).
- **✍️ Writing Style & Tone Calibration**: Train Google Gemini 2.0 Flash on your actual sample cold emails so generated drafts mirror your authentic voice, greeting, sentence length, and signature.
- **🔁 Automated Recruiter Follow-Up Engine**: Schedule smart follow-up emails for **3, 5, or 7 days** post-outreach to maximize response rates.
- **🛡️ Gmail SMTP & Safety Caps**: Delivers emails directly from your Gmail account via an App Password with configurable daily cap limits (e.g., max 15 emails/day) to preserve sender reputation.
- **🎨 Light Neumorphic UI**: Built with Next.js 14 and Apple SF Pro typography, featuring interactive **Info Hover Tooltips** across all dashboard stats and settings.
- **🔓 OpenAPI / Swagger Interactive Docs**: Full OpenAPI documentation at `/docs` with **OAuth2 Bearer JWT** authorization support.

---

## 🛠️ Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide React, Axios |
| **Backend** | Python 3.14, FastAPI, Motor (Async MongoDB), Pydantic v2, `pypdf`, `aiosmtplib` |
| **AI Intelligence** | Google Gemini 2.0 Flash (`google-genai` SDK) |
| **Database** | MongoDB Cloud Atlas (Motor async driver) |
| **Authentication** | Passlib (Bcrypt hashing) + PyJWT (Bearer Tokens) |

---

## 📂 Project Architecture

```
TalentFlow-AI/
├── backend/
│   ├── main.py              # FastAPI entry point & OpenAPI config
│   ├── config.py            # Environment configuration & MongoDB URI
│   ├── database.py          # Motor MongoDB async driver connection
│   ├── models/              # Pydantic schemas (User, JobLead, OutreachLog)
│   ├── routes/              # API Endpoints (auth, settings, jobs, agent)
│   └── services/
│       ├── gemini_service.py # Gemini 2.0 Flash lead scoring & draft generation
│       ├── mailer_service.py # Async Gmail SMTP email sender
│       ├── worker_service.py # Background sourcing & execution engine
│       └── scrapers/        # Free scrapers (Reddit, HN, Remotive, WWR, RemoteOK)
└── frontend/
    ├── src/app/
    │   ├── page.tsx         # Dashboard & Outreach Control Center
    │   ├── settings/        # Writing Style, PDF Upload & Location Targeting
    │   ├── login/           # Auth login & user registration
    │   └── globals.css      # Light Neumorphic CSS Design System
    └── src/components/
        └── Header.tsx       # TalentFlow Header navigation component
```

---

## ⚙️ Getting Started

### Prerequisites

- **Python**: 3.10+ (tested on Python 3.14)
- **Node.js**: 18.x or later
- **MongoDB**: MongoDB Atlas Cloud URL or local instance
- **Google Gemini API Key**: Free API key from [Google AI Studio](https://aistudio.google.com/)
- **Gmail App Password**: 16-character passkey from Google Account Security $\rightarrow$ 2-Step Verification $\rightarrow$ App Passwords

---

### 1. Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create a Python virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Create a `.env` file in the `backend/` folder**:
   ```env
   MONGODB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
   DATABASE_NAME=talentflow_ai
   JWT_SECRET=your_super_secret_jwt_key_here
   ```

5. **Start the FastAPI server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   > 📖 Access Interactive Swagger API Docs at `http://localhost:8000/docs`

---

### 2. Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node packages**:
   ```bash
   npm install
   ```

3. **Start the Next.js development server**:
   ```bash
   npm run dev
   ```
   > 🌐 Open `http://localhost:3000` in your browser.

---

## 📖 How to Use TalentFlow AI

1. **Create an Account**: Open `http://localhost:3000` and register your account.
2. **Configure Settings** (`/settings`):
   - Enter your **Google Gemini API Key** & **Gmail App Password**.
   - Upload your **PDF Resume** for automatic skill parsing.
   - Set **Work Type** (`Remote`, `Hybrid`, `Onsite`) & **Target Locations** (e.g. *Remote Worldwide*, *United States*, *India*).
   - Paste a **Sample Cold Email** to calibrate Gemini to your exact writing tone.
3. **Run Worker**: Click **"Run Worker Now"** on the Dashboard to execute job sourcing across all free platforms.
4. **Review & Send**: Click **"Review & Send"** on drafted outreach leads to inspect Gemini's personalized cold email before delivering via Gmail.
5. **Schedule Follow-Up**: Click **"Schedule Follow-Up"** on sent leads to schedule automated follow-ups for **3, 5, or 7 days** later.

---

## 🛡️ Security & Privacy

- `.env` files and credentials are strict excluded from Git tracking.
- Passwords are salted and hashed with Bcrypt (`passlib`).
- Gmail App Passwords & API Keys are bound per individual user account.

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
