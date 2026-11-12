// Dates in local time. toISOString() gives UTC, which can show yesterday's date late in the day.
const pad = (n) => String(n).padStart(2, '0');

const toISODate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Weekday name for a date, matching the timetable's day values.
const weekdayOf = (d = new Date()) => WEEKDAYS[(d.getDay() + 6) % 7];

// "09:00-10:30" style slot.
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/;

// "HH:MM" single time.
const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// Minutes since midnight for "09:00-10:30" -> [540, 630].
const slotMinutes = (slot = '') => {
  const [a, b] = slot.split('-');
  const toMin = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  return [toMin(a), toMin(b)];
};

// True when two "HH:MM-HH:MM" slots share any time.
const slotsOverlap = (a, b) => {
  const [a1, a2] = slotMinutes(a);
  const [b1, b2] = slotMinutes(b);
  return a1 < b2 && b1 < a2;
};

module.exports = { toISODate, weekdayOf, WEEKDAYS, TIME_RE, HHMM_RE, slotsOverlap, slotMinutes };
