# ⚡ TaskFlow — Project Management App

A full-stack project management web app with role-based access control, task tracking, and team collaboration.

## 🌐 Live URLs

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://ethara-task-manager-seven.vercel.app |
| Backend API (Railway) | https://ethara-task-manager-production-fd6b.up.railway.app |
| GitHub Repository | https://github.com/alkasingh9911/-ethara-task-manager |

## ✅ Features

- **Authentication** — JWT-based signup/login
- **Projects** — Create, manage, and delete projects
- **Team Management** — Invite members, assign roles (Admin/Member)
- **Tasks** — Create, assign, filter, and track tasks with status & priority
- **Dashboard** — Overview of stats, your tasks, overdue items
- **Role-Based Access** — Admins manage everything; Members update task status only

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, TailwindCSS, React Query |
| Backend | Node.js, Express |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Frontend Deployment | Vercel |
| Backend Deployment | Railway |

## 📁 Project Structure

```
ethara-task-manager/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # DB models
│   │   └── seed.js              # Demo data
│   ├── src/
│   │   ├── index.js             # Express app entry
│   │   ├── lib/prisma.js        # Prisma client
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT + RBAC middleware
│   │   │   └── errorHandler.js  # Async error wrapper
│   │   └── routes/              # auth, projects, tasks, users, dashboard
│   └── railway.toml
└── frontend/
    ├── src/
    │   ├── components/          # Layout, Modal, Badges
    │   ├── context/             # AuthContext
    │   ├── lib/api.js           # Axios instance
    │   └── pages/               # Dashboard, Projects, ProjectDetail, Profile
    └── vercel.json
```

## 💻 Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET

npm install
npx prisma db push        # Create tables
node prisma/seed.js       # Seed demo data
npm run dev               # Starts on :5000
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env — set VITE_API_URL=http://localhost:5000/api

npm install
npm run dev               # Starts on :5173
```

## 🚀 Deployment

### Backend — Railway

1. Go to [railway.app](https://railway.app) → New Project
2. Add a **PostgreSQL** database service
3. Add a new service from **GitHub Repo**, set Root Directory to `backend`
4. Set environment variables:
   ```
   DATABASE_URL   = <from PostgreSQL service — use ${{Postgres.DATABASE_URL}}>
   JWT_SECRET     = <a long random string>
   CLIENT_URL     = <your Vercel frontend URL>
   ```
5. Railway auto-runs `prisma db push` and starts the server via `railway.toml`

### Frontend — Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → import GitHub repo
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   ```
   VITE_API_URL = https://ethara-task-manager-production-fd6b.up.railway.app/api
   ```
4. Deploy — `vercel.json` handles SPA routing automatically

### Seed Demo Data

In Railway → backend service → Shell:
```bash
node prisma/seed.js
```

Demo accounts:
- `admin@taskflow.com` / `password123`
- `member@taskflow.com` / `password123`

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | — | Register |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | ✓ | Current user |
| GET | `/api/projects` | ✓ | List my projects |
| POST | `/api/projects` | ✓ | Create project |
| GET | `/api/projects/:id` | Member | Project details |
| PUT | `/api/projects/:id` | Admin | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project |
| POST | `/api/projects/:id/members` | Admin | Invite member |
| DELETE | `/api/projects/:id/members/:userId` | Admin | Remove member |
| GET | `/api/projects/:projectId/tasks` | Member | List tasks |
| POST | `/api/projects/:projectId/tasks` | Member | Create task |
| PUT | `/api/tasks/:taskId` | Member* | Update task |
| DELETE | `/api/tasks/:taskId` | Admin | Delete task |
| GET | `/api/dashboard` | ✓ | Dashboard stats |
| GET | `/api/users/search?q=` | ✓ | Search users |
| PUT | `/api/users/me` | ✓ | Update profile |

*Members can only update `status`; Admins can update all fields.

## 🔐 Role Permissions

| Action | Admin | Member |
|--------|-------|--------|
| Create/delete project | ✅ | ❌ |
| Invite/remove members | ✅ | ❌ |
| Create tasks | ✅ | ✅ |
| Edit task (all fields) | ✅ | ❌ |
| Update task status | ✅ | ✅ |
| Delete tasks | ✅ | ❌ |
