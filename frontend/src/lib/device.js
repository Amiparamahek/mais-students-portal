// A random id for this browser, created once and kept in localStorage. It is evidence for
// the admin (the same browser used by two accounts), not proof: clearing storage makes a new one.
const KEY = 'device_id';

export function deviceId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch (_) {
    return undefined; // storage blocked: send no id
  }
}
