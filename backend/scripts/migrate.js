const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

const migrationDir = path.join(__dirname, '../migrations');
const dbPath = path.join(__dirname, '../database.sqlite');

// Columns added after the first release. CREATE TABLE IF NOT EXISTS does not add them
// to a database that was created earlier, so add any that are missing.
const ensureColumns = {
  users: { avatar_url: 'TEXT', phone: 'TEXT' },
  login_log: { device_id: 'TEXT' },
  timetable: { building: 'TEXT', created_on: 'TEXT' },
  exams: { exam_end_time: 'TEXT' },
  courses: {
    created_by: 'INTEGER',
    seats: 'INTEGER',
    prerequisite_course_id: 'INTEGER',
  },
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

// The lecturer role was removed: admin does the teaching. Convert any such accounts.
async function convertLecturersToAdmin() {
  const [{ n }] = await all("SELECT COUNT(*) AS n FROM users WHERE role = 'lecturer'");
  if (n > 0) {
    await run("UPDATE users SET role = 'admin' WHERE role = 'lecturer'");
    console.log(`Converted ${n} lecturer account(s) to admin`);
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
    await convertLecturersToAdmin();
    console.log('✅ All migrations completed');
  } catch (e) {
    console.error('❌ Migration failed:', e.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
})();
