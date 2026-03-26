/** When true, API responses include plaintext `demoOtp` so the UI can show the code (no SMS). */
export function shouldExposeDemoOtp(): boolean {
  const raw = process.env.DEMO_OTP_ON_SCREEN?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "no" || raw === "off") return false;
  if (raw === "1" || raw === "true" || raw === "yes" || raw === "on") return true;
  if (process.env.NODE_ENV !== "production") return true;
  if (!process.env.SMS_API_KEY?.trim()) return true;
  return false;
}
