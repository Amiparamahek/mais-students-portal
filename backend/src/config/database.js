const Database = require('sqlite3').Database;
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

const db = new Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
  } else {
    console.log(`✅ Connected to SQLite database at ${dbPath}`);
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

module.exports = db;
