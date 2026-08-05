# WorkTrack — Employee Work Tracking System

A production-grade employee task tracking system built with Next.js 16 (App
Router), TypeScript, MongoDB/Mongoose, NextAuth v5, TanStack Query, and
Tailwind + shadcn-style components.

This README documents what's included, what's intentionally deferred, and
how to run it.

## What's included

- **Email/password auth** (NextAuth v5, Credentials provider, JWT sessions,
  bcrypt hashing). Deactivated accounts are blocked at both the auth layer
  and the proxy/middleware layer with the exact message specified in the
  brief.
- **Role-based access control** for `SUPER_ADMIN`, `ADMIN`, `EMPLOYEE`,
  centralized in `utils/permissions.ts` — a single permissions matrix, not
  scattered `if (role === ...)` checks, so it's easy to extend for future
  modules.
- **Route protection** via `proxy.ts` (Next 16's renamed middleware
  convention) plus per-route checks in every API handler (defense in depth).
- **Employee management**: Super Admin can create Admins/Employees,
  activate/deactivate, and delete. Admins can view but not manage.
- **Task management**: full lifecycle (Pending → In Progress → Completed /
  Delayed / Cancelled), priority, department, completion %, remarks, time
  tracking, and a append-only **timeline** of every update (the "10:00 AM
  Started task..." style trail from the spec).
- **Delay workflow**: employees submit a reason + new expected date once a
  deadline passes; Admin/Super Admin approve or reject.
- **Dashboards**: role-aware — Admin sees company-wide stats + charts
  (tasks by status, tasks per employee); Employee sees their own
  today/pending/completed/delayed counts and task list.
- **Notifications**: in-app, created on task assignment, task completion,
  and delay submission/review; polled client-side.
- **Search & filters**: employees (name/email/department) and tasks
  (search, status, priority).
- **Security**: Zod validation on every API input, bcrypt password hashing,
  a simple in-memory rate limiter on write endpoints (`lib/rateLimit.ts` —
  swap for Redis/Upstash behind a load balancer), and role checks on every
  route handler in addition to the proxy.
- **Architecture**: repository-pattern `services/` layer between routes and
  Mongoose models, `hooks/` wrapping TanStack Query, a centralized
  `lib/apiClient.ts`, and shared `types/`. New modules (attendance, leave,
  payroll, chat, CRM, etc.) plug in as new models + services + routes +
  dashboard cards without touching this core.

## What's deliberately not built

The brief's "Future Ready Architecture" section lists ~20 future modules
(attendance, payroll, chat, video calls, CRM, invoices, AI assistant, and
so on). Those are **explicitly future modules** in the spec, not part of
the current deliverable list — this build makes sure they *can* be added
without refactoring (clean service layer, RBAC matrix, notification system
already in place) rather than stubbing all of them out now.

A few smaller things to know about:
- Notifications are polled (30s), not pushed via websockets — swap in
  Pusher/Ably or a websocket server if you need real-time push.
- File attachments on tasks are marked "(Future)" in the brief itself and
  are not implemented.
- There's no email delivery (e.g. "deadline approaching" emails) — only
  in-app notifications. The brief specifies email *login*, not email
  *sending*.

## Getting started

### 1. Prerequisites
- Node.js 20+
- A MongoDB instance (local or Atlas)

### 2. Install
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env.local
```
Fill in `MONGODB_URI`, a strong random `NEXTAUTH_SECRET` (e.g.
`openssl rand -base64 32`), and the bootstrap Super Admin credentials.

### 4. Create the Super Admin
Nobody can create a Super Admin from the UI (Admins can't create Admins,
and there's no self-registration — by design, per the spec). Run the seed
script once against a fresh database:
```bash
npm run seed:super-admin
```

### 5. Run
```bash
npm run dev
```
Visit `http://localhost:3000`, sign in with the Super Admin credentials,
and start creating Admins/Employees from **Employees → Add employee / admin**.

### 6. Build for production
```bash
npm run build
npm run start
```

## Project structure

```
app/
  (auth)/login/          Public login screen
  dashboard/              Protected app shell (layout has the sidebar/navbar)
    page.tsx              Role-aware overview (Admin stats vs Employee stats)
    employees/             Employee management (Super Admin manages, Admin views)
    tasks/                 Task list + detail (assign, update, timeline, delay)
    reports/               Charts (tasks by status, tasks per employee)
    notifications/         Notification inbox
    profile/                Current user's profile
    messages/               Direct + group chat, with Admin/Super Admin monitoring tab
  api/                    Route handlers (users, tasks, notifications, departments, dashboard stats, chat)
components/
  ui/                     Reusable shadcn-style primitives (button, card, dialog, table, ...)
  common/                 Sidebar, Navbar
  dashboard/              Stat cards, admin/employee overview widgets, timeline
  chat/                   Conversation list, chat thread, new-chat dialog
  tables/ forms/ charts/  Feature-specific composed components
hooks/                    TanStack Query hooks (useTasks, useEmployees, useNotifications, useChat, ...)
services/                 Repository-pattern data access (userService, taskService, notificationService, chatService)
models/                   Mongoose schemas (User, Task, TaskUpdate, Notification, Department, Conversation, Message)
lib/                      db connection, auth config, validation schemas, api client, rate limiter, utils
utils/permissions.ts      Centralized RBAC matrix
types/                    Shared TypeScript types
proxy.ts                  Route protection (Next 16's middleware convention)
scripts/seed-super-admin.ts
```

## Messaging

- Any active user (Employee, Admin, Super Admin) can open a 1:1 chat with
  any other active user, regardless of role — go to **Messages → New chat**.
- Every active user is automatically a member of the single, auto-managed
  **Company Group** (no one needs to be invited; new hires are folded in
  the next time anyone opens the group).
- Chat is polling-based (TanStack Query, 5–15s intervals) via
  `/api/chat/*`, matching the existing Notifications pattern — there's no
  WebSocket server in this stack, so this is the low-complexity option
  that still feels close to real-time.
- **Oversight (read-only):** Super Admin can view every conversation in
  the workspace (all Employee + Admin chats). Admin can view every
  conversation that has at least one Employee participant. This lives
  under the **Team Chats** tab on the Messages page and is backed by
  `/api/chat/monitor`, which is intentionally read-only (no POST route) —
  monitoring is for oversight, not for posting as someone else.

## Notes on the tech choices

- **NextAuth v5 (`5.0.0-beta.31`)** is used because it's the version with
  a stable Next.js 16 peer-dependency range; v5 is still in beta upstream,
  so pin this version deliberately rather than floating to `@latest`.
- **`proxy.ts`** replaces the old `middleware.ts` file name, which Next
  16.2 deprecated in favor of `proxy.ts` (same API, same `config.matcher`).
- The build has been verified end-to-end with `npm run build` against this
  exact dependency set.
