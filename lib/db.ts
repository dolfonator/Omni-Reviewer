import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

/**
 * Neon + Drizzle client. Lazily created so `next build` does not require
 * DATABASE_URL at import time.
 */
function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

export type Db = ReturnType<typeof createDb>;

let _db: Db | null = null;

export function getDb(): Db {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

/** Convenience proxy for `getDb()` — access only after runtime has DATABASE_URL. */
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
