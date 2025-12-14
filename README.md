# VacciTrack 🛡️💉

## A Next-Gen Progressive Web App for Smarter Immunization Tracking

**Built by Team Algorythms** | Led by Anvita Shukla

![Stack](https://img.shields.io/badge/Stack-React_+_TypeScript-success.svg)
![Status](https://img.shields.io/badge/Status-Hackathon_Ready-orange.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

---

## 📖 The Problem

In India, millions of children miss critical vaccines due to:
- Lost or degraded paper cards (Mamta Card)
- Forgotten vaccination dates
- Lack of portable digital records in rural areas

VacciTrack digitizes this process, creating a portable, intelligent immunization record that follows the child across healthcare jurisdictions.

---

## 🚀 Key Features

### 🧠 VaxCalc Engine
Automatically generates a comprehensive vaccination schedule based on Date of Birth using **National Immunization Schedule (NIS) 2025** rules.

### 🎨 Visual Timeline
A stunning, vertical timeline visualizing the child's complete health journey with color-coded status indicators:
- 🟢 **Green**: Completed vaccines
- 🟡 **Amber**: Pending (due within 7 days)
- 🔴 **Red**: Overdue vaccines
- ⚪ **Gray**: Upcoming vaccines

### 🔐 Dual Access Portal
- **Parent Portal**: View schedule, get reminders, download certificates
- **Healthcare Provider Portal**: Verify patients via ABHA ID, one-tap record updates

### 🎮 Gamification
- **Shield Level System**: Track immunity progress with engaging badges
- **Confetti Celebration**: Visual reward on vaccine completion
- **Progress Tracking**: Motivation through achievement unlocking

### 🌐 Multilingual Support
Instant toggle between **English** and **Hindi** (हिंदी) for broader accessibility.

### 📱 Progressive Web App
Fully responsive design optimized for mobile-first rural connectivity.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + Custom Design System |
| Animations | Framer Motion |
| State | React Context + In-Memory Repository |
| Routing | React Router v6 |
| UI Components | shadcn/ui (customized) |

### Architecture Highlights

**Repository Design Pattern**: Data access layer is abstracted via repository classes, making it trivial to swap from In-Memory Arrays to MongoDB/PostgreSQL.

**In-Memory Data Store**: Zero database latency for hackathon demos - instant, reliable performance.

---

## ⚙️ Installation Guide

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/vaccitrack.git
cd vaccitrack
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
# VacciTrack Environment Configuration
# =====================================

# Application Settings
VITE_APP_NAME=VacciTrack
VITE_APP_VERSION=1.0.0

# API Configuration (for future backend integration)
VITE_API_URL=http://localhost:5000/api
VITE_API_TIMEOUT=30000

# Authentication
VITE_JWT_SECRET=vaccitrack_super_secret_hackathon_key_2025
VITE_JWT_EXPIRY=7d

# Feature Flags
VITE_ENABLE_SMS_NOTIFICATIONS=false
VITE_ENABLE_PUSH_NOTIFICATIONS=false
VITE_ENABLE_OFFLINE_MODE=true

# Demo Mode
VITE_DEMO_MODE=true

# Analytics (optional)
VITE_ANALYTICS_ID=

# Supabase (for future integration)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### 4. Start Development Server
```bash
npm run dev
```
Application will launch at **http://localhost:8080**

---

## 🔑 Demo Credentials

Pre-seeded accounts for immediate testing:

### 👨‍👩‍👧 Parent Login
| Field | Value |
|-------|-------|
| Email | `parent@demo.com` |
| Password | `password123` |
| Child | Aarav Sharma (has pending vaccines) |

### 👨‍⚕️ Healthcare Provider Login
| Field | Value |
|-------|-------|
| Email | `doctor@aiims.com` |
| Password | `password123` |
| Access | Can view/modify all patient records |

---

## 🧪 Testing the Complete Flow

1. **Login as Parent**: See Aarav's vaccination timeline with amber (pending) vaccines

2. **Login as Doctor** (use incognito): Search for "Aarav", click the "Administer" button on a pending vaccine

3. **Check Parent View**: Refresh - the vaccine is now green (completed) with confetti celebration!

4. **Language Toggle**: Click the globe icon to switch between English/Hindi

5. **Add New Child**: Use the "Add Child" button to register a new child and auto-generate their NIS schedule

---

## 📁 Project Structure

```
vaccitrack/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ChildCard.tsx     # Child profile cards
│   │   ├── ConfettiExplosion.tsx
│   │   ├── Navbar.tsx
│   │   ├── ShieldBadge.tsx   # Gamification badge
│   │   ├── StatsCard.tsx
│   │   └── VaccineTimeline.tsx
│   ├── context/              # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── LanguageContext.tsx
│   ├── lib/                  # Core logic & utilities
│   │   ├── dataStore.ts      # In-memory repository
│   │   ├── i18n.ts           # Translations
│   │   ├── utils.ts
│   │   └── vaccineSchedule.ts # VaxCalc engine
│   ├── pages/                # Route pages
│   │   ├── ChildDetail.tsx
│   │   ├── DoctorDashboard.tsx
│   │   ├── Login.tsx
│   │   ├── NotFound.tsx
│   │   └── ParentDashboard.tsx
│   ├── App.tsx               # Main app with routing
│   ├── index.css             # Design system tokens
│   └── main.tsx
├── .env                      # Environment variables
├── index.html
├── tailwind.config.ts
└── README.md
```

---

## 🗓️ National Immunization Schedule (NIS) 2025

VacciTrack implements the complete NIS with 4 phases:

### Phase 1: Birth Window (0-15 Days)
- BCG, OPV-0, Hepatitis B Birth Dose

### Phase 2: Primary Series (6, 10, 14 Weeks)
- OPV, Pentavalent, Rotavirus, fIPV, PCV series

### Phase 3: Measles & Boosters (9-24 Months)
- MR-1, MR-2, JE-1, JE-2, DPT Booster, OPV Booster, PCV Booster

### Phase 4: Lifecycle Extensions (5-16 Years)
- DPT Booster 2 (5-6 years)
- Td at 10 years
- Td at 16 years

**Gap Rule Implementation**: Minimum 4-week (28 days) interval between doses is enforced. If a dose is delayed, subsequent doses are automatically rescheduled.

---

## 🔐 Security Features

- **JWT Authentication**: Simulated token-based auth
- **Role-Based Access Control**: Parents can only view their children; Doctors can update any record
- **ABHA ID Simulation**: 14-digit unique identifier for interoperability

---

## 🎨 Design System

Custom medical-themed design with semantic tokens:

| Token | Purpose |
|-------|---------|
| `--primary` | Teal (#0d9488) - Health, calmness |
| `--secondary` | Indigo (#6366f1) - Trust, technology |
| `--success` | Green - Completed vaccines |
| `--warning` | Amber - Pending/Due soon |
| `--destructive` | Rose - Overdue alerts |

---

## 🚀 Future Roadmap

1. **Database Migration**: MongoDB Atlas / Supabase integration
2. **Real SMS Notifications**: Twilio/MSG91 integration
3. **AI VaxBot**: Gemini API for natural language Q&A
4. **Offline Sync**: Service Worker for true offline-first PWA
5. **IoT Cold Chain**: Temperature sensor integration
6. **Real ABHA Integration**: NHA API connectivity

---

## 📊 Hackathon Winning Features

| Feature | Implementation | Why It Wins |
|---------|---------------|-------------|
| Data Store | In-Memory Arrays (Repository Pattern) | Zero latency, no connection failures |
| UI | Tailwind + Framer Motion | Premium animations, "visually appealing" |
| Notifications | Console Log + Visual Alerts | Demonstrates logic without SMS costs |
| Logic | Custom NIS 2025 Algorithm | Deep domain understanding |
| Gamification | Shield Levels + Confetti | Behavioral psychology for compliance |
| i18n | English + Hindi | Social impact for rural India |

---

## 👥 Team Algorythms

- **Anvita Shukla** - Team Lead
- Built with ❤️ for India's children

---

## 📄 License

MIT License - Free for educational and non-commercial use.

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit PRs.

---

**VacciTrack** - *Digitizing India's Last Mile in Immunization* 🇮🇳
