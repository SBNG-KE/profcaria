export const ONDWIRA_USERNAME_MIN_LENGTH = 3;
export const ONDWIRA_USERNAME_MAX_LENGTH = 30;

const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'api', 'auth', 'help', 'login', 'logout',
  'ondwira', 'official', 'privacy', 'root', 'security', 'settings',
  'signup', 'social', 'support', 'system', 'terms', 'work',
]);

export function normalizeOndwiraUsername(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/^@+/, '').toLowerCase() : '';
}

export function validateOndwiraUsername(value: unknown) {
  const username = normalizeOndwiraUsername(value);
  if (username.length < ONDWIRA_USERNAME_MIN_LENGTH || username.length > ONDWIRA_USERNAME_MAX_LENGTH) {
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

export function normalizeOndwiraPhone(value: unknown) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return `+${trimmed.replace(/\D/g, '')}`;
}

export function validateOndwiraPhone(value: unknown) {
  const phone = normalizeOndwiraPhone(value);
  if (!phone) return { valid: true as const, phone: '', error: null };
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    return { valid: false as const, phone, error: 'Enter a complete phone number with its country code.' };
  }
  return { valid: true as const, phone, error: null };
}
