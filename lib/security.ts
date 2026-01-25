//lib/security.ts

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// Load keys from environment
const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || '';
const PEPPER = process.env.BLIND_INDEX_PEPPER || '';

// Algorithm for symmetric encryption (speed + security)
const ALGORITHM = 'aes-256-gcm';

/**
 * ENCRYPT: Converts plain text (e.g., "John Doe") into encrypted hex string.
 * This is what gets stored in columns like 'enc_first_name'.
 */
export const encryptData = (text: string) => {
  if (!text) return null;

  // 1. Create a random initialization vector (IV)
  const iv = randomBytes(16);

  // 2. Create the cipher
  // Note: We assume ENCRYPTION_KEY is a 32-byte hex string
  const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');
  const cipher = createCipheriv(ALGORITHM, keyBuffer, iv);

  // 3. Encrypt
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // 4. Get the auth tag (integrity check)
  const authTag = cipher.getAuthTag().toString('hex');

  // 5. Return everything needed to decrypt later: IV + AuthTag + EncryptedData
  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * DECRYPT: Converts the DB string back to "John Doe" for the UI.
 * Only runs on your server (Next.js API routes), never in the browser logic if possible.
 */
export const decryptData = (encryptedString: string | null | undefined) => {
  if (!encryptedString) return null;

  const parts = encryptedString.split(':');

  // Handle legacy/plaintext data (prevents crash on old logs)
  if (parts.length !== 3) {
    return encryptedString;
  }

  const [ivHex, authTagHex, encryptedHex] = parts;

  // Validate hex lengths (IV=16 bytes=32 hex, AuthTag=16 bytes=32 hex)
  // If these don't match, it's likely a structured plain text string that happens to have colons
  if (ivHex.length !== 32 || authTagHex.length !== 32) {
    return encryptedString;
  }

  try {
    const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');
    const ivBuffer = Buffer.from(ivHex, 'hex');
    const authTagBuffer = Buffer.from(authTagHex, 'hex');

    const decipher = createDecipheriv(ALGORITHM, keyBuffer, ivBuffer);
    decipher.setAuthTag(authTagBuffer);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.warn('Decryption failed for string:', encryptedString.substring(0, 20) + '...');
    return null;
  }
};

/**
 * BATCH DECRYPT: Decrypts multiple fields at once for better performance.
 * Useful when decrypting entire profile objects.
 */
export const batchDecryptData = (encryptedFields: Record<string, string | null>): Record<string, string | null> => {
  const decrypted: Record<string, string | null> = {};

  // Pre-compute key buffer once for all decryptions
  const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');

  for (const [key, value] of Object.entries(encryptedFields)) {
    if (!value) {
      decrypted[key] = null;
      continue;
    }

    try {
      const [ivHex, authTagHex, encryptedHex] = value.split(':');
      const ivBuffer = Buffer.from(ivHex, 'hex');
      const authTagBuffer = Buffer.from(authTagHex, 'hex');

      const decipher = createDecipheriv(ALGORITHM, keyBuffer, ivBuffer);
      decipher.setAuthTag(authTagBuffer);

      let decrypted_text = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted_text += decipher.final('utf8');

      decrypted[key] = decrypted_text;
    } catch (error) {
      console.error(`Failed to decrypt field ${key}:`, error);
      decrypted[key] = null;
    }
  }

  return decrypted;
};

/**
 * BLIND INDEX HASHING:
 * Creates the hash for 'email_index' or 'phone_index'.
 * It uses SHA3-256 (via scrypt for simplicity here, or use actual sha3 library) + Pepper.
 */
export const hashForIndex = (input: string) => {
  // Normalize input (trim, lowercase) to ensure matching
  const cleanInput = input.trim().toLowerCase();
  const dataToHash = cleanInput + PEPPER;

  // Using scrypt as a robust hashing mechanism available in Node crypto
  // Generates a 64-character hex string
  return scryptSync(dataToHash, 'salt', 64).toString('hex');
};