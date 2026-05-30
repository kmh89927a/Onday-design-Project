// Supabase Postgres client (Prisma 7 driver adapter pattern).
//
// Replaces the former in-memory store: diagnoses / share links / saved searches
// now persist to Supabase Postgres, so data survives cold starts and is shared
// across lambda instances (share links keep working across sessions).
//
// Runtime connects via the Supabase pooler (DATABASE_URL, port 6543) using the
// PrismaPg driver adapter — required in Prisma 7, which has no bundled query engine.
// CLI migrations use DIRECT_URL (port 5432); see prisma.config.ts.
//
// Callers use the same `prisma.<model>.<method>` API (diagnosis / shareLink /
// savedSearch) the in-memory wrapper exposed, so no route changes were needed.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Pin the client to globalThis so Next.js dev HMR (and warm Vercel lambdas) reuse a
// single connection pool instead of opening a new one per module reload / request.
const globalForPrisma = globalThis as unknown as {
  __ondayPrisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
  globalForPrisma.__ondayPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__ondayPrisma = prisma;
}
