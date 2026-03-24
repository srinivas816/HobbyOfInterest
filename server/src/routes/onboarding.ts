import { Router } from "express";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authRequired, type AuthedRequest } from "../middleware/auth.js";
import { publicUser } from "./auth.js";
import {
  AUDIENCE,
  CLASS_FORMAT,
  EXPERIENCE_BAND,
  FORMAT_PREF,
  LEARNER_GOALS,
  LEARNER_INTERESTS,
  LEVEL,
  SESSION_LENGTH,
  TEACHING_LANGUAGES,
  TEACHING_STYLES,
  WEEKLY_HOURS,
  catalogPayload,
  domainNichesFromKeywords,
  domainNichesFromLegacyFood,
  foodNichesForStorage,
  mergeDomainNicheRecords,
  sanitizeDomainNiches,
} from "../lib/onboardingCatalog.js";
import { buildLearnerJourneySummary } from "../lib/learnerOnboardingDraft.js";
import { buildInstructorCourseDraft } from "../lib/onboardingDraft.js";
import { llmOnboardingSuggestions } from "../lib/onboardingLlm.js";

const router = Router();

const ids = <T extends readonly { id: string }[]>(rows: T) => new Set(rows.map((r) => r.id));

const domainNichesRecordSchema = z.record(z.string(), z.array(z.string()).max(4)).optional();

const learnerPatchSchema = z.object({
  interests: z.array(z.string()).min(1).max(12),
  primaryGoal: z.string(),
  weeklyHours: z.string(),
  formatPreference: z.string(),
  level: z.string(),
  journeySummary: z.string().max(8000).optional(),
  domainNiches: domainNichesRecordSchema,
  foodNiches: z.array(z.string()).max(4).optional(),
});

const courseDraftSchema = z.object({
  title: z.string().min(4).max(160),
  category: z.string().min(2).max(120),
  format: z.enum(["ONLINE", "IN_PERSON"]),
  durationLabel: z.string().min(2).max(80),
  priceInr: z.number().int().min(99).max(999999).optional(),
  description: z.string().min(20).max(5000),
  outcomes: z.string().min(10).max(4000),
  imageKey: z.string().min(2).max(120).optional(),
  classScript: z.string().max(8000).optional(),
});

const learnerPreviewSchema = z.object({
  prompt: z.string().max(800).optional(),
  variant: z.number().int().min(0).max(20).optional(),
  learner: z
    .object({
      interests: z.array(z.string()).max(12).optional(),
      primaryGoal: z.string().optional(),
      weeklyHours: z.string().optional(),
      formatPreference: z.string().optional(),
      level: z.string().optional(),
      domainNiches: domainNichesRecordSchema,
      foodNiches: z.array(z.string()).max(4).optional(),
    })
    .optional(),
});

const instructorPreviewSchema = z.object({
  prompt: z.string().max(800).optional(),
  variant: z.number().int().min(0).max(20).optional(),
  instructor: z
    .object({
      domains: z.array(z.string()).max(10).optional(),
      experienceBand: z.string().optional(),
      audience: z.string().optional(),
      classFormat: z.string().optional(),
      sessionLength: z.string().optional(),
      teachingStyles: z.array(z.string()).max(8).optional(),
      domainNiches: domainNichesRecordSchema,
      foodNiches: z.array(z.string()).max(4).optional(),
    })
    .optional(),
});

const instructorPatchSchema = z.object({
  domains: z.array(z.string()).min(1).max(10),
  experienceBand: z.string(),
  audience: z.string(),
  classFormat: z.string(),
  sessionLength: z.string(),
  teachingStyles: z.array(z.string()).min(1).max(8),
  courseDraft: courseDraftSchema.optional(),
  publicHeadline: z.string().max(140).optional(),
  teachingLanguages: z.array(z.string()).max(8).optional(),
  publicLink: z.string().max(500).optional(),
  domainNiches: domainNichesRecordSchema,
  foodNiches: z.array(z.string()).max(4).optional(),
});

const patchSchema = z.object({
  learner: learnerPatchSchema.optional(),
  instructor: instructorPatchSchema.optional(),
});

const suggestSchema = z.object({
  role: z.enum(["LEARNER", "INSTRUCTOR"]),
  prompt: z.string().min(3).max(800),
});

function filterToAllowed(arr: string[] | undefined, allowed: Set<string>, max: number): string[] {
  if (!arr) return [];
  const out: string[] = [];
  for (const x of arr) {
    if (allowed.has(x) && !out.includes(x)) out.push(x);
    if (out.length >= max) break;
  }
  return out;
}

function mergeIdLists(a: string[], b: string[], allowed: Set<string>, max: number): string[] {
  return filterToAllowed([...new Set([...a, ...b])], allowed, max);
}

function pickOne(val: string | undefined, allowed: Set<string>, fallback: string): string {
  if (val && allowed.has(val)) return val;
  return fallback;
}

function heuristicSuggestions(prompt: string, role: Role) {
  const p = prompt.toLowerCase();
  if (role === "LEARNER") {
    const interests: string[] = [];
    const add = (id: string) => {
      if (!interests.includes(id)) interests.push(id);
    };
    if (p.includes("photo") || p.includes("camera") || p.includes("lightroom")) add("photography");
    if (p.includes("bake") || p.includes("cook") || p.includes("cake") || p.includes("chef")) add("food_baking");
    if (
      (p.includes("food") || p.includes("cuisine") || p.includes("culinary")) &&
      (p.includes("tutor") || p.includes("teach") || p.includes("class"))
    ) {
      add("food_baking");
    }
    if (p.includes("wood") || p.includes("maker") || p.includes("diy")) add("diy_maker");
    if (
      p.includes("music") ||
      p.includes("guitar") ||
      p.includes("piano") ||
      p.includes("drum") ||
      p.includes("violin") ||
      p.includes("cello") ||
      p.includes("ukulele") ||
      p.includes("bass") ||
      p.includes("vocal") ||
      p.includes("singing") ||
      p.includes("songwriting") ||
      /\bdj\b/.test(p)
    ) {
      add("music_audio");
    }
    if (p.includes("yoga") || p.includes("pilates") || p.includes("barre") || p.includes("mobility")) add("yoga_pilates");
    if (
      p.includes("gym") ||
      p.includes("hiit") ||
      p.includes("crossfit") ||
      p.includes("strength") ||
      p.includes("calisthenics") ||
      (p.includes("fitness") && !p.includes("dance"))
    ) {
      add("fitness_strength");
    }
    if (p.includes("dance") || p.includes("choreo") || p.includes("zumba")) add("dance_movement");
    if (p.includes("nutrit") || p.includes("meal plan") || p.includes("dietitian")) add("nutrition_health");
    if (p.includes("mindful") || p.includes("meditat") || p.includes("breathwork") || (p.includes("wellness") && !p.includes("fitness"))) add("wellness");
    if (p.includes("sew") || p.includes("fashion") || p.includes("fabric")) add("fashion_textiles");
    if (p.includes("kid") || p.includes("family")) add("kids_family");
    if (p.includes("paint") || p.includes("draw") || p.includes("art")) add("art_craft");
    if (p.includes("write") || p.includes("market") || p.includes("business")) add("writing_biz");
    if (p.includes("software") || p.includes("figma") || p.includes("design")) add("tech_creative");
    if (interests.length === 0) add("art_craft");
    if (interests.length < 2) add("wellness");

    const interestIds = filterToAllowed(interests, ids(LEARNER_INTERESTS), 12);
    const domainNiches = domainNichesFromKeywords(p, interestIds);

    return {
      learner: {
        interests: interestIds,
        domainNiches,
        foodNiches: domainNiches.food_baking ?? [],
        primaryGoal: pickOne(
          p.includes("career") || p.includes("job")
            ? "career_skill"
            : p.includes("income") || p.includes("side hustle")
              ? "side_income"
              : p.includes("kid") || p.includes("family")
                ? "kids_family"
                : p.includes("social") || p.includes("meet")
                  ? "social_fun"
                  : p.includes("stress") || p.includes("balance") || p.includes("mental")
                    ? "health_balance"
                    : undefined,
          ids(LEARNER_GOALS),
          "creative_outlet",
        ),
        weeklyHours: pickOne(
          p.includes("busy") || p.includes("little time") ? "lt_2" : undefined,
          ids(WEEKLY_HOURS),
          "2_5",
        ),
        formatPreference: pickOne(
          p.includes("only online") || p.includes("remote") ? "online_only" : p.includes("studio") ? "in_person" : undefined,
          ids(FORMAT_PREF),
          "mixed",
        ),
        level: pickOne(
          p.includes("advanced") || p.includes("years of") ? "advanced" : p.includes("some") ? "some_experience" : undefined,
          ids(LEVEL),
          "beginner",
        ),
      },
    };
  }

  const domains: string[] = [];
  const addD = (id: string) => {
    if (!domains.includes(id)) domains.push(id);
  };
  if (p.includes("photo")) addD("photography");
  if (p.includes("bake") || p.includes("cook") || p.includes("chef") || p.includes("cuisine")) addD("food_baking");
  if (
    (p.includes("food") || p.includes("culinary")) &&
    (p.includes("tutor") || p.includes("teach") || p.includes("instructor") || p.includes("coach"))
  ) {
    addD("food_baking");
  }
  if (p.includes("wood") || p.includes("maker")) addD("diy_maker");
  if (
    p.includes("music") ||
    p.includes("guitar") ||
    p.includes("piano") ||
    p.includes("drum") ||
    p.includes("violin") ||
    p.includes("cello") ||
    p.includes("ukulele") ||
    p.includes("bass") ||
    p.includes("vocal") ||
    p.includes("singing") ||
    p.includes("songwriting") ||
    /\bdj\b/.test(p)
  ) {
    addD("music_audio");
  }
  if (p.includes("yoga") || p.includes("pilates") || p.includes("barre")) addD("yoga_pilates");
  if (p.includes("gym") || p.includes("hiit") || p.includes("crossfit") || p.includes("strength") || p.includes("fitness") || p.includes("calisthenics")) {
    addD("fitness_strength");
  }
  if (p.includes("dance") || p.includes("choreo") || p.includes("zumba")) addD("dance_movement");
  if (p.includes("nutrit") || p.includes("meal plan") || p.includes("dietitian")) addD("nutrition_health");
  if (p.includes("mindful") || p.includes("meditat") || p.includes("breathwork") || (p.includes("wellness") && !p.includes("fitness"))) addD("wellness");
  if (p.includes("coach") && (p.includes("life") || p.includes("career"))) addD("writing_biz");
  if (p.includes("sew") || p.includes("fashion")) addD("fashion_textiles");
  if (p.includes("pottery") || p.includes("art") || p.includes("paint")) addD("art_craft");
  if (domains.length === 0) addD("art_craft");

  const domainIds = filterToAllowed(domains, ids(LEARNER_INTERESTS), 10);
  const domainNichesIns = domainNichesFromKeywords(p, domainIds);

  return {
    instructor: {
      domains: domainIds,
      domainNiches: domainNichesIns,
      foodNiches: domainNichesIns.food_baking ?? [],
      experienceBand: pickOne(undefined, ids(EXPERIENCE_BAND), "1_3_years"),
      audience: pickOne(undefined, ids(AUDIENCE), "hobbyists"),
      classFormat: pickOne(undefined, ids(CLASS_FORMAT), p.includes("studio") ? "in_person_studio" : "live_online"),
      sessionLength: pickOne(undefined, ids(SESSION_LENGTH), "60_90"),
      teachingStyles: filterToAllowed(["demo_heavy", "project_based"], ids(TEACHING_STYLES), 5),
    },
  };
}

function sanitizeAiLearner(
  raw: Record<string, unknown>,
  fallback: { learner: Record<string, unknown> },
) {
  const l = raw.learner as Record<string, unknown> | undefined;
  if (!l) return null;
  const fb = fallback.learner;
  let interestList = filterToAllowed(l.interests as string[] | undefined, ids(LEARNER_INTERESTS), 12);
  if (interestList.length === 0) interestList = filterToAllowed(fb.interests as string[], ids(LEARNER_INTERESTS), 12);

  const baseDn = mergeDomainNicheRecords(
    sanitizeDomainNiches(fb.domainNiches as Record<string, string[]> | undefined, interestList, 4),
    domainNichesFromLegacyFood(fb.foodNiches as string[] | undefined),
    interestList,
    4,
  );

  let aiDnRaw: Record<string, string[]> = {};
  const rawDn = l.domainNiches;
  if (rawDn && typeof rawDn === "object" && !Array.isArray(rawDn)) {
    for (const [k, v] of Object.entries(rawDn as Record<string, unknown>)) {
      if (Array.isArray(v)) aiDnRaw[k] = v.filter((x): x is string => typeof x === "string");
    }
  }
  let aiDn = sanitizeDomainNiches(aiDnRaw, interestList, 4);
  aiDn = mergeDomainNicheRecords(
    aiDn,
    domainNichesFromLegacyFood(l.foodNiches as string[] | undefined),
    interestList,
    4,
  );
  const domainNiches = mergeDomainNicheRecords(baseDn, aiDn, interestList, 4);

  return {
    learner: {
      interests: interestList,
      primaryGoal: pickOne(l.primaryGoal as string | undefined, ids(LEARNER_GOALS), String(fb.primaryGoal)),
      weeklyHours: pickOne(l.weeklyHours as string | undefined, ids(WEEKLY_HOURS), String(fb.weeklyHours)),
      formatPreference: pickOne(l.formatPreference as string | undefined, ids(FORMAT_PREF), String(fb.formatPreference)),
      level: pickOne(l.level as string | undefined, ids(LEVEL), String(fb.level)),
      domainNiches,
      foodNiches: domainNiches.food_baking ?? [],
    },
  };
}

function sanitizeAiInstructor(raw: Record<string, unknown>, fallback: { instructor: Record<string, unknown> }) {
  const i = raw.instructor as Record<string, unknown> | undefined;
  if (!i) return null;
  const fb = fallback.instructor;
  let domains = filterToAllowed(i.domains as string[] | undefined, ids(LEARNER_INTERESTS), 10);
  if (domains.length === 0) domains = filterToAllowed(fb.domains as string[], ids(LEARNER_INTERESTS), 10);
  let styles = filterToAllowed(i.teachingStyles as string[] | undefined, ids(TEACHING_STYLES), 8);
  if (styles.length === 0) styles = filterToAllowed(fb.teachingStyles as string[], ids(TEACHING_STYLES), 8);

  const baseDn = mergeDomainNicheRecords(
    sanitizeDomainNiches(fb.domainNiches as Record<string, string[]> | undefined, domains, 4),
    domainNichesFromLegacyFood(fb.foodNiches as string[] | undefined),
    domains,
    4,
  );

  let aiDnRaw: Record<string, string[]> = {};
  const rawDn = i.domainNiches;
  if (rawDn && typeof rawDn === "object" && !Array.isArray(rawDn)) {
    for (const [k, v] of Object.entries(rawDn as Record<string, unknown>)) {
      if (Array.isArray(v)) aiDnRaw[k] = v.filter((x): x is string => typeof x === "string");
    }
  }
  let aiDn = sanitizeDomainNiches(aiDnRaw, domains, 4);
  aiDn = mergeDomainNicheRecords(
    aiDn,
    domainNichesFromLegacyFood(i.foodNiches as string[] | undefined),
    domains,
    4,
  );
  const domainNiches = mergeDomainNicheRecords(baseDn, aiDn, domains, 4);

  return {
    instructor: {
      domains,
      domainNiches,
      foodNiches: domainNiches.food_baking ?? [],
      experienceBand: pickOne(i.experienceBand as string | undefined, ids(EXPERIENCE_BAND), String(fb.experienceBand)),
      audience: pickOne(i.audience as string | undefined, ids(AUDIENCE), String(fb.audience)),
      classFormat: pickOne(i.classFormat as string | undefined, ids(CLASS_FORMAT), String(fb.classFormat)),
      sessionLength: pickOne(i.sessionLength as string | undefined, ids(SESSION_LENGTH), String(fb.sessionLength)),
      teachingStyles: styles,
    },
  };
}

router.post("/skip", authRequired, async (req: AuthedRequest, res) => {
  const updated = await prisma.user.update({
    where: { id: req.userId! },
    data: {
      onboardingCompletedAt: new Date(),
      onboardingProfile: { skipped: true },
    },
  });
  res.json({ ok: true, user: publicUser(updated) });
});

router.get("/catalog", (_req, res) => {
  res.json({ catalog: catalogPayload() });
});

router.post("/instructor-preview", authRequired, async (req: AuthedRequest, res) => {
  const parsed = instructorPreviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const me = await prisma.user.findUnique({ where: { id: req.userId! }, select: { name: true, role: true } });
  if (!me || me.role !== "INSTRUCTOR") {
    res.status(403).json({ error: "Instructors only" });
    return;
  }
  const prompt = parsed.data.prompt?.trim() ?? "";
  const hint = heuristicSuggestions(prompt || "teach", "INSTRUCTOR").instructor as Record<string, unknown>;
  const partial = parsed.data.instructor ?? {};
  const domains =
    partial.domains && partial.domains.length > 0
      ? filterToAllowed(partial.domains, ids(LEARNER_INTERESTS), 10)
      : filterToAllowed(hint.domains as string[], ids(LEARNER_INTERESTS), 10);
  if (domains.length === 0) {
    res.status(400).json({ error: "Need a short story or at least one teaching domain" });
    return;
  }
  const hintDn = (hint.domainNiches as Record<string, string[]> | undefined) ?? {};
  const partialDn = sanitizeDomainNiches(partial.domainNiches as Record<string, string[]> | undefined, domains, 4);
  let domainNichesM = mergeDomainNicheRecords(hintDn, partialDn, domains, 4);
  domainNichesM = mergeDomainNicheRecords(
    domainNichesM,
    domainNichesFromLegacyFood(partial.foodNiches as string[] | undefined),
    domains,
    4,
  );
  const merged = {
    domains,
    domainNiches: domainNichesM,
    foodNiches: domainNichesM.food_baking ?? [],
    experienceBand: pickOne(partial.experienceBand as string | undefined, ids(EXPERIENCE_BAND), String(hint.experienceBand)),
    audience: pickOne(partial.audience as string | undefined, ids(AUDIENCE), String(hint.audience)),
    classFormat: pickOne(partial.classFormat as string | undefined, ids(CLASS_FORMAT), String(hint.classFormat)),
    sessionLength: pickOne(partial.sessionLength as string | undefined, ids(SESSION_LENGTH), String(hint.sessionLength)),
    teachingStyles:
      partial.teachingStyles && partial.teachingStyles.length > 0
        ? filterToAllowed(partial.teachingStyles, ids(TEACHING_STYLES), 8)
        : filterToAllowed(hint.teachingStyles as string[], ids(TEACHING_STYLES), 8),
  };
  const variant = parsed.data.variant ?? 0;
  const courseDraft = buildInstructorCourseDraft(
    {
      name: me.name,
      domains: merged.domains,
      experienceBand: merged.experienceBand,
      audience: merged.audience,
      classFormat: merged.classFormat,
      sessionLength: merged.sessionLength,
      teachingStyles: merged.teachingStyles,
      domainNiches: merged.domainNiches,
      foodNiches: merged.foodNiches,
      promptHint: prompt || undefined,
    },
    variant,
  );
  res.json({ courseDraft });
});

router.post("/learner-preview", authRequired, async (req: AuthedRequest, res) => {
  const parsed = learnerPreviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const me = await prisma.user.findUnique({ where: { id: req.userId! }, select: { name: true, role: true } });
  if (!me || me.role !== "LEARNER") {
    res.status(403).json({ error: "Learners only" });
    return;
  }
  const prompt = parsed.data.prompt?.trim() ?? "";
  const hint = heuristicSuggestions(prompt || "I want to learn new skills", "LEARNER").learner as Record<string, unknown>;
  const partial = parsed.data.learner ?? {};
  const interests =
    partial.interests && partial.interests.length > 0
      ? filterToAllowed(partial.interests, ids(LEARNER_INTERESTS), 12)
      : filterToAllowed(hint.interests as string[], ids(LEARNER_INTERESTS), 12);
  if (interests.length === 0) {
    res.status(400).json({ error: "Add a short story or complete the interest step first." });
    return;
  }
  const hintDn = (hint.domainNiches as Record<string, string[]> | undefined) ?? {};
  const partialDn = sanitizeDomainNiches(partial.domainNiches as Record<string, string[]> | undefined, interests, 4);
  let domainNichesL = mergeDomainNicheRecords(hintDn, partialDn, interests, 4);
  domainNichesL = mergeDomainNicheRecords(
    domainNichesL,
    domainNichesFromLegacyFood(partial.foodNiches as string[] | undefined),
    interests,
    4,
  );
  const merged = {
    interests,
    domainNiches: domainNichesL,
    foodNiches: domainNichesL.food_baking ?? [],
    primaryGoal: pickOne(partial.primaryGoal as string | undefined, ids(LEARNER_GOALS), String(hint.primaryGoal)),
    weeklyHours: pickOne(partial.weeklyHours as string | undefined, ids(WEEKLY_HOURS), String(hint.weeklyHours)),
    formatPreference: pickOne(partial.formatPreference as string | undefined, ids(FORMAT_PREF), String(hint.formatPreference)),
    level: pickOne(partial.level as string | undefined, ids(LEVEL), String(hint.level)),
  };
  const variant = parsed.data.variant ?? 0;
  const journeySummary = buildLearnerJourneySummary(
    {
      name: me.name,
      interests: merged.interests,
      primaryGoal: merged.primaryGoal,
      weeklyHours: merged.weeklyHours,
      formatPreference: merged.formatPreference,
      level: merged.level,
      domainNiches: merged.domainNiches,
      foodNiches: merged.foodNiches,
      promptHint: prompt || undefined,
    },
    variant,
  );
  res.json({ journeySummary });
});

router.get("/me", authRequired, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { onboardingProfile: true, onboardingCompletedAt: true, role: true },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    profile: user.onboardingProfile,
    completedAt: user.onboardingCompletedAt?.toISOString() ?? null,
    role: user.role,
  });
});

router.patch("/", authRequired, async (req: AuthedRequest, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const me = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!me) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  let profileJson: object;
  let specialtyUpdate: string | undefined;

  if (me.role === "LEARNER") {
    const l = parsed.data.learner;
    if (!l) {
      res.status(400).json({ error: "learner profile required" });
      return;
    }
    const js = l.journeySummary?.trim();
    const dn = mergeDomainNicheRecords(
      sanitizeDomainNiches(l.domainNiches as Record<string, string[]> | undefined, l.interests, 4),
      domainNichesFromLegacyFood(l.foodNiches),
      l.interests,
      4,
    );
    const fn = foodNichesForStorage(dn);
    profileJson = {
      learner: {
        interests: l.interests,
        primaryGoal: l.primaryGoal,
        weeklyHours: l.weeklyHours,
        formatPreference: l.formatPreference,
        level: l.level,
        ...(js ? { journeySummary: js } : {}),
        ...(Object.keys(dn).length > 0 ? { domainNiches: dn } : {}),
        ...(fn?.length ? { foodNiches: fn } : {}),
      },
    };
  } else {
    const rawIns = parsed.data.instructor;
    if (!rawIns) {
      res.status(400).json({ error: "instructor profile required" });
      return;
    }
    const {
      teachingLanguages: rawLangs,
      publicHeadline: rawHeadline,
      publicLink: rawLink,
      foodNiches: rawFood,
      domainNiches: rawDomainNiches,
      ...insCore
    } = rawIns;
    const teachingLanguages = rawLangs?.length
      ? filterToAllowed(rawLangs, ids(TEACHING_LANGUAGES), 8)
      : undefined;
    const dn = mergeDomainNicheRecords(
      sanitizeDomainNiches(rawDomainNiches as Record<string, string[]> | undefined, insCore.domains, 4),
      domainNichesFromLegacyFood(rawFood),
      insCore.domains,
      4,
    );
    const fn = foodNichesForStorage(dn);
    const ins = {
      ...insCore,
      publicHeadline: rawHeadline?.trim() || undefined,
      publicLink: rawLink?.trim() || undefined,
      ...(teachingLanguages?.length ? { teachingLanguages } : {}),
      ...(Object.keys(dn).length > 0 ? { domainNiches: dn } : {}),
      ...(fn?.length ? { foodNiches: fn } : {}),
    };
    let draft = ins.courseDraft;
    if (!draft) {
      draft = buildInstructorCourseDraft({
        name: me.name,
        domains: ins.domains,
        experienceBand: ins.experienceBand,
        audience: ins.audience,
        classFormat: ins.classFormat,
        sessionLength: ins.sessionLength,
        teachingStyles: ins.teachingStyles,
        domainNiches: dn,
        foodNiches: fn,
        promptHint: undefined,
      });
    }
    const domainLabels = ins.domains
      .map((id) => LEARNER_INTERESTS.find((x) => x.id === id)?.label)
      .filter(Boolean)
      .join(" · ");
    specialtyUpdate = domainLabels.slice(0, 160) || me.specialty || "Instructor";
    profileJson = { instructor: { ...ins, courseDraft: draft } };
  }

  const updated = await prisma.user.update({
    where: { id: me.id },
    data: {
      onboardingProfile: profileJson as object,
      onboardingCompletedAt: new Date(),
      ...(specialtyUpdate ? { specialty: specialtyUpdate } : {}),
    },
  });

  res.json({
    ok: true,
    user: publicUser(updated),
  });
});

router.post("/suggest", authRequired, async (req: AuthedRequest, res) => {
  const parsed = suggestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { prompt, role } = parsed.data;

  const base = heuristicSuggestions(prompt, role as Role);
  let merged: Record<string, unknown> = { ...base };
  const llm = await llmOnboardingSuggestions(prompt, role as Role);
  let source: "gemini" | "openai" | "rules" = "rules";
  if (llm) {
    const aiRaw = llm.raw;
    if (role === "LEARNER") {
      const s = sanitizeAiLearner(aiRaw, base as { learner: Record<string, unknown> });
      if (s) {
        const baseL = (base as { learner: { interests: string[]; domainNiches?: Record<string, string[]>; foodNiches?: string[] } }).learner;
        const interests = mergeIdLists(baseL.interests ?? [], s.learner.interests, ids(LEARNER_INTERESTS), 12);
        const baseDn = mergeDomainNicheRecords(
          sanitizeDomainNiches(baseL.domainNiches, interests, 4),
          domainNichesFromLegacyFood(baseL.foodNiches),
          interests,
          4,
        );
        const aiDn = mergeDomainNicheRecords(
          sanitizeDomainNiches((s.learner as { domainNiches?: Record<string, string[]> }).domainNiches, interests, 4),
          domainNichesFromLegacyFood((s.learner as { foodNiches?: string[] }).foodNiches),
          interests,
          4,
        );
        const domainNiches = mergeDomainNicheRecords(baseDn, aiDn, interests, 4);
        merged = {
          ...merged,
          learner: { ...s.learner, interests, domainNiches, foodNiches: domainNiches.food_baking ?? [] },
        };
        source = llm.provider;
      }
    } else {
      const s = sanitizeAiInstructor(aiRaw, base as { instructor: Record<string, unknown> });
      if (s) {
        const baseI = (base as { instructor: { domains: string[]; domainNiches?: Record<string, string[]>; foodNiches?: string[] } }).instructor;
        const domains = mergeIdLists(baseI.domains ?? [], s.instructor.domains, ids(LEARNER_INTERESTS), 10);
        const baseDn = mergeDomainNicheRecords(
          sanitizeDomainNiches(baseI.domainNiches, domains, 4),
          domainNichesFromLegacyFood(baseI.foodNiches),
          domains,
          4,
        );
        const aiDn = mergeDomainNicheRecords(
          sanitizeDomainNiches((s.instructor as { domainNiches?: Record<string, string[]> }).domainNiches, domains, 4),
          domainNichesFromLegacyFood((s.instructor as { foodNiches?: string[] }).foodNiches),
          domains,
          4,
        );
        const domainNiches = mergeDomainNicheRecords(baseDn, aiDn, domains, 4);
        merged = {
          ...merged,
          instructor: { ...s.instructor, domains, domainNiches, foodNiches: domainNiches.food_baking ?? [] },
        };
        source = llm.provider;
      }
    }
  }

  if (role === "INSTRUCTOR" && merged.instructor) {
    const ins = merged.instructor as Record<string, unknown>;
    const domains = (ins.domains as string[]) || [];
    if (domains.length) {
      const me = await prisma.user.findUnique({ where: { id: req.userId! }, select: { name: true } });
      const previewDn = mergeDomainNicheRecords(
        sanitizeDomainNiches(ins.domainNiches as Record<string, string[]> | undefined, domains, 4),
        domainNichesFromLegacyFood(ins.foodNiches as string[] | undefined),
        domains,
        4,
      );
      (merged as { instructor: Record<string, unknown> }).instructor = {
        ...ins,
        courseDraftPreview: buildInstructorCourseDraft({
          name: me?.name ?? "Instructor",
          domains,
          experienceBand: String(ins.experienceBand ?? "1_3_years"),
          audience: String(ins.audience ?? "hobbyists"),
          classFormat: String(ins.classFormat ?? "live_online"),
          sessionLength: String(ins.sessionLength ?? "60_90"),
          teachingStyles: (ins.teachingStyles as string[]) || ["demo_heavy"],
          domainNiches: previewDn,
          foodNiches: previewDn.food_baking,
          promptHint: prompt,
        }),
      };
    }
  }

  res.json({ suggestions: merged, source });
});

export default router;
