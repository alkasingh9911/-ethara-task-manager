# ⚡ TaskFlow — Project Management App

A full-stack project management web app with role-based access control, task tracking, and team collaboration.

## Features

- **Authentication** — JWT-based signup/login
- **Projects** — Create, manage, and delete projects
- **Team Management** — Invite members, assign roles (Admin/Member)
- **Tasks** — Create, assign, filter, and track tasks with status & priority
- **Dashboard** — Overview of stats, your tasks, overdue items
- **Role-Based Access** — Admins manage everything; Members update task status only

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, TailwindCSS, React Query |
| Backend | Node.js, Express |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Deployment | Railway |

## Project Structure

```
taskflow/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # DB models
│   │   └── seed.js           # Demo data
│   ├── src/
│   │   ├── index.js          # Express app entry
│   │   ├── lib/prisma.js     # Prisma client
│   │   ├── middleware/auth.js # JWT + RBAC middleware
│   │   └── routes/           # auth, projects, tasks, users, dashboard
│   └── railway.toml
└── frontend/
    ├── src/
    │   ├── components/       # Layout, Modal, Badges
    │   ├── context/          # AuthContext
    │   ├── lib/api.js        # Axios instance
    │   └── pages/            # Dashboard, Projects, ProjectDetail, Profile
    └── railway.toml
```

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

npm install
npx prisma db push        # Create tables
npx prisma generate       # Generate client
node prisma/seed.js       # Seed demo data
npm run dev               # Start on :5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev               # Start on :5173
```

## Deployment on Railway

### 1. Create a Railway project

Go to [railway.app](https://railway.app) and create a new project.

### 2. Add PostgreSQL

In your Railway project, click **+ New** → **Database** → **PostgreSQL**.  
Copy the `DATABASE_URL` from the database's **Variables** tab.

### 3. Deploy the Backend

- Click **+ New** → **GitHub Repo** → select your repo
- Set the **Root Directory** to `backend`
- Add environment variables:
  ```
  DATABASE_URL=<from PostgreSQL service>
  JWT_SECRET=<a long random string>
  CLIENT_URL=<your frontend Railway URL>
  PORT=5000
  ```
- Railway will auto-detect `railway.toml` and run migrations on deploy

### 4. Deploy the Frontend

- Click **+ New** → **GitHub Repo** → select your repo again
- Set the **Root Directory** to `frontend`
- Add environment variable:
  ```
  VITE_API_URL=https://<your-backend-service>.railway.app/api
  ```

### 5. Seed Demo Data (optional)

In the Railway backend service shell:
```bash
node prisma/seed.js
```

Demo accounts:
- `admin@taskflow.com` / `password123`
- `member@taskflow.com` / `password123`

## API Reference

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

## Role Permissions

| Action | Admin | Member |
|--------|-------|--------|
| Create/delete project | ✅ | ❌ |
| Invite/remove members | ✅ | ❌ |
| Create tasks | ✅ | ✅ |
| Edit task (all fields) | ✅ | ❌ |
| Update task status | ✅ | ✅ |
| Delete tasks | ✅ | ❌ |
