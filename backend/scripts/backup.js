// Copies the live database to backups/ while the server runs. VACUUM INTO makes a consistent
// copy even during writes. Keeps the newest KEEP backups (default 14) and removes older ones.
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../database.sqlite');
const dir = process.env.BACKUP_DIR || path.join(__dirname, '../backups');
const keep = Number(process.env.BACKUP_KEEP || 14);

if (!fs.existsSync(dbPath)) {
  console.error(`No database at ${dbPath}`);
  process.exit(1);
}
fs.mkdirSync(dir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = path.join(dir, `mais-${stamp}.sqlite`);
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Cannot open database:', err.message);
    process.exit(1);
  }
});
db.run(`VACUUM INTO '${target.replace(/'/g, "''")}'`, (err) => {
  db.close();
  if (err) {
    console.error('Backup failed:', err.message);
    process.exit(1);
  }
  const old = fs
    .readdirSync(dir)
    .filter((f) => /^mais-.*\.sqlite$/.test(f))
    .sort()
    .reverse()
    .slice(keep);
  old.forEach((f) => fs.unlinkSync(path.join(dir, f)));
  console.log(`Backup written: ${target}${old.length ? ` (removed ${old.length} old)` : ''}`);
});
