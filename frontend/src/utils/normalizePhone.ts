/**
 * Naive E.164-ish normalization. Production should use libphonenumber-js
 * with a default region (e.g. 'IN').
 */
export function normalizePhone(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, '');
  return trimmed.startsWith('+') ? `+${digits}` : digits;
}

export function phoneLast4(raw: string): string {
  return (raw || '').replace(/\D/g, '').slice(-4);
}
