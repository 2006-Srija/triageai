# TriageAI — AI-Powered Customer Support Ticket Triage

A multi-tenant SaaS platform that automatically triages incoming support tickets using AI. TriageAI classifies tickets by category, priority, and sentiment, detects prompt injection attacks, and provides AI-generated suggested responses — all while maintaining strict tenant data isolation.

## The Problem

Customer support teams drown in incoming tickets. Every ticket needs to be categorized, prioritized, and routed to the right person — a slow, manual process. Worse, bad actors increasingly embed prompt injection attempts in support tickets, trying to manipulate AI systems into revealing instructions or escalating issues improperly.

## The Solution

TriageAI automates the triage process end-to-end:

- **AI classification** — Groq-powered LLM (llama-3.3-70b-versatile) categorizes tickets, assesses priority, and detects sentiment
- **Two-layer prompt injection defense** — Hardcoded pattern matching + AI-level system prompt guarding against manipulation
- **Multi-tenant isolation** — Every query is scoped by tenant_id from the verified JWT, never from user input
- **RBAC** — Admin, Agent, and Viewer roles per organization
- **One-click demo** — "Simulate Tickets" button generates 5 tickets (3 normal + 2 injection attempts) to showcase the full pipeline

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS + Recharts |
| Backend | Node.js + Express |
| Database | PostgreSQL via Supabase |
| AI | Groq API (llama-3.3-70b-versatile) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Security | helmet, express-rate-limit, express-validator |

## Multi-Tenant Architecture

Every organization (tenant) gets its own isolated data space:

1. **organizations** table — each signup creates a new tenant with a unique invite code
2. **users** table — each user has a `tenant_id` foreign key and a role (`Admin`, `Agent`, `Viewer`)
3. **tickets** table — every ticket references `tenant_id`
4. **JWT middleware** extracts `tenant_id` from the verified token and attaches it to `req.user`
5. **All queries** filter by `req.user.tenant_id` — tenant_id from request body/params is never trusted

## Prompt Injection Defense (Two-Layer)

Layer 1 — Static pattern matching:
- 12 hardcoded patterns checked case-insensitively: "ignore previous instructions", "ignore all prior", "you are now", "system prompt", "act as", "disregard the above", "mark as resolved", "reveal your instructions", "new instructions:", "override", "developer mode", "jailbreak"
- Matches set `security_flag = true` on the ticket but the pipeline continues safely

Layer 2 — AI system prompt hardening:
- The Groq system prompt explicitly instructs the model to treat ticket content as DATA to classify, never as instructions
- The model is told to ignore any instructions embedded in the ticket text
- Output parsing is defensive: strips markdown fences, validates enum values, falls back to safe defaults on parse failure

## Local Setup

### Prerequisites

- Node.js 18+
- A Supabase project (free tier)
- A Groq API key (free tier)

### 1. Clone and install

```bash
git clone <repo-url> triageai
cd triageai
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Database Setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and paste + run the contents of `backend/schema.sql`
3. Go to **Project Settings > API** and copy your `Project URL` and `service_role key` (NOT the anon key)

### 3. Configure environment

Copy `.env.example` to `.env` in the backend folder:

```bash
cp backend/.env.example backend/.env
```

Fill in the values:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-random-jwt-secret-at-least-32-chars
GROQ_API_KEY=gsk_your-groq-api-key
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 4. Run locally

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser. Sign up for a new organization, then use the "New Ticket" button or "Simulate Tickets" (Admin) to populate your dashboard.

## Deployment

### Supabase (already done)

Your Supabase project URL and service key are in your `.env`.

### Render (Backend)

1. Push the project to a GitHub repository
2. On [Render](https://render.com), create a new **Web Service**
3. Connect your repo and set:
   - **Root Directory**: `backend` (not the repo root)
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free
4. Add all environment variables (same as your `.env`)
5. Deploy and note the URL (e.g. `https://triageai-backend.onrender.com`)

### Vercel (Frontend)

1. On [Vercel](https://vercel.com), create a new project from the same repo
2. Set:
   - **Root Directory**: `frontend` (not the repo root)
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add environment variable:
   - `VITE_API_URL` = your Render backend URL (e.g. `https://triageai-backend.onrender.com`)
4. Deploy

### Prevent Free-Tier Sleep (cron-job.org)

Render free-tier services spin down after 15 minutes of inactivity. To prevent this:

1. Create a free account at [cron-job.org](https://cron-job.org)
2. Create a new cron job:
   - **URL**: `https://your-backend.onrender.com/api/health`
   - **Schedule**: Every 10 minutes
3. Save — the health endpoint returns `{"status": "ok"}` and keeps the service warm

## API Overview

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /api/auth/signup | No | Create org + admin user |
| POST | /api/auth/login | No | Sign in |
| POST | /api/auth/join | No | Join via invite code |
| GET | /api/tickets | JWT | List tickets (tenant-scoped) |
| GET | /api/tickets/:id | JWT | Ticket detail |
| POST | /api/tickets | JWT | Submit + triage a ticket |
| PATCH | /api/tickets/:id | JWT | Update status/response |
| POST | /api/tickets/simulate | Admin | Generate 5 demo tickets |
| GET | /api/analytics | Admin | Ticket analytics |
| GET | /api/settings | JWT | Org settings |
| POST | /api/settings/regenerate-invite | Admin | New invite code |
| GET | /api/health | No | Uptime check |

## Project Structure

```
triageai/
├── backend/
│   ├── config/
│   │   └── supabase.js          # Supabase client
│   ├── middleware/
│   │   └── auth.js              # JWT verify + RBAC middleware
│   ├── routes/
│   │   ├── auth.js              # Signup, login, join
│   │   ├── tickets.js           # CRUD + triage + simulate
│   │   ├── analytics.js         # Admin analytics
│   │   └── settings.js          # Org settings
│   ├── services/
│   │   ├── groqService.js       # Groq AI triage
│   │   └── injectionDetection.js # Pattern matching
│   ├── schema.sql               # Database DDL
│   ├── .env.example
│   ├── package.json
│   └── server.js                # Express entry point
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── TicketRow.jsx
│   │   │   └── TicketFilters.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   ├── JoinPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── TicketDetailPage.jsx
│   │   │   ├── AnalyticsPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   ├── lib/
│   │   │   ├── api.js
│   │   │   └── auth.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── .gitignore
└── README.md
```
