// Student IDs look like MAIS-2026-0147. They are taken from a counter that only goes up,
// so an ID is never given to a second student, even after the first one is deleted.
const db = require('../config/database');

let queue = Promise.resolve(); // one ID at a time, so two requests cannot take the same number

const get = (sql, params = []) =>
  new Promise((resolve, reject) => db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));
const run = (sql, params = []) =>
  new Promise((resolve, reject) => db.run(sql, params, function (err) { if (err) reject(err); else resolve(this); }));

async function takeNext(year) {
  const row = await get('SELECT last_no FROM student_id_sequence WHERE year = ?', [year]);
  let next;
  if (row) {
    next = row.last_no + 1;
    await run('UPDATE student_id_sequence SET last_no = ? WHERE year = ?', [next, year]);
  } else {
    // First ID of the year: start after anything already in use for that year.
    const top = await get(
      'SELECT COALESCE(MAX(CAST(SUBSTR(student_id, 11) AS INTEGER)), 0) AS n FROM users WHERE student_id LIKE ?',
      [`MAIS-${year}-%`]
    );
    next = (top?.n || 0) + 1;
    await run('INSERT INTO student_id_sequence (year, last_no) VALUES (?, ?)', [year, next]);
  }
  return `MAIS-${year}-${String(next).padStart(4, '0')}`;
}

// Returns the next free ID for the given year (default: this year).
function nextStudentId(year = new Date().getFullYear()) {
  const job = queue.then(() => takeNext(year));
  queue = job.catch(() => {});
  return job;
}

module.exports = { nextStudentId };
