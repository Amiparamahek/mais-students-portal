q
// Downloads an admin CSV export through the API (auth header included).
export async function downloadCsv(kind) {
  const res = await api.get(`/reports/export/${kind}`, { responseType: 'blob' });
  const match = /filename="([^"]+)"/.exec(res.headers['content-disposition'] || '');
  const name = match ? match[1] : `${kind}.csv`;
  const href = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
