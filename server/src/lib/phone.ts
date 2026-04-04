/**
 * Indian mobile: exactly 10 digits, first digit 6–9. Stored as E.164 +91…
 */
const TEN_DIGIT_IN = /^[6-9]\d{9}$/;

export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D/g, "");

  if (digits.length === 10 && TEN_DIGIT_IN.test(digits)) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91") && TEN_DIGIT_IN.test(digits.slice(2))) {
    return `+91${digits.slice(2)}`;
  }
  if (digits.length === 11 && digits.startsWith("0") && TEN_DIGIT_IN.test(digits.slice(1))) {
    return `+91${digits.slice(1)}`;
  }

  return null;
}
