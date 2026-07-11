import { type NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { json } from "@/lib/api";
import { auth } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { passwordChangeSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return json({ error: "Unauthorized" }, { status: 401 });

  const body = passwordChangeSchema.safeParse(await request.json());
  if (!body.success) return json({ error: "Invalid password", details: body.error.flatten() }, { status: 422 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return json({ error: "Not found" }, { status: 404 });

  const ok = await verifyPassword(body.data.currentPassword, user.passwordHash);
  if (!ok) return json({ error: "Current password is incorrect" }, { status: 400 });

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(body.data.newPassword), mustChangePassword: false }
  });

  await audit({
    userId: user.id,
    actorName: session.user.name ?? "User",
    action: "auth.password_changed",
    entity: "User",
    entityId: user.id
  });

  return json({ ok: true });
}
