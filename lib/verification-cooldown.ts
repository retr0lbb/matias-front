/** Time the user must wait between verification e-mails. */
export const RESEND_COOLDOWN_MS = 2 * 60 * 1000;

const KEY = "matias-verification-sent-at";

/** When the last verification e-mail was sent, or null if unknown. */
export function getVerificationSentAt(): number | null {
  try {
    const value = Number(localStorage.getItem(KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function markVerificationSent(at = Date.now()): number {
  try {
    localStorage.setItem(KEY, String(at));
  } catch {
    // Storage blocked: the countdown just won't survive a refresh.
  }
  return at;
}

export function clearVerificationSent() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
