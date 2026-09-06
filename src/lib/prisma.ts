import { PrismaClient } from "@prisma/client";

/**
 * Neon's pooled endpoint fronts Postgres with PgBouncer in transaction mode, so
 * Prisma has to be told not to depend on server-side prepared statements
 * (`pgbouncer=true`) or queries intermittently fail and get retried.
 *
 * The pooled URL is injected read-only by the Vercel/Neon integration, so the
 * required parameters are appended here instead of in the environment variable.
 * `connection_limit` stays small to avoid every serverless instance holding a
 * fistful of pooler connections, but above 1 so that the `Promise.all` batches
 * in the dashboard/payments queries still overlap on the wire.
 */
function pooledDatabaseUrl() {
  const raw = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
  if (!raw) return undefined;

  try {
    const url = new URL(raw);
    url.searchParams.set("pgbouncer", "true");
    url.searchParams.set("connection_limit", "5");
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "15");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ datasourceUrl: pooledDatabaseUrl() });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
