// Local-date helpers. Using toISOString() gives UTC, which shows the wrong day late in the evening.
const pad = (n) => String(n).padStart(2, '0');

export const toISODate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Weekday name for a date, matching the timetable's day values.
export const weekdayOf = (d = new Date()) => WEEKDAYS[(d.getDay() + 6) % 7];

// "09:00-10:30" from two HH:MM values, and back again.
export const joinSlot = (start, end) => `${start}-${end}`;
export const splitSlot = (slot = '') => {
  const [start = '09:00', end = '10:00'] = slot.split('-');
  return { start, end };
};

// Exam time as "09:00 - 11:00" (or just the start when there is no end time).
export const examTimeRange = (start, end) => (start ? (end ? `${start} - ${end}` : start) : '-');

// Sort key for "HH:MM-HH:MM" slots.
export const slotStart = (slot = '') => slot.split('-')[0] || '';

// The database stores UTC timestamps like "2026-11-12 18:50:21". Show them in the viewer's time.
export const fromDb = (ts) => (ts ? new Date(ts.replace(' ', 'T') + 'Z') : null);
export const formatDateTime = (ts) => {
  const d = fromDb(ts);
  return d ? d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Never';
};
export const timeAgo = (ts) => {
  const d = fromDb(ts);
  if (!d) return 'Never';
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} h ago`;
  return `${Math.round(hr / 24)} d ago`;
};
