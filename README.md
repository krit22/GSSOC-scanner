# 🎯 GSSoC Issue Finder & Scanner

An interactive, high-performance monorepo platform designed to help contributors easily discover, filter, and track beginner-friendly issues (like `good-first-issue`) across **GirlScript Summer of Code (GSSoC)** repositories in real-time.

---

## 🚀 Key Features

* **Real-Time Progress Tracking**: Watch scans execute across dozens of repos simultaneously with a live progress bar.
* **Cache-Aware Performance**: Caches search results to protect against GitHub API rate-limiting while serving extremely fast feeds to concurrent users.
* **GitHub Integration**: Login seamlessly via GitHub OAuth to run scanned queries directly with your own GitHub token.
* **Modern Interface**: A clean, premium dashboard built with React, Vite, and Tailwind CSS.
* **Responsive Architecture**: Includes a background concurrency-managed queueing system in FastAPI that ensures robust, non-blocking scan execution.

---

## 🛠️ Tech Stack

### Frontend
* **Core**: React 19 + TypeScript + Vite 6
* **Styling**: Tailwind CSS v4 (incorporating modern styling paradigms)
* **Data Fetching**: TanStack React Query v5 (ensures perfect server state synchronization)
* **Analytics**: Vercel Analytics

### Backend & Core
* **Framework**: FastAPI (Python 3.12)
* **Web Server**: Uvicorn (standard production-ready ASGI)
* **Scout Core**: Custom, native GitHub API scanner module (`scout_core`) supporting pattern-based issue matching.
* **Database**: SQLAlchemy + PostgreSQL (Production) / SQLite (Development)
* **Deployment**: Fully prepared with `render.yaml` for Render and `vercel.json` for Vercel.

---

## 📂 Directory Layout

```text
GSSOC-scanner/
├── backend/            # FastAPI Web Server & API Routers
│   ├── app/            # Main application logic
│   └── requirements.txt# Backend-specific Python dependencies
├── scout_core/         # Core API scanner and parser library
├── frontend/           # React + Vite frontend application
│   ├── src/            # Source React files
│   └── package.json    # Frontend Node/NPM dependencies
├── projects.json       # GSSoC Project Catalog database 
├── requirements.txt    # Production root python installation spec
├── render.yaml         # Render Blueprint configuration
└── .gitignore          # Premium global git exclusion setup
```

---

## ⚙️ Environment Configuration

To configure the application, duplicate `.env.example` at the root directory and rename it to `.env`:

```bash
cp .env.example .env
```

Fill in the following fields:

```ini
# GitHub OAuth configuration (required for sign-in)
GITHUB_OAUTH_CLIENT_ID=your_oauth_client_id
GITHUB_OAUTH_CLIENT_SECRET=your_oauth_client_secret

# Session cryptography signing (secure random string)
SESSION_SECRET=your_session_secret

# PostgreSQL connection string (defaults to SQLite if left empty)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Optional: Personal Access Token for scanning in development without logging in
SCANNER_GITHUB_TOKEN=your_github_pat_token
```

---

## 🏁 Getting Started

### Prerequisites
* **Python** 3.12 or higher
* **Node.js** v18 or higher (with npm)

---

### 1. Running the Backend

From the project root, create a Python virtual environment, activate it, and install the dependencies:

```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows, use: .venv\Scripts\activate

# Install backend dependencies (automatically triggers backend/requirements.txt)
pip install -r requirements.txt
```

Start the FastAPI application with Uvicorn:

```bash
PYTHONPATH=. uvicorn app.main:app --reload --port 8000
```
The API documentation will be available locally at [http://localhost:8000/docs](http://localhost:8000/docs).

---

### 2. Running the Frontend

Navigate to the `frontend/` directory, install NPM dependencies, and start the Vite development server:

```bash
cd frontend
npm install
npm run dev
```

The frontend application will boot up at [http://localhost:5173](http://localhost:5173).

---

## ⚡ Deployment

The repository is configured for modern, push-to-deploy hosting providers:

* **Backend (API)**: Designed for **Render** via the included Blueprint configuration in [render.yaml](file:///home/krit/projects/GSSOC-scanner/render.yaml).
* **Frontend (UI)**: Production-ready for hosting on **Vercel** with the included [vercel.json](file:///home/krit/projects/GSSOC-scanner/frontend/vercel.json) spec.
