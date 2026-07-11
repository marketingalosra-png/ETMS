import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

async function main() {
  const user = await prisma.user.findFirst({ where: { username: "admin" } });
  if (!user) {
    console.log("No admin user found");
    return;
  }
  console.log("User in DB:", user);
  const match = await bcrypt.compare("admin", user.passwordHash);
  console.log("Comparison result for 'admin':", match);

  const localHash = await bcrypt.hash("admin", 12);
  console.log("Locally generated hash for 'admin':", localHash);
  const localMatch = await bcrypt.compare("admin", localHash);
  console.log("Comparison result for local hash:", localMatch);
}

main().catch(console.error);
