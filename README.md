# Employee Training Management System

A clean, production-minded Employee Training Dashboard built with Next.js 15, TypeScript, Tailwind CSS, Framer Motion, Prisma, PostgreSQL, NextAuth, React Hook Form, and Zod.

The app includes a polished admin dashboard, employee management, training management, assignment workflows, employee learning dashboard, automatic video progress tracking, dark mode, responsive glass UI, animated charts, toasts, loading states, audit activity, and seed data.

## Features

- Admin login with default `admin` / `admin`
- Forced password change on the first admin login
- Employee login by Employee ID or email
- Secure hashed passwords with bcrypt
- Role-based admin and employee areas
- Admin dashboard metrics: total employees, active employees, completed trainings, pending work, late employees, deadlines, watch time, and recent activity
- Employee CRUD: add, edit, delete, disable
- Training CRUD with thumbnail and uploaded, YouTube, or external video URLs
- Assign one or more trainings to selected employees
- Employee dashboard with assigned trainings, progress, completed count, remaining count, and deadline status
- Video progress tracking with last position and automatic completion at 95 percent watched
- Light and dark mode
- Responsive sidebar, top navigation, animated cards, charts, toasts, dialogs, and skeleton components

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Shadcn-compatible component setup
- Framer Motion
- Prisma
- PostgreSQL
- NextAuth
- React Hook Form
- Zod
- Recharts
- Sonner
- Lucide Icons

## Project Structure

```text
src/app                 App Router pages and API routes
src/components          Reusable UI, dashboard, admin, and training components
src/lib                 Auth, Prisma, validation, audit, utilities, API helpers
src/types               NextAuth type augmentation
prisma/schema.prisma    Relational database schema
prisma/seed.ts          Default admin, employees, trainings, assignments, activity
docker-compose.yml      Local PostgreSQL service
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start PostgreSQL:

```bash
docker compose up -d
```

3. Run the migration:

```bash
npx prisma migrate dev
```

4. Seed the database:

```bash
npm run db:seed
```

5. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

The admin account also bootstraps automatically on first login after migration, so the app can start before seed data is loaded. Run `npm run db:seed` when you want the sample employees, trainings, assignments, and activity feed.

## Default Accounts

Admin:

```text
Email / username: admin
Password: admin
```

The first admin login redirects to password change.

Seeded employees use:

```text
Employee ID: EMP-1001 through EMP-1005
Password: Password123!
```

They can also sign in with their seeded email addresses.

## Environment

Copy `.env.example` to `.env` and adjust values for production:

```env
DATABASE_URL="postgresql://etms:etms_password@localhost:5432/etms?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
APP_NAME="Employee Training Management System"
```

Use a strong `NEXTAUTH_SECRET` in production and keep `.env` out of version control.

## Production Notes

- Put PostgreSQL behind managed backups.
- Set `NEXTAUTH_URL` to the deployed domain.
- Rotate `NEXTAUTH_SECRET` through your secret manager.
- Run `npx prisma migrate deploy` during deployment.
- Serve uploaded videos from durable object storage in production, then store the URL in training assets.
- Keep HTTPS enforced at the platform or proxy layer.
