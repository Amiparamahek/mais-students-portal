const crypto = require('crypto');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Each validator returns an error message, or null when the value is fine.
const validateEmail = (email) => {
  if (typeof email !== 'string' || email.length > 254 || !EMAIL_RE.test(email.trim())) {
    return 'Enter a valid email address';
  }
  return null;
};

const validateName = (name, label = 'Name') => {
  if (typeof name !== 'string' || !name.trim()) return `${label} is required`;
  if (name.trim().length > 100) return `${label} must be 100 characters or fewer`;
  return null;
};

const validatePassword = (password) => {
  if (typeof password !== 'string' || !password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 128) return 'Password must be 128 characters or fewer';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Password must contain a letter and a number';
  return null;
};

// A readable one-time password that always satisfies validatePassword.
// Letters and digits that are easy to tell apart (no 0/O, 1/l/I).
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789';
const generateTempPassword = (length = 12) => {
  const pick = (set) => set[crypto.randomInt(set.length)];
  const chars = [pick(LETTERS), pick(DIGITS)];
  while (chars.length < length) chars.push(pick(LETTERS + DIGITS));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
};

module.exports = { validateEmail, validateName, validatePassword, generateTempPassword };
