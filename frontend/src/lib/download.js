import api from '../services/api';

// Downloads a document through the API, so the access check and auth token apply.
// Link-only documents come back as JSON with a URL, which is opened in a new tab.
export async function openDocument(doc) {
  const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
  const type = res.headers['content-type'] || '';
  if (type.includes('application/json')) {
    const { url } = JSON.parse(await res.data.text());
    window.open(url, '_blank', 'noopener');
    return;
  }
  const name = doc.original_name || doc.title || 'document';
  const href = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
