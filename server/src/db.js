import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'data', 'cnb_academy.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// --- Schema ---
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT,
  avatar TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'pending',
  registered_ip TEXT DEFAULT '',
  approved_at DATETIME,
  approved_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS works (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL,
  work_url TEXT DEFAULT '',
  work_type TEXT DEFAULT 'url',
  status TEXT DEFAULT 'pending',
  review_note TEXT DEFAULT '',
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cert_number TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  work_id INTEGER,
  cert_type TEXT NOT NULL,
  holder_name TEXT NOT NULL,
  work_title TEXT DEFAULT '',
  skill_level TEXT DEFAULT '',
  issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiry_date DATETIME,
  status TEXT DEFAULT 'active',
  hash TEXT NOT NULL,
  metadata TEXT DEFAULT '{}',
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (work_id) REFERENCES works(id)
);

CREATE TABLE IF NOT EXISTS verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  certificate_id INTEGER NOT NULL,
  ip TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (certificate_id) REFERENCES certificates(id)
);
`);

// --- Migration: add columns if they don't exist (for existing databases) ---
const userColumns = db.prepare("PRAGMA table_info(users)").all();
const columnNames = userColumns.map(c => c.name);

if (!columnNames.includes('status')) {
  db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'pending'");
  console.log('[DB] Migrated: added status column to users');
}
if (!columnNames.includes('registered_ip')) {
  db.exec("ALTER TABLE users ADD COLUMN registered_ip TEXT DEFAULT ''");
  console.log('[DB] Migrated: added registered_ip column to users');
}
if (!columnNames.includes('approved_at')) {
  db.exec("ALTER TABLE users ADD COLUMN approved_at DATETIME");
  console.log('[DB] Migrated: added approved_at column to users');
}
if (!columnNames.includes('approved_by')) {
  db.exec("ALTER TABLE users ADD COLUMN approved_by INTEGER");
  console.log('[DB] Migrated: added approved_by column to users');
}

// --- Migrate existing users to 'approved' status ---
// Existing users (including admins) should be approved by default
const pendingExisting = db.prepare("SELECT COUNT(*) as c FROM users WHERE status = 'pending' OR status IS NULL").get();
if (pendingExisting.c > 0) {
  db.prepare("UPDATE users SET status = 'approved' WHERE status = 'pending' OR status IS NULL").run();
  console.log(`[DB] Migrated: ${pendingExisting.c} existing users set to 'approved'`);
}

// --- Create admin from environment variables (if provided and not exists) ---
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@cnb.asia';

if (ADMIN_USERNAME && ADMIN_PASSWORD) {
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(ADMIN_USERNAME);
  if (!existing) {
    const bcrypt = await import('bcryptjs');
    const hash = bcrypt.default.hashSync(ADMIN_PASSWORD, 10);
    db.prepare(`
      INSERT INTO users (username, email, password, full_name, role, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(ADMIN_USERNAME, ADMIN_EMAIL, hash, '系统管理员', 'admin', 'approved');
    console.log(`[DB] Admin user created from env: ${ADMIN_USERNAME}`);
  } else {
    // Ensure admin is always approved
    db.prepare('UPDATE users SET status = ? WHERE username = ?').run('approved', ADMIN_USERNAME);
  }
} else {
  // Check if any admin exists
  const adminCount = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = ?').get('admin');
  if (adminCount.c === 0) {
    console.log('[DB] No admin account found. Set ADMIN_USERNAME and ADMIN_PASSWORD environment variables to create one.');
  }
}

export default db;
