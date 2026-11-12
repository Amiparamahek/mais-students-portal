// Rules for student requests. Kept in one place so the UI and the API agree.
const CATEGORIES = {
  approval: { label: 'Approval (e.g. late registration, course change, leave)', outcomes: ['approved', 'rejected'] },
  question: { label: 'Question', outcomes: ['answered'] },
  document: { label: 'Document (e.g. bonafide letter, transcript)', outcomes: ['ready'] },
  complaint: { label: 'Complaint', outcomes: ['resolved'] },
};

const LIMITS = {
  openPerStudent: 5, // open threads at one time
  createdPerDay: 10, // new threads in 24 hours
  studentMessageCooldownSec: 60, // one message per thread per minute from a student
  notifyDigestMinutes: 10, // at most one "new reply" notification per thread per 10 minutes
  subjectMax: 120,
  bodyMax: 2000,
};

// Which statuses an admin may set for a request of this category.
const allowedStatuses = (category) => ['open', 'closed', ...(CATEGORIES[category]?.outcomes || [])];

module.exports = { CATEGORIES, LIMITS, allowedStatuses };
