import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
async function main() {
  const [email, name = "Mashy Admin", role = "ADMIN"] = process.argv.slice(2);
  if (!email || !["ADMIN", "EDITOR"].includes(role))
    throw new Error(
      'Usage: npm run admin:create -- email "Name" ADMIN|EDITOR (password via stdin)',
    );
  let password = "";
  for await (const chunk of process.stdin) password += chunk;
  password = password.trim();
  if (password.length < 14 || password.length > 72)
    throw new Error("Use a unique password of 14–72 characters");
  await db.adminUser.upsert({
    where: { email: email.toLowerCase() },
    create: {
      email: email.toLowerCase(),
      name,
      role,
      passwordHash: await hash(password, 12),
    },
    update: {
      name,
      role,
      passwordHash: await hash(password, 12),
      sessionVersion: { increment: 1 },
    },
  });
  console.log("Admin account saved. Existing sessions revoked.");
}
main().finally(() => db.$disconnect());
