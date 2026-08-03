import mammoth from 'mammoth';

export const SAFE_DOCUMENT_TYPES = new Map([
  ['application/pdf', ['pdf']],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', ['docx']],
  ['text/plain', ['txt']],
]);

const INJECTION_PATTERNS = [
  /ignore (?:all|any|the|your)?\s*(?:previous|prior|above) instructions?/i,
  /(?:system|developer)\s*(?:prompt|message|instruction)/i,
  /(?:reveal|print|repeat|exfiltrate).{0,40}(?:prompt|secret|token|credential)/i,
  /(?:jailbreak|prompt injection|tool call|function call)/i,
  /(?:do not|never) (?:tell|show|inform).{0,30}(?:user|reviewer|company)/i,
];

export type SecurityScan = { safe: boolean; status: 'passed' | 'blocked'; reasons: string[]; extractedText: string };

function extension(name: string) { return name.toLowerCase().split('.').pop() || ''; }

function matchesSignature(bytes: Uint8Array, type: string) {
  if (type === 'application/pdf') return String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
  if (type.includes('wordprocessingml')) return bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (type === 'text/plain') return !bytes.slice(0, 256).some(value => value === 0);
  return false;
}

export async function inspectDocument(file: File): Promise<SecurityScan> {
  const reasons: string[] = [];
  if (file.size <= 0 || file.size > 8 * 1024 * 1024) reasons.push('Document must be between 1 byte and 8 MB.');
  const allowedExtensions = SAFE_DOCUMENT_TYPES.get(file.type);
  if (!allowedExtensions?.includes(extension(file.name))) reasons.push('Only real PDF, DOCX and TXT documents are accepted.');
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!matchesSignature(buffer, file.type)) reasons.push('The file contents do not match the declared document type.');
  const binary = buffer.toString('latin1');
  if (/\/JavaScript|\/JS\b|\/OpenAction|\/Launch|EmbeddedFile|vbaProject\.bin/i.test(binary)) reasons.push('The document contains active or embedded content.');

  let extractedText = '';
  if (!reasons.length) {
    try {
      if (file.type === 'text/plain') extractedText = buffer.toString('utf8');
      if (file.type.includes('wordprocessingml')) extractedText = (await mammoth.extractRawText({ buffer })).value;
      if (file.type === 'application/pdf') {
        // pdf-parse v1 ships without TypeScript declarations.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdf = require('pdf-parse/lib/pdf-parse.js') as (data: Buffer) => Promise<{ text: string }>;
        extractedText = (await pdf(buffer)).text;
      }
    } catch {
      reasons.push('The document could not be safely read.');
    }
  }
  if (INJECTION_PATTERNS.some(pattern => pattern.test(extractedText))) reasons.push('The document contains instructions intended to manipulate an automated reviewer.');
  if (/javascript:|data:text\/html|file:\/\//i.test(extractedText)) reasons.push('The document contains an unsafe link protocol.');
  return { safe: reasons.length === 0, status: reasons.length ? 'blocked' : 'passed', reasons, extractedText: extractedText.slice(0, 120_000) };
}

export function inspectExternalLink(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return { safe: false, reason: 'Only HTTPS links are accepted.' };
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.local') || /^(?:127|10|192\.168|169\.254)\./.test(host)) return { safe: false, reason: 'Private network links are not accepted.' };
    if (url.username || url.password) return { safe: false, reason: 'Links containing credentials are not accepted.' };
    return { safe: true, normalized: url.toString() };
  } catch {
    return { safe: false, reason: 'Enter a valid HTTPS link.' };
  }
}
