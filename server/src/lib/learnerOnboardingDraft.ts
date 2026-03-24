import {
  FORMAT_PREF,
  LEARNER_GOALS,
  LEARNER_INTERESTS,
  LEVEL,
  WEEKLY_HOURS,
  labelNicheId,
} from "./onboardingCatalog.js";

function labelById<T extends { id: string; label: string }>(rows: readonly T[], id: string): string {
  return rows.find((r) => r.id === id)?.label ?? id.replace(/_/g, " ");
}

export function buildLearnerJourneySummary(
  input: {
    name: string;
    interests: string[];
    primaryGoal: string;
    weeklyHours: string;
    formatPreference: string;
    level: string;
    domainNiches?: Record<string, string[]>;
    foodNiches?: string[];
    promptHint?: string;
  },
  variant = 0,
): string {
  const topics =
    input.interests.length > 0
      ? input.interests.map((id) => labelById(LEARNER_INTERESTS, id)).join(", ")
      : "creative skills you care about";
  const goal = labelById(LEARNER_GOALS, input.primaryGoal);
  const hours = labelById(WEEKLY_HOURS, input.weeklyHours);
  const fmt = labelById(FORMAT_PREF, input.formatPreference);
  const lvl = labelById(LEVEL, input.level);
  const v = ((variant % 3) + 3) % 3;

  const openers = [
    `${input.name}, we’ll shape your learning around ${topics} with your goal in mind: ${goal.toLowerCase()}.`,
    `Here’s your learning focus, ${input.name}: explore ${topics} while staying aligned with ${goal.toLowerCase()}.`,
    `Your path starts with ${topics} — framed around ${goal.toLowerCase()}, at a pace that respects your week.`,
  ];

  const middles = [
    `You’ve said you can invest ${hours.toLowerCase()}, prefer ${fmt.toLowerCase()}, and you’re ${lvl.toLowerCase()} — we’ll use that to surface classes that fit.`,
    `With ${hours.toLowerCase()} available, a ${fmt.toLowerCase()} style, and ${lvl.toLowerCase()} as your starting point, recommendations stay realistic.`,
    `We’ll match you to teachers and formats that respect ${hours.toLowerCase()}, your ${fmt.toLowerCase()} preference, and ${lvl.toLowerCase()} pacing.`,
  ];

  const closers = [
    `Next: browse picks tailored to these choices — you can always adjust interests later.`,
    `You can refine any of this after onboarding; this summary is yours to edit.`,
    `Save when you’re happy — we’ll personalize “For you” and future nudges from this snapshot.`,
  ];

  const hint = (input.promptHint ?? "").trim();
  const fromYou =
    hint.length > 12
      ? `\n\n[From your story]\n“${hint.slice(0, 280)}${hint.length > 280 ? "…" : ""}”`
      : "";

  const dn: Record<string, string[]> = { ...(input.domainNiches ?? {}) };
  if (input.foodNiches?.length && input.interests.includes("food_baking")) dn.food_baking = input.foodNiches;
  const nicheNotes: string[] = [];
  for (const dom of input.interests) {
    const tags = dn[dom];
    if (!tags?.length) continue;
    const short = labelById(LEARNER_INTERESTS, dom).split("—")[0].trim();
    nicheNotes.push(`${short}: ${tags.map((id) => labelNicheId(dom, id)).join(", ")}`);
  }
  const nicheBlock =
    nicheNotes.length > 0
      ? `\n\n[Your focus within each topic]\n${nicheNotes.join("\n")}\nWe’ll prioritize classes and teachers that align with these sub-areas.`
      : "";

  return `${openers[v]}

${middles[v]}

${closers[v]}${fromYou}${nicheBlock}`.slice(0, 6000);
}
