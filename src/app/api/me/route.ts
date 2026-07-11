import { json } from "@/lib/api";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  return json({ user: session?.user ?? null });
}
