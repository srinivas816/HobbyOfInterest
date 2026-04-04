/** Strip non-digits; if pasted +91… or leading 0, reduce to up to 10 digits for the field. */
export function normalizePhoneFieldInput(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length >= 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length >= 11 && d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 10);
}

/** True when value is a complete Indian mobile (10 digits, starts with 6–9). */
export function isValidIndianMobileDigits(digits: string): boolean {
  return /^[6-9]\d{9}$/.test(digits);
}
