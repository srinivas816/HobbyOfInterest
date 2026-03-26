#!/usr/bin/env node
/**
 * Aggregates funnel JSON lines from the API (stdout) into rough conversion stats.
 *
 * Usage:
 *   Get logs from your host (examples):
 *     docker logs your-api-container 2>&1 | node scripts/funnel-report.mjs
 *     type api.log | node scripts/funnel-report.mjs
 *
 * Each line should look like: {"funnel":"class_created","userId":"...","meta":{},"t":"..."}
 */

import { createInterface } from "readline";
import { createReadStream } from "fs";

const instructorSignup = new Set();
const classCreated = new Set();
const inviteOpened = new Set();
const firstStudent = new Set();
const upgraded = new Set();
const upgradedTrial = new Set();
const upgradedPaid = new Set();
const upgradeRequested = new Set();
const trialIntentWouldPay = new Set();
const trialIntentNotNow = new Set();
const maxRoster = new Map();

function pct(num, den) {
  if (!den) return "—";
  return `${((100 * num) / den).toFixed(1)}%`;
}

function trackLine(obj) {
  const ev = obj.funnel;
  const uid = obj.userId;
  if (!uid || typeof uid !== "string") return;

  if (ev === "signup_otp" && obj.meta?.role === "INSTRUCTOR") instructorSignup.add(uid);
  if (ev === "signup_email" && obj.meta?.role === "INSTRUCTOR") instructorSignup.add(uid);
  if (ev === "class_created") classCreated.add(uid);
  if (ev === "invite_link_opened") inviteOpened.add(uid);
  if (ev === "first_student_joined") {
    firstStudent.add(uid);
    const rs = Number(obj.meta?.rosterSize);
    if (Number.isFinite(rs)) maxRoster.set(uid, Math.max(maxRoster.get(uid) ?? 0, rs));
  }
  if (ev === "student_joined") {
    const rs = Number(obj.meta?.rosterSize);
    if (Number.isFinite(rs)) maxRoster.set(uid, Math.max(maxRoster.get(uid) ?? 0, rs));
  }
  if (ev === "instructor_pro_upgraded") upgraded.add(uid);
}

async function main() {
  const path = process.argv[2];
  const input = path ? createReadStream(path, { encoding: "utf8" }) : process.stdin;
  const rl = createInterface({ input, crlfDelay: Infinity });
  let parsed = 0;
  let skipped = 0;

  for await (const line of rl) {
    const t = line.trim();
    if (!t || t[0] !== "{") {
      skipped++;
      continue;
    }
    try {
      trackLine(JSON.parse(t));
      parsed++;
    } catch {
      skipped++;
    }
  }

  const threePlus = [...maxRoster.entries()].filter(([, n]) => n >= 3).map(([u]) => u);
  const threeSet = new Set(threePlus);

  console.log("=== Funnel snapshot (unique instructor userIds) ===\n");
  console.log(`Instructor signups (OTP/email):     ${instructorSignup.size}`);
  console.log(`Created a class:                  ${classCreated.size}`);
  console.log(`Opened / fetched invite link:     ${inviteOpened.size}`);
  console.log(`Got first student on a class:      ${firstStudent.size}`);
  console.log(`Reached ≥3 students (from logs):  ${threeSet.size}`);
  console.log(`Upgraded to Pro (all):             ${upgraded.size}`);
  console.log(`  … via Razorpay (paid):           ${upgradedPaid.size}`);
  console.log(`  … via trial / dev bypass:        ${upgradedTrial.size}`);
  console.log(`Opened trial upgrade dialog:       ${upgradeRequested.size}`);
  console.log(`Trial intent “would pay”:          ${trialIntentWouldPay.size}`);
  console.log(`Trial intent “not now”:            ${trialIntentNotNow.size}`);
  console.log("");
  console.log("--- Rates (denominator = instructor signups) ---");
  const d = instructorSignup.size;
  console.log(`Signup → class created:     ${pct(classCreated.size, d)} (${classCreated.size}/${d})`);
  console.log(`Class → invite opened:      ${pct(inviteOpened.size, classCreated.size)} (${inviteOpened.size}/${classCreated.size})`);
  console.log(`Invite → 1st student:       ${pct(firstStudent.size, inviteOpened.size)} (${firstStudent.size}/${inviteOpened.size})`);
  console.log(`1st student → ≥3 students:  ${pct(threeSet.size, firstStudent.size)} (${threeSet.size}/${firstStudent.size})`);
  console.log(`≥3 students → payment:      ${pct(upgraded.size, threeSet.size)} (${upgraded.size}/${threeSet.size})`);
  console.log("");
  console.log(`Parsed JSON lines: ${parsed}, skipped lines: ${skipped}`);
  console.log("\nNote: “invite opened” is server-side GET invite; use the same window of logs for fair rates.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
