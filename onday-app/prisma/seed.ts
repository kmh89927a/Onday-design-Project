// Load .env.local first (Supabase connection strings), then .env — this script runs
// as a standalone tsx process and would otherwise not see Next.js's .env.local.
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Seed via the direct connection (5432) when available; the pooler (6543) also works.
const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "test@onday.kr" },
    update: {},
    create: {
      id: "mock-user-001",
      email: "test@onday.kr",
      authProvider: "kakao",
      mode: "couple",
    },
  });

  console.log("Seeded user:", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
