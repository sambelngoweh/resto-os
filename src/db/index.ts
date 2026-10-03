import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// For local development, we use a local SQLite file.
// When migrating to Cloudflare D1, this will be swapped to the D1 adapter.
const sqlite = new Database('local.db');
export const db = drizzle(sqlite, { schema });
