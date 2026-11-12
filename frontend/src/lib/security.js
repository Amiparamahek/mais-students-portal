// Plain-language names for the detection rules, shown to admins.
export const EVENT_LABELS = {
  shared_device_checkin: 'Two students checked in from one browser',
  buddy_pair: 'Same two students sharing a browser repeatedly',
  off_campus_checkin: 'Check-in from outside the campus network',
  many_accounts_one_device: 'Several student accounts signed in from one browser',
  account_sharing_suspected: 'Account signed in from many places in one day',
  failed_logins: 'Repeated failed sign-ins',
  account_locked: 'Account locked after failed sign-ins',
  new_device: 'Signed in from a new browser',
};

export const SEVERITY_VARIANT = { high: 'destructive', medium: 'default', info: 'outline' };

// Event details are stored as JSON text; return the human note, or nothing if it is missing.
export const noteOf = (details) => {
  try {
    return details ? JSON.parse(details).note || null : null;
  } catch (_) {
    return null;
  }
};

export const shortDevice = (id) => (id ? `${String(id).slice(0, 8)}…` : '-');
