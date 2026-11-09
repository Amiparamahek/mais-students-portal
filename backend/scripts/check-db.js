const db = require('../src/config/database');

const all = (sql) => new Promise((resolve, reject) => {
  db.all(sql, (err, rows) => (err ? reject(err) : resolve(rows)));
});

async function check() {
  try {
    console.log('\n=== MAIS DATABASE CHECK ===\n');

    const tables = await all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );

    console.log('Row counts:');
    for (const { name } of tables) {
      const rows = await all(`SELECT COUNT(*) AS n FROM "${name}"`);
      console.log(`  ${name.padEnd(16)} ${rows[0].n}`);
    }

    console.log('\nUser accounts:');
    const users = await all(
      'SELECT id, name, email, role, student_id FROM users ORDER BY id'
    );
    users.forEach((u) => {
      console.log(`  #${u.id}  ${u.name}  <${u.email}>  role=${u.role}  student_id=${u.student_id || '-'}`);
    });

    console.log('\nLatest enrollments:');
    const enrollments = await all(
      `SELECT e.id, u.email, c.code, c.name, e.status, e.enrolled_at
       FROM enrollments e
       JOIN users u ON u.id = e.student_id
       JOIN courses c ON c.id = e.course_id
       ORDER BY e.id DESC LIMIT 5`
    );
    enrollments.forEach((e) => {
      console.log(`  #${e.id}  ${e.email} -> ${e.code} ${e.name} (${e.status})  ${e.enrolled_at}`);
    });

    console.log('\nDatabase is connected and readable.');
  } catch (err) {
    console.error('Database check failed:', err.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

check();
