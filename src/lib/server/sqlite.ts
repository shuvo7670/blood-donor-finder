import fs from "node:fs";
import path from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { seedDatabase } from "./seed-db";

/**
 * SQLite through Node's built-in node:sqlite: a real database file (data/app.db) with no
 * extra dependency. All access is synchronous, so a transaction can't interleave with another
 * request in this process. `npm run db:reset` deletes the file; it is recreated and seeded.
 */
const DB_FILE = path.join(process.cwd(), "data", "app.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS donors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bloodGroup TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  gender TEXT NOT NULL,
  age INTEGER NOT NULL,
  weight INTEGER NOT NULL,
  area TEXT NOT NULL,
  city TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  lastDonation TEXT,
  totalDonations INTEGER NOT NULL DEFAULT 0,
  available INTEGER NOT NULL DEFAULT 1,
  verified INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  statusReason TEXT,
  pinHash TEXT NOT NULL,
  contactViews INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS donors_status ON donors(status);

CREATE TABLE IF NOT EXISTS donations (
  id TEXT PRIMARY KEY,
  donorId TEXT NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  place TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS donations_donor ON donations(donorId);

CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  patientName TEXT NOT NULL,
  bloodGroup TEXT NOT NULL,
  bags INTEGER NOT NULL,
  hospital TEXT NOT NULL,
  area TEXT NOT NULL,
  city TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  neededBy TEXT NOT NULL,
  urgency TEXT NOT NULL,
  contactName TEXT NOT NULL,
  phone TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  statusReason TEXT,
  manageTokenHash TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS requests_status ON requests(status);

CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  requestId TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  donorId TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  bloodGroup TEXT,
  message TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL,
  UNIQUE (requestId, phone)
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  targetType TEXT NOT NULL,
  targetId TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  reporterPhone TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  resolutionNote TEXT,
  resolvedBy TEXT,
  resolvedAt TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bloodBanks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  area TEXT NOT NULL,
  city TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  hours TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  mustChangePassword INTEGER NOT NULL DEFAULT 0,
  lastLoginAt TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  tokenHash TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  subjectId TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actorId TEXT NOT NULL,
  actorName TEXT NOT NULL,
  action TEXT NOT NULL,
  targetType TEXT NOT NULL,
  targetId TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

const g = globalThis as typeof globalThis & { __raktobondhuDb?: DatabaseSync };

export function db(): DatabaseSync {
  if (!g.__raktobondhuDb) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    const conn = new DatabaseSync(DB_FILE);
    conn.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;");
    conn.exec(SCHEMA);
    const { n } = conn.prepare("SELECT COUNT(*) AS n FROM staff").get() as { n: number };
    if (n === 0) seedDatabase(conn);
    g.__raktobondhuDb = conn;
  }
  return g.__raktobondhuDb;
}

export type Params = Record<string, SQLInputValue>;

export function all<T>(sql: string, params: Params | SQLInputValue[] = []): T[] {
  const stmt = db().prepare(sql);
  return (Array.isArray(params) ? stmt.all(...params) : stmt.all(params)) as T[];
}

export function get<T>(sql: string, params: Params | SQLInputValue[] = []): T | undefined {
  const stmt = db().prepare(sql);
  return (Array.isArray(params) ? stmt.get(...params) : stmt.get(params)) as T | undefined;
}

export function run(sql: string, params: Params | SQLInputValue[] = []) {
  const stmt = db().prepare(sql);
  return Array.isArray(params) ? stmt.run(...params) : stmt.run(params);
}

export function tx<T>(fn: () => T): T {
  const conn = db();
  conn.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    conn.exec("COMMIT");
    return result;
  } catch (error) {
    conn.exec("ROLLBACK");
    throw error;
  }
}

/** Inserts `row` into `table`, column names taken from its keys. */
export function insert(table: string, row: Params) {
  const keys = Object.keys(row);
  run(`INSERT INTO ${table} (${keys.join(", ")}) VALUES (${keys.map((k) => `:${k}`).join(", ")})`, row);
}

export function newId(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export const nowIso = () => new Date().toISOString();
