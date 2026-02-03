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


### 3. Start Development Server
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

## 🗄️ Supabase Integration Guide

To migrate from in-memory storage to persistent Supabase database:

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **Anon Key** from Settings → API

### Step 2: Database Schema

Run these SQL migrations in Supabase SQL Editor:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create enum for user roles
create type public.app_role as enum ('parent', 'doctor');

-- Create enum for gender
create type public.gender_type as enum ('male', 'female');

-- Create enum for vaccine status
create type public.vaccine_status as enum ('COMPLETED', 'PENDING', 'OVERDUE', 'UPCOMING');

-- Users table (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text not null,
  phone text,
  hospital_name text,
  created_at timestamp with time zone default now()
);

-- User roles table (separate for security)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

-- Children table
create table public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  date_of_birth date not null,
  gender gender_type not null,
  abha_id text unique not null,
  created_at timestamp with time zone default now()
);

-- Vaccination schedule table
create table public.vaccination_schedule (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references public.children(id) on delete cascade not null,
  vaccine_id text not null,
  vaccine_name text not null,
  vaccine_type text not null,
  description text,
  due_date date not null,
  status vaccine_status default 'UPCOMING',
  administered_date date,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.children enable row level security;
alter table public.vaccination_schedule enable row level security;

-- Security definer function for role checking
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- RLS Policies

-- Profiles: Users can read their own, doctors can read all
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Doctors can view all profiles"
  on public.profiles for select
  using (public.has_role(auth.uid(), 'doctor'));

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Children: Parents see their children, doctors see all
create policy "Parents can view own children"
  on public.children for select
  using (auth.uid() = parent_id);

create policy "Doctors can view all children"
  on public.children for select
  using (public.has_role(auth.uid(), 'doctor'));

create policy "Parents can insert own children"
  on public.children for insert
  with check (auth.uid() = parent_id);

create policy "Doctors can insert children"
  on public.children for insert
  with check (public.has_role(auth.uid(), 'doctor'));

-- Vaccination Schedule
create policy "Parents can view own children schedules"
  on public.vaccination_schedule for select
  using (
    exists (
      select 1 from public.children
      where children.id = vaccination_schedule.child_id
        and children.parent_id = auth.uid()
    )
  );

create policy "Doctors can view all schedules"
  on public.vaccination_schedule for select
  using (public.has_role(auth.uid(), 'doctor'));

create policy "Doctors can update schedules"
  on public.vaccination_schedule for update
  using (public.has_role(auth.uid(), 'doctor'));

-- User roles: Only viewable by owner
create policy "Users can view own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

-- Function to create user profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', 'User'));
  
  -- Default role is parent
  insert into public.user_roles (user_id, role)
  values (new.id, 'parent');
  
  return new;
end;
$$;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### Step 3: Environment Variables

Create a `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Step 5: Create Supabase Client

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Step 6: Update AuthContext

Replace the in-memory auth with Supabase auth:

```typescript
// In AuthContext.tsx, replace userRepository calls with:
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

### Step 7: Update Data Repositories

Replace `dataStore.ts` methods with Supabase queries:

```typescript
// Example: Fetch children
const { data: children } = await supabase
  .from('children')
  .select('*, vaccination_schedule(*)')
  .eq('parent_id', userId);
```

---

## 📊 Hackathon Winning Features

| Feature | Implementation | Why It Wins |
|---------|---------------|-------------|
| Data Store | In-Memory Arrays (Repository Pattern) | Zero latency, no connection failures |
| Doctor Registration | Full child + parent creation flow | Complete workflow demonstration |
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
