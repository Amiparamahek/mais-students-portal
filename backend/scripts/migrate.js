const fs = require('fs');
const path = require('path');
const Database = require('sqlite3').Database;

const migrationDir = path.join(__dirname, '../migrations');
const dbPath = path.join(__dirname, '../database.sqlite');

// Columns added to existing tables after the first release. CREATE TABLE IF NOT EXISTS
// will not add them to a database created earlier, so add any that are missing.
const ensureColumns = {
  users: { avatar_url: 'TEXT', phone: 'TEXT' },
  courses: { created_by: 'INTEGER' },
};

const addMissingColumns = (db) =>
  new Promise((resolve, reject) => {
    const tables = Object.keys(ensureColumns);
    let chain = Promise.resolve();
    for (const table of tables) {
      chain = chain.then(
        () =>
          new Promise((res, rej) => {
            db.all(`PRAGMA table_info(${table})`, (err, rows) => {
              if (err) return rej(err);
              const existing = new Set(rows.map((r) => r.name));
              const missing = Object.entries(ensureColumns[table]).filter(([c]) => !existing.has(c));
              const next = missing.reduce(
                (p, [col, type]) =>
                  p.then(
                    () =>
                      new Promise((ok, no) =>
                        db.run(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`, (e) => (e ? no(e) : ok()))
                      )
                  ),
                Promise.resolve()
              );
              next.then(() => {
                missing.forEach(([col]) => console.log(`Added missing column ${table}.${col}`));
                res();
              }, rej);
            });
          })
      );
    }
    chain.then(resolve, reject);
  });

const files = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql')).sort();

const db = new Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }

  if (files.length === 0) {
    console.log('✅ No migration files found');
    db.close();
    return;
  }

  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON');

    files.forEach((file, index) => {
      const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
      console.log(`Running migration: ${file}`);
      db.exec(sql, (err) => {
        if (err) {
          console.error(`❌ Migration ${file} failed:`, err.message);
          process.exit(1);
        }
        if (index === files.length - 1) {
          addMissingColumns(db)
            .then(() => {
              console.log('✅ All migrations completed');
              db.close();
            })
            .catch((e) => {
              console.error('❌ Adding missing columns failed:', e.message);
              process.exit(1);
            });
        }
      });
    });
  });
});