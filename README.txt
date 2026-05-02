==================================================
  TaskFlow - Project Management App
==================================================

LIVE URLS
---------
Frontend (Vercel):   https://ethara-task-manager-seven.vercel.app
Backend API (Railway): https://ethara-task-manager-production-fd6b.up.railway.app
GitHub Repository:   https://github.com/alkasingh9911/-ethara-task-manager


FEATURES
--------
- Authentication        : JWT-based signup/login
- Projects              : Create, manage, and delete projects
- Team Management       : Invite members, assign roles (Admin/Member)
- Tasks                 : Create, assign, filter, and track tasks with status & priority
- Dashboard             : Overview of stats, your tasks, overdue items
- Role-Based Access     : Admins manage everything; Members update task status only


TECH STACK
----------
Frontend            : React 18, Vite, TailwindCSS, React Query
Backend             : Node.js, Express
Database            : PostgreSQL via Prisma ORM
Auth                : JWT (jsonwebtoken + bcryptjs)
Frontend Deployment : Vercel
Backend Deployment  : Railway


PROJECT STRUCTURE
-----------------
ethara-task-manager/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        (DB models)
│   │   └── seed.js              (Demo data)
│   ├── src/
│   │   ├── index.js             (Express app entry)
│   │   ├── lib/prisma.js        (Prisma client)
│   │   ├── middleware/
│   │   │   ├── auth.js          (JWT + RBAC middleware)
│   │   │   └── errorHandler.js  (Async error wrapper)
│   │   └── routes/              (auth, projects, tasks, users, dashboard)
│   └── railway.toml
└── frontend/
    ├── src/
    │   ├── components/          (Layout, Modal, Badges)
    │   ├── context/             (AuthContext)
    │   ├── lib/api.js           (Axios instance)
    │   └── pages/               (Dashboard, Projects, ProjectDetail, Profile)
    └── vercel.json


LOCAL DEVELOPMENT
-----------------
Prerequisites: Node.js 18+, PostgreSQL

Backend:
  cd backend
  cp .env.example .env
  # Set DATABASE_URL and JWT_SECRET in .env
  npm install
  npx prisma db push
  node prisma/seed.js
  npm run dev               (starts on port 5000)

Frontend:
  cd frontend
  cp .env.example .env
  # Set VITE_API_URL=http://localhost:5000/api in .env
  npm install
  npm run dev               (starts on port 5173)


DEPLOYMENT
----------
Backend (Railway):
  1. Create a Railway project at railway.app
  2. Add a PostgreSQL database service
  3. Add a service from GitHub repo, Root Directory: backend
  4. Set environment variables:
       DATABASE_URL = (from PostgreSQL service)
       JWT_SECRET   = (a long random string)
       CLIENT_URL   = (your Vercel frontend URL)
  5. railway.toml handles prisma db push and server start automatically

Frontend (Vercel):
  1. Go to vercel.com, import GitHub repo
  2. Set Root Directory to: frontend
  3. Add environment variable:
       VITE_API_URL = https://ethara-task-manager-production-fd6b.up.railway.app/api
  4. Deploy — vercel.json handles SPA routing

Seed Demo Data (Railway Shell):
  node prisma/seed.js

  Demo accounts:
    admin@taskflow.com  / password123
    member@taskflow.com / password123


API REFERENCE
-------------
POST   /api/auth/signup                        Register
POST   /api/auth/login                         Login
GET    /api/auth/me                  [auth]    Current user
GET    /api/projects                 [auth]    List my projects
POST   /api/projects                 [auth]    Create project
GET    /api/projects/:id             [member]  Project details
PUT    /api/projects/:id             [admin]   Update project
DELETE /api/projects/:id             [admin]   Delete project
POST   /api/projects/:id/members     [admin]   Invite member
DELETE /api/projects/:id/members/:id [admin]   Remove member
GET    /api/projects/:id/tasks       [member]  List tasks
POST   /api/projects/:id/tasks       [member]  Create task
PUT    /api/tasks/:taskId            [member*] Update task
DELETE /api/tasks/:taskId            [admin]   Delete task
GET    /api/dashboard                [auth]    Dashboard stats
GET    /api/users/search?q=          [auth]    Search users
PUT    /api/users/me                 [auth]    Update profile

* Members can only update status; Admins can update all fields.


ROLE PERMISSIONS
----------------
Action                    Admin   Member
-----------------------------------------
Create/delete project       YES     NO
Invite/remove members       YES     NO
Create tasks                YES     YES
Edit task (all fields)      YES     NO
Update task status          YES     YES
Delete tasks                YES     NO
