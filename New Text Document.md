# ETMS Deployment & Debugging Log

**Project:** Employee Training Management System (ETMS)

**Repository**
https://github.com/marketingalosra-png/ETMS

**Hosting**
- Vercel
- Neon PostgreSQL
- Prisma ORM
- Next.js 15
- NextAuth v5

---

# Initial Status

The application was deployed successfully to Vercel.

The homepage loaded correctly.

However authentication and database operations failed.

---

# Phase 1 — Neon Database

Created a Neon PostgreSQL database.

Copied the connection string.

Added to Vercel:

DATABASE_URL

Database migration:

```powershell
npx prisma db push
```

Database seed:

```powershell
npx prisma db seed
```

Result:

Database synchronized successfully.

---

# Phase 2 — NextAuth Failure

Initial errors:

```
/api/auth/providers
Bad request.

```

```
/api/auth/session
Bad request.

```

Vercel Runtime Logs:

```
TypeError: Invalid URL

input: NEXTAUTH_URL

```

Cause:

NEXTAUTH_URL inside Vercel was incorrect.

It contained

```
https://example.com
```

instead of

```
https://etms-tan.vercel.app
```

Fixed by editing

Project Settings

Environment Variables

NEXTAUTH_URL

Then redeployed.

---

# Phase 3 — Authentication Fixed

Verification:

```
/api/auth/providers
```

returned

```json
{
 "credentials": {
   "id":"credentials"
 }
}
```

```
/api/auth/session
```

returned

```
null
```

This confirmed NextAuth was working correctly.

---

# Phase 4 — Login

Admin login

```
username:
admin

password:
admin
```

worked.

Application redirected correctly.

Dashboard loaded.

---

# Phase 5 — Employee Creation Failure

Attempting to create an employee produced

```
Employee save failed
```

Vercel Runtime Log:

```
PrismaClientKnownRequestError

P2003

Foreign key constraint violated:

Employee_departmentId_fkey

```

Meaning:

Employee.departmentId references Department.id.

The submitted department did not exist.

---

# Investigation

Prisma Studio:

```
Department
```

contained

```
0 rows
```

Therefore every employee creation referencing departmentId failed.

---

# Fix

Opened Prisma Studio

```
npx prisma studio
```

Created first department.

Values:

Name

```
Administration
```

Description

```
Main Department
```

Manager

```
Admin
```

Color

```
#3B82F6
```

Saved successfully.

Department table now contains

```
1 row
```

---

# API Code

Employee creation route

```
src/app/api/employees/route.ts
```

Current logic:

```ts
departmentId:
  input.departmentId &&
  input.departmentId.trim() !== ""
    ? input.departmentId
    : null
```

Meaning

No department should become

```
null
```

instead of an empty string.

---

# Employee Manager

Current frontend

```
src/components/admin/employee-manager.tsx
```

Uses

```tsx
<option value="">
No department
</option>
```

Posts

```ts
departmentId
```

to

```
POST /api/employees
```

---

# Remaining Issue

Need to verify whether frontend is still submitting

```
departmentId
```

with an invalid value.

If yes,

employeeSchema or the frontend submit function must be corrected.

---

# Authentication Files

auth.ts

```ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const {
  handlers,
  auth,
  signIn,
  signOut
} = NextAuth(authOptions);
```

---

auth-options.ts

Uses

Credentials Provider

Creates admin automatically if missing

```
admin
```

password

```
admin
```

JWT strategy

8-hour sessions

Audit logging

---

Launch page

```
src/app/launch/page.tsx
```

```ts
const session = await auth();

if (!session?.user)
    redirect("/login");

if (session.user.mustChangePassword)
    redirect("/change-password");

redirect(
    session.user.role === "ADMIN"
        ? "/admin/dashboard"
        : "/employee/dashboard"
);
```

---

Prisma

```
DATABASE_URL
```

```
postgresql://...
```

```
NEXTAUTH_URL
```

Local

```
http://localhost:3000
```

Production

```
https://etms-tan.vercel.app
```

---

Prisma Studio

Start

```powershell
npx prisma studio
```

Runs on

```
http://localhost:5555
```

If Studio displays

```
Unable to communicate with Prisma Client
```

Restart

```powershell
Ctrl+C

npm run dev
```

Open a second PowerShell

```powershell
npx prisma studio
```

Do not stop

```
npm run dev
```

while Studio is open.

---

Useful Commands

Project

```powershell
cd C:\Users\Newtech\Desktop\AI\etms
```

Development

```powershell
npm run dev
```

Generate Prisma Client

```powershell
npx prisma generate
```

Push Schema

```powershell
npx prisma db push
```

Seed

```powershell
npx prisma db seed
```

Studio

```powershell
npx prisma studio
```

Git

```powershell
git add .

git commit -m "message"

git push origin main
```

---

Current Status

✅ Vercel deployment working

✅ Neon connected

✅ Prisma connected

✅ NextAuth fixed

✅ Admin login works

✅ Dashboard works

✅ Department table created

⬜ Employee creation still requires final verification

⬜ Verify User table after employee creation

⬜ Verify departmentId submission

⬜ Complete CRUD testing

⬜ Test Training module

⬜ Test Assignments

⬜ Test Password Change

⬜ Test Employee Login

---

Next Debugging Steps

1. Open Prisma Studio.

2. Verify User table.

3. Verify Employee table.

4. Attempt employee creation with Administration selected.

5. Inspect POST payload.

6. Confirm departmentId.

7. Verify User creation.

8. Verify Employee creation.

9. Test employee login.

10. Deploy final build.

---

End of Session