<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="MIT License" />
</p>

<h1 align="center">🛡️ VacciTrack</h1>
<h3 align="center"><em>Shield Your Child's Future</em></h3>

<p align="center">
  A full-stack immunization management system that digitises India's <strong>National Immunization Schedule (NIS) 2025</strong>, providing role-based portals for parents and doctors with OTP-verified vaccine administration, multilingual UI, gamified progress tracking, and ABHA ID integration.
</p>

<p align="center">
  <a href="#-key-features">Features</a> •
  <a href="#%EF%B8%8F-architecture">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-project-structure">Project Structure</a>
</p>

---

## 🎯 Key Features

### Role-Based Access Control
| Feature | Parent | Doctor |
|---|---|---|
| View vaccination schedule | ✅ Own children | ✅ Assigned patients |
| Add child records | ✅ | ✅ (with `parentId`) |
| Delete child records | ✅ Own only | ✅ Any assigned |
| Administer vaccines | ❌ | ✅ OTP-verified |
| Search patients | ❌ | ✅ By name / ABHA ID |
| Transfer patient | ✅ Own child | ✅ Assigned child |
| Register account | ❌ (seeded) | ✅ Self-registration |

### Vaccine Schedule Engine (VaxCalc)
- **Full NIS 2025 compliance** — 25 vaccines across 4 phases (Birth → 16 years)
- **Auto-generated schedule** from child's date of birth using `date-fns` arithmetic
- **Dynamic status computation** — `UPCOMING` → `PENDING` → `OVERDUE` → `COMPLETED`
- **Grace period enforcement** — Each vaccine has a configurable grace window (1–365 days)
- **Minimum interval validation** — Enforces minimum days between multi-dose series

### OTP-Verified Vaccine Administration
- Doctor initiates vaccine → OTP sent to parent's phone via SMS
- **6-digit cryptographically secure OTP** (bcrypt-hashed, stored in MongoDB)
- **5 max attempts**, **5-minute expiry**, **60-second resend cooldown**
- **TTL index** — MongoDB auto-purges expired OTP documents
- **Multi-provider SMS**: Twilio (global), Fast2SMS (India), or console (dev mode)
- Only after OTP verification is the vaccine marked `COMPLETED`

### Gamification & UX
- **Shield Level system** — 6 tiers from "Not Started" → "Immunity Champion" based on completion count
- **Animated shield badge** with star rating and glowing effects at Level 4+
- **Confetti explosion** on successful vaccine administration
- **Animated transitions** via Framer Motion throughout the app

### Internationalization (i18n)
- **English** and **Hindi** language toggle (90+ translation keys)
- Covers all UI strings: navigation, dashboard stats, forms, status labels, gamification text
- Real-time language switching via React Context — no page reload

### Data Integrity
- **No orphan parents rule** — When a parent's last child is deleted, the parent account is automatically removed
- **Orphan cleanup scripts** — Dry-run and destructive modes for existing databases
- **Doctor fallback on deletion** — When a doctor deletes their account, patients transfer to another doctor or unassign
- **ABHA ID uniqueness** — Collision-resistant 14-digit IDs with retry loop

### Additional Features
- **Dark mode default** with smooth light/dark toggle (persisted via `localStorage`)
- **Responsive design** — Mobile-first with collapsible navbar and adaptive layouts
- **Doctor self-registration** — Auto-generates unique `DOC-XXXXXX` ID (unambiguous charset)
- **Doctor transfer workflow** — Reassign a child to a different doctor by their Doctor ID
- **SEO optimised** — Open Graph, Twitter Cards, canonical URL, semantic HTML

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT (Port 8080)                │
│  React 18 + TypeScript + Vite + Tailwind + shadcn   │
│                                                     │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │  Pages   │  │Components │  │    Contexts       │  │
│  │ ─Login   │  │ ─Navbar   │  │ ─AuthContext      │  │
│  │ ─Parent  │  │ ─AddChild │  │ ─LanguageContext  │  │
│  │  Dash    │  │ ─OtpDlg   │  └──────────────────┘  │
│  │ ─Doctor  │  │ ─ShieldBdg│  ┌──────────────────┐  │
│  │  Dash    │  │ ─Timeline │  │    Libraries     │  │
│  │ ─Child   │  │ ─ChildCard│  │ ─api.js (fetch)  │  │
│  │  Detail  │  │ ─StatsCard│  │ ─vaccineSchedule │  │
│  └──────────┘  │ ─Confetti │  │ ─i18n            │  │
│                │ ─49 UI    │  │ ─dataStore       │  │
│                └───────────┘  └──────────────────┘  │
└───────────────────────┬─────────────────────────────┘
                        │ REST API (fetch + Bearer JWT)
┌───────────────────────▼─────────────────────────────┐
│                   SERVER (Port 5000)                │
│          Node.js + Express + Mongoose               │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  Middleware Pipeline                         │   │
│  │  helmet → cors → rate-limit → morgan → json  │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────┐ ┌──────────┐ ┌──────┐ ┌───────────┐   │
│  │  /auth  │ │/children │ │/users│ │   /otp    │   │
│  │ register│ │ CRUD     │ │ me   │ │ send      │   │
│  │ login   │ │ search   │ │delete│ │ verify    │   │
│  │         │ │ vaccines │ │lookup│ │ resend    │   │
│  │         │ │ transfer │ │      │ │           │   │
│  └─────────┘ └──────────┘ └──────┘ └───────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  Models: User (bcrypt) │ Child │ Otp (TTL)   │   │
│  └──────────────────────────────────────────────┘   │
│                        │                            │
└────────────────────────┼────────────────────────────┘
                         │
                  ┌──────▼──────┐
                  │   MongoDB   │
                  │ (Atlas/Local)│
                  └─────────────┘
```

### Request Lifecycle

```
1. User action → React component
2. Component calls api.js → fetch() with Bearer token
3. Express receives → helmet → CORS → rate-limit → JSON parse
4. Route handler → auth middleware (JWT verify) → authorize (role check)
5. Business logic → Mongoose model → MongoDB
6. Response → { success: true, data: {...} }
7. React Query caches → UI re-renders
```

---

## 🛠 Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| **React 18** + **TypeScript** | UI library with type safety |
| **Vite 5** (SWC plugin) | Build tool with sub-second HMR |
| **Tailwind CSS 3** | Utility-first styling with CSS variable design tokens |
| **shadcn/ui** (49 components) | Accessible Radix UI primitives |
| **React Router DOM 6** | Client-side routing with protected routes |
| **TanStack React Query 5** | Server state management and caching |
| **React Hook Form** + **Zod** | Form management with schema validation |
| **Framer Motion** | Spring-physics animations and transitions |
| **Recharts** | Data visualisation (dashboard charts) |
| **date-fns** | Date arithmetic for schedule generation |
| **next-themes** | Dark/light mode with SSR-safe hydration |
| **Sonner** | Toast notifications |
| **Lucide React** | Icon library |
| **input-otp** | 6-digit OTP input component |
| **react-confetti** | Celebration effects |

### Backend

| Technology | Purpose |
|---|---|
| **Node.js** + **Express 4** | REST API server |
| **MongoDB** + **Mongoose 8** | Document database with schema validation |
| **jsonwebtoken** | JWT authentication (configurable expiry) |
| **bcryptjs** | Password + OTP hashing (cost 10 / cost 6) |
| **helmet** | HTTP security headers |
| **cors** | Cross-Origin Resource Sharing with origin whitelist |
| **express-rate-limit** | Global + per-endpoint rate limiting |
| **express-validator** | Request body validation |
| **morgan** | HTTP request logging (dev mode) |
| **nodemon** | Dev server auto-restart |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** or **bun**
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier works)

### 1. Clone the Repository

```bash
git clone https://github.com/harshhsharmaa57/VacciTrackV2.git
cd VacciTrackV2
```

### 2. Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server
npm install
cd ..
```

### 3. Configure Environment Variables

#### Backend (`server/.env`)

```env
# Server
PORT=5000
HOST=0.0.0.0
NODE_ENV=development

# Database
DATABASE_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/vaccitrack

# Authentication
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here

# CORS
CLIENT_URL=http://localhost:8080

# Rate Limiting (optional, defaults shown)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# SMS Provider: 'console' | 'twilio' | 'fast2sms'
SMS_PROVIDER=console

# Twilio (optional — global SMS)
# TWILIO_ACCOUNT_SID=your_sid
# TWILIO_AUTH_TOKEN=your_token
# TWILIO_PHONE_NUMBER=+1XXXXXXXXXX

# Fast2SMS (optional — India SMS)
# FAST2SMS_API_KEY=your_api_key

# Sample doctor for auto-assignment
SAMPLE_DOCTOR_EMAIL=doctor@aiims.com
```

#### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Seed the Database

```bash
cd server
npm run seed
```

This creates demo accounts with pre-populated vaccination records:

| Role | Email | Password |
|---|---|---|
| Parent | `parent@demo.com` | `password123` |
| Parent | `parent2@demo.com` | `password123` |
| Doctor | `doctor@aiims.com` | `password123` |
| Doctor | `nurse@phc.com` | `password123` |

### 5. Run the Application

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend (from project root)
npm run dev
```

| Service | URL |
|---|---|
| Frontend | `http://localhost:8080` |
| Backend API | `http://localhost:5000/api` |
| Health Check | `http://localhost:5000/health` |

---

## 📡 API Reference

All endpoints return JSON with the shape `{ success: boolean, data?: any, error?: string }`.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Register new user (parent/doctor) |
| `POST` | `/api/auth/login` | ❌ | Login and receive JWT |

**Register body:**
```json
{
  "email": "doctor@hospital.com",
  "password": "securepass",
  "name": "Dr. Smith",
  "role": "doctor",
  "phone": "+919876543210",
  "hospitalName": "AIIMS Delhi",
  "specialization": "Pediatrics"
}
```

### Users

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/users/me` | 🔒 | Any | Get current user profile |
| `DELETE` | `/api/users/me` | 🔒 | Any | Delete own account (with cascade) |
| `GET` | `/api/users/doctor/:doctorId` | 🔒 | Any | Lookup doctor by DOC-XXXXXX ID |

### Children

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/children` | 🔒 | Any | List children (scoped by role) |
| `GET` | `/api/children/search?q=` | 🔒 | Doctor | Search by name or ABHA ID |
| `GET` | `/api/children/:id` | 🔒 | Any | Get child detail (ownership check) |
| `POST` | `/api/children` | 🔒 | Any | Create child with auto-generated schedule |
| `PATCH` | `/api/children/:id` | 🔒 | Doctor | Update child info |
| `DELETE` | `/api/children/:id` | 🔒 | Any | Delete child (triggers orphan parent check) |
| `PUT` | `/api/children/:id/vaccines/:vaccineId` | 🔒 | Doctor | Administer vaccine (direct, no OTP) |
| `PATCH` | `/api/children/:id/transfer` | 🔒 | Any | Transfer child to another doctor |

### OTP Verification

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/otp/send` | 🔒 | Doctor | Send OTP to parent's phone |
| `POST` | `/api/otp/verify` | 🔒 | Doctor | Verify OTP and administer vaccine |
| `POST` | `/api/otp/resend` | 🔒 | Doctor | Resend OTP (60s cooldown) |

**OTP Security:**
- OTPs are bcrypt-hashed before storage (never stored in plaintext)
- Dedicated rate limiters: 10 sends/15min, 15 verifies/5min per IP
- Auto-invalidates previous OTPs on new send
- In `console` mode, the OTP is returned in the API response (`devOtp` field) for development

---

## 📁 Project Structure

```
VacciTrackV2/
├── index.html                        # SPA entry with theme bootstrap & SEO meta
├── vite.config.ts                    # Vite config (port 8080, @ alias)
├── tailwind.config.ts                # Design tokens & custom theme
├── components.json                   # shadcn/ui config
├── .env                              # Frontend env (VITE_API_URL)
├── .env.local.example                # Frontend env template
│
├── src/                              # ─── FRONTEND ───
│   ├── main.tsx                      # React DOM entry
│   ├── App.tsx                       # Provider tree + routing
│   ├── index.css                     # Global styles + CSS variables
│   │
│   ├── pages/
│   │   ├── Login.tsx                 # Portal selection + login/register forms
│   │   ├── ParentDashboard.tsx       # Child cards, stats, add child
│   │   ├── DoctorDashboard.tsx       # Patient list, search, vaccine admin
│   │   ├── ChildDetail.tsx           # Full schedule timeline view
│   │   └── NotFound.tsx              # 404 page
│   │
│   ├── components/
│   │   ├── Navbar.tsx                # Sticky nav with theme/lang toggles
│   │   ├── AddChildForm.tsx          # Multi-field child registration
│   │   ├── ChildCard.tsx             # Summary card with shield badge
│   │   ├── VaccineTimeline.tsx       # Phase-grouped timeline view
│   │   ├── OtpVerificationDialog.tsx # Multi-stage OTP flow UI
│   │   ├── ShieldBadge.tsx           # Gamified progress badge
│   │   ├── StatsCard.tsx             # Dashboard stat card
│   │   ├── ConfettiExplosion.tsx     # Celebration effect
│   │   ├── ThemeToggle.tsx           # Dark/light mode button
│   │   ├── NavLink.tsx               # Active route link
│   │   └── ui/                       # 49 shadcn/ui components
│   │
│   ├── context/
│   │   ├── AuthContext.tsx           # JWT auth state + login/logout
│   │   └── LanguageContext.tsx       # i18n language provider
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx            # Responsive breakpoint hook
│   │   └── use-toast.ts             # Toast notification hook
│   │
│   └── lib/
│       ├── api.js                    # REST client (fetch + token management)
│       ├── vaccineSchedule.ts        # VaxCalc engine — NIS 2025 schedule
│       ├── i18n.ts                   # EN/HI translations (90+ keys)
│       ├── dataStore.ts              # In-memory fallback (demo mode)
│       └── utils.ts                  # Tailwind merge utility
│
├── server/                           # ─── BACKEND ───
│   ├── package.json                  # Backend deps + scripts
│   ├── .env                          # Server env vars
│   ├── .env.example                  # Server env template
│   │
│   └── src/
│       ├── server.js                 # Express app bootstrap
│       │
│       ├── config/
│       │   └── database.js           # MongoDB connection
│       │
│       ├── models/
│       │   ├── User.js               # User schema (bcrypt, auto doctorId)
│       │   ├── Child.js              # Child schema (embedded schedule)
│       │   └── Otp.js                # OTP schema (TTL, bcrypt hash)
│       │
│       ├── middleware/
│       │   ├── auth.js               # JWT verify + RBAC authorize()
│       │   └── errorHandler.js       # Centralized error handling
│       │
│       ├── routes/
│       │   ├── auth.js               # Register + Login
│       │   ├── children.js           # CRUD + vaccines + transfer
│       │   ├── users.js              # Profile + doctor lookup
│       │   └── otp.js                # OTP send/verify/resend
│       │
│       ├── utils/
│       │   ├── vaccineSchedule.js    # Server-side NIS 2025 schedule
│       │   ├── smsService.js         # SMS abstraction (Twilio/Fast2SMS/console)
│       │   ├── generateToken.js      # JWT token generation
│       │   ├── generateAbhaId.js     # 14-digit ABHA ID generator
│       │   └── assignSampleDoctor.js # Auto-assign unassigned children
│       │
│       └── scripts/
│           └── seedDatabase.js       # Demo data seeder
│
└── public/
    ├── robots.txt
    └── placeholder.svg
```

---

## 🗃️ Database Schema

### User

```javascript
{
  email:          String  // unique, lowercase, validated
  password:       String  // bcrypt hashed (select: false)
  name:           String
  role:           "parent" | "doctor"
  phone:          String  // optional
  hospitalName:   String  // doctors only
  doctorId:       String  // auto-generated "DOC-XXXXXX" (unique, sparse)
  specialization: String  // doctors only
  timestamps:     true    // createdAt, updatedAt
}
```

### Child

```javascript
{
  parentId:     ObjectId  // → User (indexed)
  doctorId:     ObjectId  // → User (indexed, optional)
  name:         String
  dateOfBirth:  Date
  gender:       "male" | "female"
  abhaId:       String    // unique 14-digit (text index)
  parentPhone:  String    // +91XXXXXXXXXX format
  schedule: [{            // embedded vaccine subdocuments
    vaccineId:      String
    name:           String
    shortName:      String
    description:    String
    dueDate:        Date
    administeredDate: Date  // null until completed
    status:         "COMPLETED" | "PENDING" | "OVERDUE" | "UPCOMING"
    phase:          Number  // 1–4
    doseNumber:     Number
    series:         String
  }]
  timestamps:   true
}
```

### Otp

```javascript
{
  childId:    ObjectId  // → Child
  vaccineId:  String
  otpHash:    String    // bcrypt hash (never plaintext)
  expiresAt:  Date      // TTL index → auto-delete
  attempts:   Number    // max 5
  used:       Boolean   // invalidated after verification
  doctorId:   ObjectId  // → User (who requested)
  phone:      String    // target phone
  timestamps: true
}
// Indexes: { expiresAt: 1 } TTL, { childId: 1, vaccineId: 1, used: 0 } compound
```

---

## 🩺 NIS 2025 Vaccine Schedule

The VaxCalc engine implements the complete **National Immunization Schedule** with 25 vaccines across 4 phases:

| Phase | Age Range | Vaccines |
|---|---|---|
| **1 — Birth Window** | 0–15 days | BCG, OPV-0, Hep-B Birth Dose |
| **2 — Primary Series** | 6–14 weeks | OPV (1–3), Pentavalent (1–3), Rotavirus (1–3), fIPV (1–2), PCV (1–2) |
| **3 — Boosters** | 9–16 months | MR (1–2), JE (1–2), PCV Booster, DPT-B1, OPV Booster |
| **4 — School Age** | 5–16 years | DPT-B2, Td-10, Td-16 |

Each vaccine has:
- **Due date** computed from DOB (weeks/months/years arithmetic)
- **Grace period** (1–365 days) before marking overdue
- **Minimum interval** between doses in multi-dose series
- **Status** dynamically computed: >7 days out = UPCOMING, within grace = PENDING, past grace = OVERDUE

---

## 🔐 Security

| Layer | Implementation |
|---|---|
| **Authentication** | JWT Bearer tokens with configurable expiry |
| **Password Storage** | bcrypt with salt rounds = 10 |
| **OTP Storage** | bcrypt with salt rounds = 6 (lower cost for short-lived tokens) |
| **HTTP Headers** | Helmet middleware (CSP, HSTS, X-Frame-Options, etc.) |
| **CORS** | Explicit origin whitelist + dev mode localhost auto-allow |
| **Rate Limiting** | Global: 100 req/15min; OTP send: 10/15min; OTP verify: 15/5min |
| **Input Validation** | express-validator on all endpoints |
| **Error Handling** | Centralized error middleware (Mongoose, JWT, validation errors) |
| **Secrets** | `.env` files excluded via `.gitignore` |

---

## 🧹 Maintenance Scripts

```bash
# Seed database with demo data
cd server && npm run seed

# Find orphan parent accounts (dry run — no deletions)
cd server && npm run cleanup:orphan-parents:dry

# Remove orphan parent accounts
cd server && npm run cleanup:orphan-parents
```

---

## 🚢 Deployment

### Frontend (Static Host)

```bash
npm run build        # Outputs to dist/
```

Deploy `dist/` to **Netlify**, **Vercel**, **Cloudflare Pages**, or any static host. Set `VITE_API_URL` to your backend URL during build.

### Backend (Node Service)

Deploy to **Render**, **Railway**, **Fly.io**, or any Node.js host:

1. Set `NODE_ENV=production`
2. Set `DATABASE_URL` to MongoDB Atlas connection string
3. Set `JWT_SECRET` to a strong 32+ char secret
4. Set `CLIENT_URL` to your frontend's deployed URL
5. Set `SMS_PROVIDER` and credentials for production SMS
6. Start command: `npm start`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Team Algorythms**

- GitHub: [@harshhsharmaa57](https://github.com/harshhsharmaa57)
- Repository: [VacciTrackV2](https://github.com/harshhsharmaa57/VacciTrackV2)

---

<p align="center">
  <strong>Built with ❤️ for a healthier India</strong>
</p>
