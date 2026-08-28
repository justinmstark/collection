import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@collection.local" },
    update: {},
    create: {
      email: "admin@collection.local",
      name: "Admin",
      hashedPassword: hashed,
      role: "admin",
    },
  });
  console.log("Seeded admin user: admin@collection.local / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
