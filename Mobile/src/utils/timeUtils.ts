import { IST_OFFSET_MIN, REVEAL_HOUR_IST, REVEAL_MIN_IST } from '@/src/constants';

/** Next 6:30 PM IST instant, as a UTC Date. */
export function nextRevealAt(from: Date = new Date()): Date {
  // Convert "now" into IST wall-clock
  const utcMs = from.getTime();
  const istMs = utcMs + IST_OFFSET_MIN * 60_000;
  const ist = new Date(istMs);

  ist.setUTCHours(REVEAL_HOUR_IST, REVEAL_MIN_IST, 0, 0);
  if (ist.getTime() <= istMs) {
    ist.setUTCDate(ist.getUTCDate() + 1);
  }
  // back to UTC
  return new Date(ist.getTime() - IST_OFFSET_MIN * 60_000);
}

export function formatCountdown(targetMs: number, nowMs: number = Date.now()): string {
  const diff = Math.max(0, targetMs - nowMs);
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatChatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
