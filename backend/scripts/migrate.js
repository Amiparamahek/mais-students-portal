const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

const migrationDir = path.join(__dirname, '../migrations');
const dbPath = path.join(__dirname, '../database.sqlite');

// Columns added after the first release. CREATE TABLE IF NOT EXISTS does not add them
// to a database that was created earlier, so add any that are missing.
const ensureColumns = {
  users: { avatar_url: 'TEXT', phone: 'TEXT' },
  courses: {
    created_by: 'INTEGER',
    lecturer_id: 'INTEGER',
    seats: 'INTEGER',
    prerequisite_course_id: 'INTEGER',
  },
  documents: { course_id: 'INTEGER' },
};

const files = fs.readdirSync(migrationDir).filter((f) => f.endsWith('.sql')).sort();

const db = new sqlite3.Database(dbPath);
const exec = (sql) => new Promise((res, rej) => db.exec(sql, (e) => (e ? rej(e) : res())));
const all = (sql, params = []) => new Promise((res, rej) => db.all(sql, params, (e, rows) => (e ? rej(e) : res(rows))));
const run = (sql, params = []) => new Promise((res, rej) => db.run(sql, params, (e) => (e ? rej(e) : res())));

async function addMissingColumns() {
  for (const [table, cols] of Object.entries(ensureColumns)) {
    const existing = new Set((await all(`PRAGMA table_info(${table})`)).map((r) => r.name));
    for (const [col, type] of Object.entries(cols)) {
      if (!existing.has(col)) {
        await run(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
        console.log(`Added missing column ${table}.${col}`);
      }
    }
  }
}

// SQLite cannot alter a CHECK constraint, so rebuild users when it does not allow 'lecturer'.
async function ensureLecturerRole() {
  const [row] = await all("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'");
  if (!row || row.sql.includes("'lecturer'")) return;

  console.log('Rebuilding users table to allow the lecturer role');
  const newSql = row.sql
    .replace(/CREATE TABLE\s+(IF NOT EXISTS\s+)?users/i, 'CREATE TABLE users_new')
    .replace(/CHECK\s*\(role IN \([^)]*\)\)/i, "CHECK (role IN ('student', 'admin', 'lecturer'))");
  const cols = (await all('PRAGMA table_info(users)')).map((c) => `"${c.name}"`).join(', ');

  // Foreign keys must be off: dropping users with them on would cascade-delete child rows.
  await exec('PRAGMA foreign_keys = OFF');
  await exec('BEGIN');
  try {
    await exec(newSql);
    await exec(`INSERT INTO users_new (${cols}) SELECT ${cols} FROM users`);
    await exec('DROP TABLE users');
    await exec('ALTER TABLE users_new RENAME TO users');
    await exec('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await exec('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
    await exec('COMMIT');
  } catch (e) {
    await exec('ROLLBACK');
    throw e;
  } finally {
    await exec('PRAGMA foreign_keys = ON');
  }
}

(async () => {
  try {
    await exec('PRAGMA foreign_keys = ON');
    for (const file of files) {
      console.log(`Running migration: ${file}`);
      await exec(fs.readFileSync(path.join(migrationDir, file), 'utf8'));
    }
    await addMissingColumns();
    await ensureLecturerRole();
    console.log('✅ All migrations completed');
  } catch (e) {
    console.error('❌ Migration failed:', e.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
})();
