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
