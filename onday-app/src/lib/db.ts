// In-memory store for the Vercel demo deploy.
// Vercel serverless filesystem is read-only + ephemeral, so SQLite + Prisma
// can't be used as-is. Step 13 will swap this out for Supabase Postgres
// (driver adapter pattern); routes use the same `prisma.<model>.<method>` API
// so no caller changes are needed at that point.
//
// Caveats:
//   • Memory persists per warm instance only — cold starts wipe it.
//   • No cross-instance sharing — Vercel may route requests to different lambdas.
//   • Acceptable for a demo where each visit creates a fresh diagnosis.

import { randomUUID } from "crypto";

interface DiagnosisRow {
  id: string;
  userId: string;
  addressA: string;
  addressB: string | null;
  filters: string;
  candidates: string;
  mode: string;
  deadlineMode: boolean;
  deadline: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ShareLinkRow {
  id: string;
  diagnosisId: string;
  uniqueUrl: string;
  passwordHash: string | null;
  expiresAt: Date;
  viewCount: number;
  createdAt: Date;
}

interface SavedSearchRow {
  id: string;
  userId: string;
  searchParams: string;
  savedAt: Date;
}

// Pin stores to globalThis so Next.js dev mode HMR doesn't wipe them between
// requests (and so warm Vercel lambda instances reuse the same Maps).
interface InMemoryStores {
  diagnosis: Map<string, DiagnosisRow>;
  shareLinkById: Map<string, ShareLinkRow>;
  shareLinkByUrl: Map<string, ShareLinkRow>;
  shareLinkByDiagnosis: Map<string, ShareLinkRow>;
  savedSearchByUser: Map<string, SavedSearchRow>;
}
const globalForStores = globalThis as unknown as { __ondayStores?: InMemoryStores };
const stores: InMemoryStores =
  globalForStores.__ondayStores ?? {
    diagnosis: new Map(),
    shareLinkById: new Map(),
    shareLinkByUrl: new Map(),
    shareLinkByDiagnosis: new Map(),
    savedSearchByUser: new Map(),
  };
globalForStores.__ondayStores = stores;
const diagnosisStore = stores.diagnosis;
const shareLinkStoreById = stores.shareLinkById;
const shareLinkStoreByUrl = stores.shareLinkByUrl;
const shareLinkStoreByDiagnosis = stores.shareLinkByDiagnosis;
const savedSearchStoreByUser = stores.savedSearchByUser;

type DiagnosisCreateArg = { data: Omit<DiagnosisRow, "id" | "createdAt" | "updatedAt"> };
type DiagnosisFindArg = { where: { id: string } };

type ShareLinkCreateArg = {
  data: Omit<ShareLinkRow, "id" | "viewCount" | "createdAt">;
};
type ShareLinkFindWhere = { uniqueUrl?: string; diagnosisId?: string };
type ShareLinkUpdateArg = {
  where: { id: string };
  data: { viewCount: { increment: number } };
};

type SavedSearchUpsertArg = {
  where: { userId: string };
  create: Omit<SavedSearchRow, "id" | "savedAt">;
  update: Partial<Omit<SavedSearchRow, "id" | "userId">>;
};
type SavedSearchFindArg = { where: { userId: string } };

export const prisma = {
  diagnosis: {
    async create({ data }: DiagnosisCreateArg) {
      const now = new Date();
      const row: DiagnosisRow = {
        ...data,
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      diagnosisStore.set(row.id, row);
      return row;
    },
    async findUnique({ where }: DiagnosisFindArg) {
      return diagnosisStore.get(where.id) ?? null;
    },
  },

  shareLink: {
    async create({ data }: ShareLinkCreateArg) {
      const row: ShareLinkRow = {
        ...data,
        id: randomUUID(),
        viewCount: 0,
        createdAt: new Date(),
      };
      shareLinkStoreById.set(row.id, row);
      shareLinkStoreByUrl.set(row.uniqueUrl, row);
      shareLinkStoreByDiagnosis.set(row.diagnosisId, row);
      return row;
    },
    findUnique: (async (args: {
      where: ShareLinkFindWhere;
      include?: { diagnosis?: true };
    }) => {
      const { where, include } = args;
      const row =
        (where.uniqueUrl && shareLinkStoreByUrl.get(where.uniqueUrl)) ||
        (where.diagnosisId && shareLinkStoreByDiagnosis.get(where.diagnosisId)) ||
        null;
      if (!row) return null;
      if (include?.diagnosis) {
        const diagnosis = diagnosisStore.get(row.diagnosisId);
        if (!diagnosis) return null;
        return { ...row, diagnosis };
      }
      return row;
    }) as {
      (args: {
        where: ShareLinkFindWhere;
        include: { diagnosis: true };
      }): Promise<(ShareLinkRow & { diagnosis: DiagnosisRow }) | null>;
      (args: { where: ShareLinkFindWhere }): Promise<ShareLinkRow | null>;
    },
    async update({ where, data }: ShareLinkUpdateArg) {
      const row = shareLinkStoreById.get(where.id);
      if (!row) throw new Error(`shareLink ${where.id} not found`);
      row.viewCount += data.viewCount.increment;
      return row;
    },
  },

  savedSearch: {
    async upsert({ where, create, update }: SavedSearchUpsertArg) {
      const existing = savedSearchStoreByUser.get(where.userId);
      if (existing) {
        Object.assign(existing, update, { savedAt: new Date() });
        return existing;
      }
      const row: SavedSearchRow = {
        ...create,
        id: randomUUID(),
        savedAt: new Date(),
      };
      savedSearchStoreByUser.set(row.userId, row);
      return row;
    },
    async findUnique({ where }: SavedSearchFindArg) {
      return savedSearchStoreByUser.get(where.userId) ?? null;
    },
  },
};
