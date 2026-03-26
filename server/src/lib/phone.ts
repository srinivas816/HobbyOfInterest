import { createHash } from "crypto";

/**
 * Normalize to E.164-style. India-first for 10 digits; 6–15 digit sequences as +&lt;digits&gt;;
 * any other non-empty string (e.g. "test") maps to a stable synthetic +998… number for demos.
 */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D/g, "");

  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (trimmed.startsWith("+") && digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  if (digits.length >= 6 && digits.length <= 15) return `+${digits}`;

  if (trimmed.length >= 1 && trimmed.length <= 48) {
    const h = createHash("sha256").update(trimmed.toLowerCase()).digest("hex");
    const n = (BigInt("0x" + h.slice(0, 12)) % 900_000_000n) + 100_000_000n;
    return `+998${n.toString()}`;
  }

  return null;
}
