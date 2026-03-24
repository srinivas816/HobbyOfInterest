/**
 * Optional bulk email for class announcements.
 * Set SMTP_HOST (and typically SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM) in server/.env
 */
export async function broadcastToLearners(opts: {
  bcc: string[];
  subject: string;
  text: string;
}): Promise<{ ok: boolean; skipped?: string; error?: string }> {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) {
    return { ok: false, skipped: "SMTP_HOST not set — announcement saved only." };
  }
  if (opts.bcc.length === 0) {
    return { ok: false, skipped: "No learner emails to notify." };
  }
  try {
    const nodemailer = await import("nodemailer");
    const port = Number(process.env.SMTP_PORT || "587");
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      ...(user ? { auth: { user, pass: pass || "" } } : {}),
    });
    const from = process.env.SMTP_FROM?.trim() || user || "noreply@localhost";
    const html = opts.text
      .split("\n")
      .map((line) => (line ? `<p>${escapeHtml(line)}</p>` : "<br/>"))
      .join("");
    await transporter.sendMail({
      from,
      to: from,
      bcc: opts.bcc,
      subject: opts.subject,
      text: opts.text,
      html,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "SMTP send failed" };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
