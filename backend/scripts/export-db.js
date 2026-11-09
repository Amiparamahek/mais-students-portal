const fs = require('fs');
const path = require('path');
const db = require('../src/config/database');

const all = (sql) => new Promise((resolve, reject) => {
  db.all(sql, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

async function exportDb() {
  const outDir = path.join(__dirname, '../database_export');
  fs.mkdirSync(outDir, { recursive: true });

  const tables = await all(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );

  const report = [];
  let totalRows = 0;

  for (const { name } of tables) {
    const rows = await all(`SELECT * FROM "${name}"`);
    const columns = rows.length
      ? Object.keys(rows[0])
      : (await all(`PRAGMA table_info("${name}")`)).map((c) => c.name);

    // Keep data readable and avoid printing password hashes.
    const visibleColumns = columns.filter((c) => c !== 'password_hash');

    totalRows += rows.length;

    // CSV export
    const csvLines = [visibleColumns.map(csvCell).join(',')];
    for (const row of rows) {
      csvLines.push(visibleColumns.map((c) => csvCell(row[c])).join(','));
    }
    fs.writeFileSync(path.join(outDir, `${name}.csv`), '\ufeff' + csvLines.join('\r\n'), 'utf8');

    // HTML section
    let body;
    if (rows.length === 0) {
      body = '<tr><td colspan="' + visibleColumns.length + '" class="empty">No rows</td></tr>';
    } else {
      body = rows.map((row) => {
        const cells = visibleColumns.map((c) => {
          let value = row[c];
          if (c === 'password_hash') value = '(hidden bcrypt hash)';
          return `<td>${esc(value)}</td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
      }).join('\n');
    }

    report.push(`
      <section>
        <h2>${esc(name)} <span class="count">${rows.length} rows</span></h2>
        <div class="table-wrap">
          <table>
            <thead><tr>${visibleColumns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
            <tbody>${body}</tbody>
          </table>
        </div>
      </section>`);
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MAIS Database Report</title>
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; background: #f8fafc; color: #0f172a; }
  header { background: #1e3a8a; color: #fff; padding: 24px 32px; }
  header h1 { margin: 0 0 6px; font-size: 22px; }
  header p { margin: 0; opacity: .85; font-size: 14px; }
  main { padding: 24px 32px 48px; }
  section { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin-bottom: 22px; box-shadow: 0 1px 2px rgba(15,23,42,.04); }
  h2 { font-size: 16px; margin: 0 0 14px; }
  .count { color: #64748b; font-weight: 500; font-size: 13px; margin-left: 8px; }
  .table-wrap { overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #f1f5f9; white-space: nowrap; }
  th { background: #f1f5f9; color: #334155; font-size: 12px; text-transform: uppercase; letter-spacing: .03em; }
  tr:last-child td { border-bottom: none; }
  td.empty { text-align: center; color: #94a3b8; }
  .meta { font-size: 13px; color: #475569; margin-bottom: 18px; }
  code { background: #e2e8f0; padding: 2px 5px; border-radius: 4px; }
</style>
</head>
<body>
<header>
  <h1>MAIS Student Portal — Database Report</h1>
  <p>Generated from backend/database.sqlite</p>
</header>
<main>
  <p class="meta">Generated: ${new Date().toLocaleString()} · ${tables.length} tables · ${totalRows} total rows</p>
  ${report.join('\n')}
</main>
</body>
</html>`;

  const reportPath = path.join(__dirname, '../database-report.html');
  fs.writeFileSync(reportPath, html, 'utf8');

  console.log('\n=== DATABASE EXPORT ===\n');
  for (const { name } of tables) {
    const c = await all(`SELECT COUNT(*) AS n FROM "${name}"`);
    console.log(`  ${name.padEnd(16)} ${c[0].n} rows  ->  database_export/${name}.csv`);
  }
  console.log(`\nHTML report: ${reportPath}`);
  console.log(`Total rows exported: ${totalRows}\n`);
}

exportDb()
  .catch((err) => {
    console.error('Export failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => db.close());
