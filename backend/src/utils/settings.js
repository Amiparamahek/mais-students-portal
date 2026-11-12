// Start-up settings, shared with code that runs per request (check-in rules).
// server.js sets them once after the configuration is validated.
let current = {
  campusRanges: [],
  checkinOffCampus: 'flag',
};

module.exports = {
  set: (config) => {
    current = { ...current, ...config };
  },
  get: () => current,
};
