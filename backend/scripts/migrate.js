const fs = require('fs');
const path = require('path');
const Database = require('sqlite3').Database;

const migrationDir = path.join(__dirname, '../migrations');
const dbPath = path.join(__dirname, '../database.sqlite');

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
          console.log('✅ All migrations completed');
          db.close();
        }
      });
    });
  });
});