import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      ...(init?.headers ?? {})
    }
  });
}

export async function parseBody<T>(request: NextRequest, schema: ZodSchema<T>) {
  const body = await request.json();
  return schema.parse(body);
}

export async function withApiGuard(
  request: NextRequest,
  handler: () => Promise<Response>,
  options: { adminOnly?: boolean } = {}
) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`${ip}:${request.nextUrl.pathname}`);
  if (!limited.ok) return json({ error: "Too many requests" }, { status: 429 });

  const session = await auth();
  if (!session?.user) return json({ error: "Unauthorized" }, { status: 401 });
  if (options.adminOnly && session.user.role !== "ADMIN") return json({ error: "Forbidden" }, { status: 403 });

  try {
    return await handler();
  } catch (error) {
    if (error instanceof ZodError) return json({ error: "Validation failed", details: error.flatten() }, { status: 422 });
    console.error(error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
