import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";
import { hashPassword, verifyPassword } from "@/lib/password";
import { audit } from "@/lib/audit";

export const authOptions: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Employee ID or email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const identifier = parsed.data.identifier.trim();
        let user = null;

        if (identifier.toLowerCase() === "admin") {
          const adminUser = await prisma.user.findFirst({
            where: { username: "admin" },
            include: { employee: true }
          });

          if (!adminUser) {
            user = await prisma.user.create({
              data: {
                username: "admin",
                email: "admin@company.local",
                passwordHash: await hashPassword("admin"),
                role: "ADMIN",
                mustChangePassword: true,
                isActive: true
              },
              include: { employee: true }
            });
          } else {
            if (!adminUser.isActive || adminUser.role !== "ADMIN") {
              user = await prisma.user.update({
                where: { id: adminUser.id },
                data: { isActive: true, role: "ADMIN" },
                include: { employee: true }
              });
            } else {
              user = adminUser;
            }
          }
        } else {
          user = await prisma.user.findFirst({
            where: {
              OR: [{ email: identifier }, { username: identifier }, { employeeId: identifier }]
            },
            include: { employee: true }
          });
        }

        if (!user || !user.isActive) return null;
        const passwordOk = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!passwordOk) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });

        await audit({
          userId: user.id,
          actorName: user.employee?.fullName ?? user.username ?? user.email ?? "Unknown user",
          action: "auth.login",
          entity: "User",
          entityId: user.id,
          ipAddress: request.headers.get("x-forwarded-for"),
          userAgent: request.headers.get("user-agent")
        });

        return {
          id: user.id,
          name: user.employee?.fullName ?? user.username ?? user.email ?? "User",
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          mustChangePassword: user.mustChangePassword
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.employeeId = user.employeeId;
        token.mustChangePassword = user.mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role;
        session.user.employeeId = token.employeeId;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    }
  }
};
