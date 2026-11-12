const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

const migrationDir = path.join(__dirname, '../migrations');
const dbPath = process.env.DB_PATH || path.join(__dirname, '../database.sqlite');

// Columns added after the first release. CREATE TABLE IF NOT EXISTS does not add them
// to a database that was created earlier, so add any that are missing.
const ensureColumns = {
  users: { avatar_url: 'TEXT', phone: 'TEXT', deleted_at: 'TEXT', approval_status: 'TEXT' },
  login_log: { device_id: 'TEXT' },
  attendance_log: { device_id: 'TEXT', check_in_ip: 'TEXT', recorded_at: 'TEXT' },
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
// Makes sure the student-ID counter is never below any ID already in use (never goes down).
async function syncStudentIdSequence() {
  const rows = await all("SELECT student_id FROM users WHERE student_id LIKE 'MAIS-%-%'");
  const highest = {};
  for (const { student_id } of rows) {
    const m = /^MAIS-(\d{4})-(\d+)$/.exec(student_id);
    if (m) highest[m[1]] = Math.max(highest[m[1]] || 0, Number(m[2]));
  }
  for (const [year, no] of Object.entries(highest)) {
    await run(
      `INSERT INTO student_id_sequence (year, last_no) VALUES (?, ?)
       ON CONFLICT(year) DO UPDATE SET last_no = MAX(last_no, excluded.last_no)`,
      [Number(year), no]
    );
  }
}

// Attendance is recorded per lecture slot. The old table allowed one row per student, class
// and day, which hides a second lecture of the same class on the same day. Rebuild once.
async function ensureAttendancePerLecture() {
  const cols = (await all('PRAGMA table_info(attendance_log)')).map((c) => c.name);
  if (cols.length === 0 || cols.includes('timetable_id')) return;
  console.log('Rebuilding attendance_log to record per lecture slot');
  await exec('PRAGMA foreign_keys = OFF');
  await exec('BEGIN');
  try {
    const list = cols.map((c) => `"${c}"`).join(', ');
    await exec(`
      CREATE TABLE attendance_log_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        class_date TEXT NOT NULL,
        present INTEGER NOT NULL DEFAULT 0,
        recorded_by INTEGER,
        device_id TEXT,
        check_in_ip TEXT,
        recorded_at TEXT,
        timetable_id INTEGER,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      );
      INSERT INTO attendance_log_new (${list}) SELECT ${list} FROM attendance_log;
      DROP TABLE attendance_log;
      ALTER TABLE attendance_log_new RENAME TO attendance_log;
      CREATE UNIQUE INDEX idx_attendance_log_lecture ON attendance_log(student_id, course_id, class_date, IFNULL(timetable_id, 0));
      CREATE INDEX IF NOT EXISTS idx_attendance_log_course_date ON attendance_log(course_id, class_date);
    `);
    await exec('COMMIT');
  } catch (e) {
    await exec('ROLLBACK');
    throw e;
  } finally {
    await exec('PRAGMA foreign_keys = ON');
  }
}

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
    await syncStudentIdSequence();
    await ensureAttendancePerLecture();
    console.log('✅ All migrations completed');
  } catch (e) {
    console.error('❌ Migration failed:', e.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
})();
