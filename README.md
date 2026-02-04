# VacciTrack

VacciTrack is a full‑stack immunization management system for tracking children’s vaccination schedules, designed for real-world clinic workflows and parent-facing visibility. It provides role-based portals (Parent/Doctor), automatic schedule generation, multilingual UI, and a modern accessible interface.

## Key features

- **Role-based access**: Parent portal and Doctor portal with protected routes.
- **Auto vaccine schedule**: Generates a schedule from child DOB (NIS-style phases).
- **Status tracking**: UPCOMING / PENDING / OVERDUE / COMPLETED.
- **Doctor actions**: Search children and update vaccine administration status.
- **Parent actions**: Add children, view schedule, delete child records.
- **Business rule enforced**: **A parent cannot exist with 0 children**. If the last child is deleted, the parent account is removed and the user is logged out.
- **Theme + i18n**: Dark mode default with toggle, and English/Hindi language toggle.

## Tech stack

### Frontend

- **React 18 + TypeScript + Vite**
- **Routing**: `react-router-dom`
- **Styling**: Tailwind CSS + CSS variables design tokens
- **UI components**: shadcn/ui (Radix UI primitives)
- **Data fetching**: `@tanstack/react-query`
- **Forms/validation**: `react-hook-form`, `zod`, `@hookform/resolvers`
- **Animations**: `framer-motion`
- **Charts**: `recharts`
- **Toasts**: `sonner`
- **Icons**: `lucide-react`
- **Theming**: `next-themes` (dark default)

### Backend

- **Node.js + Express**
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (`jsonwebtoken`) + password hashing (`bcryptjs`)
- **Security**: `helmet`, `cors`, `express-rate-limit`
- **Validation**: `express-validator`
- **Logging**: `morgan` (dev)
- **Dev**: `nodemon`

## Repository structure

```
VacciTrack/
  src/                 # Frontend (React)
  server/              # Backend (Express)
```

## Getting started (local)

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1) Install dependencies

```bash
npm install
cd server
npm install
```

### 2) Configure environment variables

Create `server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
JWT_EXPIRY=7d
FRONTEND_URL=http://localhost:8080
```

Create root `.env` (frontend):

```env
VITE_API_URL=http://localhost:5000/api
```

### 3) Run the apps

Backend:

```bash
cd server
npm run dev
```

Frontend:

```bash
# from repo root
npm run dev
```

Frontend runs on `http://localhost:8080` (per `vite.config.ts`).

## Demo credentials

- **Parent**: `parent@demo.com` / `password123`
- **Doctor**: `doctor@aiims.com` / `password123`

If you need demo data, run:

```bash
cd server
npm run seed
```

## API overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`
- `GET /api/children` (parents get their own; doctors get all)
- `GET /api/children/search` (doctor)
- `POST /api/children` (parent creates for self; doctor can set `parentId`)
- `PUT /api/children/:id/vaccines/:vaccineId` (doctor)
- `DELETE /api/children/:id` (doctor any; parent only own)

## Data integrity rule: no orphan parents

The backend deletes the parent account automatically when their **last child** is deleted.  
For existing databases, you can remove old orphan parents with:

```bash
cd server
npm run cleanup:orphan-parents:dry
npm run cleanup:orphan-parents
```

## Deployment notes

- Build frontend: `npm run build` → outputs to `dist/`
- Serve frontend `dist/` via any static host (Netlify/Vercel/Nginx)
- Deploy backend as a Node service (Render/Railway/Heroku) with environment variables set
