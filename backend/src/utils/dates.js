// Dates in local time. toISOString() gives UTC, which can show yesterday's date late in the day.
const pad = (n) => String(n).padStart(2, '0');

const toISODate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Weekday name for a date, matching the timetable's day values.
const weekdayOf = (d = new Date()) => WEEKDAYS[(d.getDay() + 6) % 7];

// "09:00-10:30" style slot.
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/;

module.exports = { toISODate, weekdayOf, WEEKDAYS, TIME_RE };
