import { type NextRequest } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { json, withApiGuard } from "@/lib/api";
import { auth } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const accountSchema = z.object({
  username: z.string().min(2).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional()
});

export async function PATCH(request: NextRequest) {
  return withApiGuard(request, async () => {
    const session = await auth();
    const input = accountSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { id: session!.user.id } });
    if (!user) return json({ error: "Not found" }, { status: 404 });

    if (input.newPassword) {
      if (!input.currentPassword || !(await verifyPassword(input.currentPassword, user.passwordHash))) {
        return json({ error: "Current password is incorrect" }, { status: 400 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        username: input.username,
        email: input.email,
        passwordHash: input.newPassword ? await hashPassword(input.newPassword) : undefined,
        mustChangePassword: false
      }
    });
    await audit({ userId: user.id, actorName: session!.user.name ?? "User", action: "account.updated", entity: "User", entityId: user.id });
    return json({ user: { id: updated.id, username: updated.username, email: updated.email } });
  });
}
