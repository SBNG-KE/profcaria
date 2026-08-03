export const PROFCARIA_USERNAME_MIN_LENGTH = 3;
export const PROFCARIA_USERNAME_MAX_LENGTH = 30;

const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'api', 'auth', 'help', 'login', 'logout',
  'profcaria', 'official', 'privacy', 'root', 'security', 'settings',
  'signup', 'social', 'support', 'system', 'terms', 'work',
]);

export function normalizeProfcariaUsername(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/^@+/, '').toLowerCase() : '';
}

export function validateProfcariaUsername(value: unknown) {
  const username = normalizeProfcariaUsername(value);
  if (username.length < PROFCARIA_USERNAME_MIN_LENGTH || username.length > PROFCARIA_USERNAME_MAX_LENGTH) {
    return { valid: false as const, username, error: 'Username must be 3 to 30 characters.' };
  }
  if (!/^[a-z0-9][a-z0-9_]*[a-z0-9]$/.test(username)) {
    return { valid: false as const, username, error: 'Use only letters, numbers and underscores, starting and ending with a letter or number.' };
  }
  if (RESERVED_USERNAMES.has(username)) {
    return { valid: false as const, username, error: 'That username is reserved. Choose another.' };
  }
  return { valid: true as const, username, error: null };
}

export function normalizeProfcariaPhone(value: unknown) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return `+${trimmed.replace(/\D/g, '')}`;
}

export function validateProfcariaPhone(value: unknown) {
  const phone = normalizeProfcariaPhone(value);
  if (!phone) return { valid: true as const, phone: '', error: null };
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    return { valid: false as const, phone, error: 'Enter a complete phone number with its country code.' };
  }
  return { valid: true as const, phone, error: null };
}
