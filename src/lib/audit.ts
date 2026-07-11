import { prisma } from "@/lib/prisma";

export async function audit(input: {
  userId?: string;
  actorName: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  await prisma.activityLog.create({
    data: {
      userId: input.userId,
      actorName: input.actorName,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata: input.metadata === undefined ? undefined : JSON.parse(JSON.stringify(input.metadata)),
      ipAddress: input.ipAddress ?? undefined,
      userAgent: input.userAgent ?? undefined
    }
  });
}
