# AI-Driven Zero Trust Microsegmentation Engine

A modern, enterprise-style web application that simulates an **AI-Driven Zero Trust Microsegmentation Engine**. It demonstrates how organizations can continuously verify every access request using multiple security factors before granting access — built as a college major project prototype/simulation, not a real enterprise security product.

> **Never Trust, Always Verify.**

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Project](#running-the-project)
  - [Building for Production](#building-for-production)
- [Demo Login](#demo-login)
- [Pages & Modules](#pages--modules)
- [AI Risk Evaluation Logic](#ai-risk-evaluation-logic)
- [Example Scenarios](#example-scenarios)
- [Notes](#notes)

---

## Overview

This project simulates a **Security Operations Center (SOC) dashboard** for a Zero Trust security platform. Instead of trusting users after a single login, every access request is evaluated against multiple security factors — identity, biometrics, device health, location, time, application sensitivity, and microsegmentation policies — to produce an AI-inspired risk score and access decision.

The emphasis is on a **modern UI/UX, clear workflow, and realistic simulation** suitable for a college major project, rather than implementing real enterprise security infrastructure or hardware integrations.

---

## Key Features

- **Dark professional cybersecurity theme** with a clean enterprise SOC look
- **Sidebar navigation** with responsive mobile support
- **Simulated authentication** with Admin and Employee roles
- **Dashboard** with stat cards, donut/bar/line charts, and recent activity feeds
- **User Management** — full CRUD with employee profiles and behavioral baselines
- **Device Management** — full CRUD with trust status, health, OS, and antivirus tracking
- **Department & Microsegmentation** — departments, network segments, and access mappings
- **Application Management** — CRUD with sensitivity levels and segment assignment
- **Access Evaluation Engine** (core module) — evaluates 8 security factors per request
- **AI Risk Scorecard** — per-factor scores, overall risk score, risk level, and final decision
- **Continuous Monitoring** — auto-refreshing panels for recent and suspicious activity
- **Access Logs** — searchable, filterable logs with CSV export
- **Modern animations and micro-interactions** throughout

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Icons | lucide-react |
| Backend / Database | Supabase (PostgreSQL) |
| Charts | Custom SVG components (no external chart library) |

---

## Project Structure

```
project/
├── index.html                      # HTML entry point
├── package.json                    # Dependencies and scripts
├── vite.config.ts                  # Vite configuration
├── tailwind.config.js              # Tailwind theme (dark cybersecurity palette)
├── postcss.config.js               # PostCSS config
├── tsconfig.json                   # TypeScript config (root)
├── tsconfig.app.json               # TypeScript config (app)
├── tsconfig.node.json              # TypeScript config (node)
├── eslint.config.js                # ESLint config
├── .env                            # Supabase environment variables
├── .gitignore
│
├── supabase/
│   └── migrations/
│       ├── 20260712180007_create_zero_trust_schema.sql   # Schema + RLS
│       ├── 20260712180031_seed_zero_trust_data.sql        # Seed data
│       └── 20260712180049_seed_access_logs.sql            # Sample access logs
│
└── src/
    ├── main.tsx                    # React entry point
    ├── App.tsx                     # Root component + page routing
    ├── index.css                   # Global styles + Tailwind layers
    ├── vite-env.d.ts               # Vite type declarations
    │
    ├── context/
    │   └── AuthContext.tsx         # Simulated auth (Admin/Employee)
    │
    ├── lib/
    │   ├── supabase.ts             # Supabase client singleton
    │   └── riskEngine.ts           # AI risk evaluation engine
    │
    ├── types/
    │   └── index.ts                # All TypeScript interfaces & types
    │
    ├── components/
    │   ├── Layout.tsx              # Sidebar + header layout shell
    │   └── ui/
    │       ├── Badges.tsx          # Risk, decision, status, trust badges
    │       ├── Charts.tsx          # Donut, bar, and line chart components
    │       └── Modal.tsx           # Modal + confirm-delete dialog
    │
    └── pages/
        ├── LoginPage.tsx                  # Admin/Employee login
        ├── DashboardPage.tsx              # Stats + charts overview
        ├── UserManagementPage.tsx         # User CRUD + details
        ├── DeviceManagementPage.tsx       # Device CRUD
        ├── DepartmentSegmentPage.tsx      # Departments + segments + mappings
        ├── ApplicationManagementPage.tsx  # Application CRUD
        ├── AccessEvaluationPage.tsx       # Core: access evaluation + scorecard
        ├── MonitoringPage.tsx             # Continuous monitoring
        └── AccessLogsPage.tsx            # Searchable/filterable logs + CSV export
```

---

## Database Schema

The app uses **Supabase (PostgreSQL)** with 7 tables. Row Level Security (RLS) is enabled on all tables with `anon, authenticated` access (single-tenant simulation).

| Table | Purpose |
|-------|---------|
| `departments` | Company departments (HR, Finance, Engineering, Admin) |
| `segments` | Network microsegments for isolation |
| `department_segments` | Maps departments to their allowed segments |
| `applications` | Company apps with sensitivity levels |
| `users` | Employee records with behavioral baselines (normal hours, location) |
| `devices` | Employee devices with trust/health/OS/antivirus status |
| `access_logs` | Every access request with full risk evaluation results |

### Key Columns

**users** — `employee_id`, `name`, `email`, `department_id`, `role`, `normal_start_hour`, `normal_end_hour`, `normal_location`, `account_status`

**devices** — `device_id`, `device_name`, `device_type`, `assigned_user_id`, `trusted`, `device_health`, `os_status`, `antivirus_status`

**applications** — `name`, `segment_id`, `sensitivity_level` (Low/Medium/High/Critical), `description`

**access_logs** — `user_name`, `department_name`, `device_name`, `location`, `access_time`, `application_name`, `biometric_status`, `identity_verified`, `device_trusted`, `device_health`, `location_anomaly`, `time_anomaly`, `segment_allowed`, `risk_score`, `risk_level`, `decision`, `security_alert`

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher — [download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- A **Supabase** project — create a free one at [supabase.com](https://supabase.com)

### Installation

1. **Clone or download the project**

   ```bash
   git clone <your-repo-url>
   cd project
   ```

   Or download the ZIP and extract it, then open a terminal in the project folder.

2. **Install dependencies**

   ```bash
   npm install
   ```

### Environment Variables

Create a `.env` file in the project root (it may already exist) with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these in your Supabase dashboard under **Project Settings → API**:
- `Project URL` → `VITE_SUPABASE_URL`
- `anon public` key → `VITE_SUPABASE_ANON_KEY`

### Database Setup

The SQL migration files are in `supabase/migrations/`. To set up your database:

1. Open your **Supabase dashboard**
2. Go to the **SQL Editor**
3. Run the files in this order:
   - `20260712180007_create_zero_trust_schema.sql` — creates all tables, indexes, and RLS policies
   - `20260712180031_seed_zero_trust_data.sql` — seeds departments, segments, applications, users, and devices
   - `20260712180049_seed_access_logs.sql` — seeds sample access log entries

> If you used Bolt to build this project, the database is already provisioned and seeded — no manual setup needed.

### Running the Project

```bash
npm run dev
```

This starts the Vite dev server. Open the URL shown in the terminal (typically `http://localhost:5173`).

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` folder. Preview the production build with:

```bash
npm run preview
```

### Type Checking

```bash
npm run typecheck
```

---

## Demo Login

The login page has **quick demo buttons** that auto-fill credentials. You can also enter any email/password — authentication is simulated.

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@company.com` | `admin123` |
| Employee | `employee@company.com` | `employee123` |

> Note: This is a simulated login for demonstration purposes. No real authentication backend is used — any email/password combination will log you in.

---

## Pages & Modules

### 1. Dashboard
Overview with 8 stat cards (Total Users, Devices, Applications, Access Requests, Low/Medium/High Risk, Denied), a risk distribution donut chart, department-wise bar chart, access trend line chart, recent suspicious activities feed, and a recent requests table.

### 2. User Management
Full CRUD for employees. Each user has an Employee ID, name, email, department, role, normal working hours, normal login location, and account status. Includes a detail view modal.

### 3. Device Management
Full CRUD for devices. Each device tracks device ID, name, type, assigned user, trusted/untrusted status, device health, OS status, and antivirus status.

### 4. Department & Microsegmentation
Create departments and network segments, then map departments to their allowed segments. Shows which applications belong to each segment — enforcing microsegmentation isolation.

### 5. Application Management
Full CRUD for company applications. Each application has a name, assigned segment, sensitivity level (Low/Medium/High/Critical), and description.

### 6. Access Evaluation (Core Module)
Select a user, device, application, location, access hour, and biometric status. The AI engine evaluates 8 security factors, shows an animated evaluation, and produces a detailed risk scorecard with per-factor scores, an overall risk score (0–100), risk level, final decision, and security alert if triggered. Every evaluation is saved to the access logs.

### 7. Continuous Monitoring
Auto-refreshing (every 10 seconds) panels showing recent access requests, high-risk requests, denied requests, and security alerts — simulating real-time AI monitoring.

### 8. Access Logs
Searchable and filterable table of all access requests. Filter by risk level, decision, or department. Export filtered results to CSV.

---

## AI Risk Evaluation Logic

The risk engine (`src/lib/riskEngine.ts`) evaluates 8 weighted security factors for every access request:

| Factor | Weight | Description |
|--------|--------|-------------|
| Identity Verification | 15% | Is the user's account active and identity verified? |
| Biometric Verification | 15% | Simulated biometric check (Verified / Failed / Not Available) |
| Device Health | 10% | Good / Fair / Poor device health status |
| Device Trust | 15% | Is the device a trusted company device? |
| Location Analysis | 15% | Does the login location match the user's normal location? |
| Time Analysis | 10% | Is the access time within the user's normal working hours? |
| Application Sensitivity | 10% | How sensitive is the app being accessed? |
| Microsegmentation Policy | 10% | Is the app in a segment the user's department is allowed to access? |

Each factor contributes a weighted risk score. The total (0–100) determines the risk level:

- **0–29** → Low Risk
- **30–59** → Medium Risk
- **60–100** → High Risk

### Final Decisions

| Score | Decision |
|-------|----------|
| < 30 | **Allow Access** |
| 30–59 | **Additional Verification Required** |
| 60–79 | **Restricted Access** (+ security alert) |
| ≥ 80 | **Deny Access** (+ security alert) |

Suspended/locked accounts or microsegmentation violations automatically result in a Deny.

---

## Example Scenarios

### Scenario 1 — Low Risk (Allow)
- Active user logs in during normal working hours
- Uses a trusted company device with good health
- Logs in from their normal location
- Accesses an application within their department's segment
- Biometric verification: Verified
- **Result:** Low Risk → Access Allowed

### Scenario 2 — High Risk (Deny)
- User logs in at 3 AM (outside normal hours)
- Uses an unknown, untrusted device with poor health
- Logs in from a different location
- Attempts to access a Critical application from another department's segment
- Biometric verification: Failed
- **Result:** High Risk → Access Denied → Security Alert Generated

You can reproduce both scenarios on the **Access Evaluation** page using the test scenario hints at the bottom.

---

## Notes

- This is a **simulation/prototype** for educational purposes — no real biometric hardware, identity providers, or network segmentation is involved.
- Authentication is **simulated** (any email/password works). The login page demonstrates the UI flow only.
- All data persists in **Supabase**. If you set up your own Supabase project, run the migration SQL files to create and seed the database.
- The app is fully responsive and works on mobile, tablet, and desktop.

---

**Built as a college major project demonstrating Zero Trust Architecture principles, AI-inspired risk evaluation, and modern web development.**
