import {
  AUDIENCE,
  CLASS_FORMAT,
  EXPERIENCE_BAND,
  FOOD_COOKING_NICHES,
  INSTRUCTOR_DOMAINS,
  SESSION_LENGTH,
  TEACHING_STYLES,
  categoryForDomain,
  imageKeyForDomain,
  labelNicheId,
} from "./onboardingCatalog.js";

function labelById<T extends { id: string; label: string }>(rows: readonly T[], id: string): string {
  return rows.find((r) => r.id === id)?.label ?? id.replace(/_/g, " ");
}

function mergedDomainNiches(
  domainNiches: Record<string, string[]> | undefined,
  foodNiches: string[] | undefined,
  domains: string[],
): Record<string, string[]> {
  const m = { ...(domainNiches ?? {}) };
  if (foodNiches?.length && domains.includes("food_baking")) m.food_baking = foodNiches;
  return m;
}

function formatNicheEmphasisBlock(
  domainNiches: Record<string, string[]>,
  domains: string[],
  fmtLabel: string,
  sessLabel: string,
): string {
  const lines: string[] = [];
  for (const d of domains) {
    const n = domainNiches[d];
    if (!n?.length) continue;
    const topic = labelById(INSTRUCTOR_DOMAINS, d).split("—")[0].trim();
    const labels = n.map((id) => labelNicheId(d, id)).join(" · ");
    lines.push(`${topic}: ${labels}`);
  }
  if (!lines.length) return "";
  return `\n\n[What we emphasize]\n${lines.join("\n")} — aligned with ${fmtLabel.toLowerCase()} delivery (${sessLabel.toLowerCase()} sessions).`;
}

export function buildInstructorClassScript(
  input: {
    name: string;
    domains: string[];
    experienceBand: string;
    audience: string;
    classFormat: string;
    sessionLength: string;
    teachingStyles: string[];
    domainNiches?: Record<string, string[]>;
    foodNiches?: string[];
    promptHint?: string;
  },
  variant = 0,
) {
  const primary = input.domains[0] ?? "art_craft";
  const domainLabel = labelById(INSTRUCTOR_DOMAINS, primary);
  const topic = domainLabel.split("—")[0].trim();
  const aud = labelById(AUDIENCE, input.audience);
  const fmt = labelById(CLASS_FORMAT, input.classFormat);
  const sess = labelById(SESSION_LENGTH, input.sessionLength);
  const exp = labelById(EXPERIENCE_BAND, input.experienceBand);
  const styles = input.teachingStyles.map((id) => labelById(TEACHING_STYLES, id)).join(", ");
  const v = ((variant % 3) + 3) % 3;

  const openers = [
    `Hi — I'm ${input.name}. Thanks for joining; we'll focus on ${topic} in a way that fits ${aud.toLowerCase()}.`,
    `Welcome! I'm ${input.name}. This class is built for ${aud.toLowerCase()} — we'll work on ${topic} step by step.`,
    `Hey there, I'm ${input.name}. Glad you're here — together we'll make ${topic} approachable and practical.`,
  ];

  const bridges = [
    `I teach with a ${fmt.toLowerCase()} rhythm and ${sess.toLowerCase()} sessions so you always know what to expect.`,
    `Sessions follow a ${fmt.toLowerCase()} format at a ${sess.toLowerCase()} pace — demos, practice, and quick check-ins.`,
    `Expect a ${fmt.toLowerCase()} flow: clear demos, hands-on reps, and feedback loops sized for ${sess.toLowerCase()} blocks.`,
  ];

  const bodies = [
    `With ${exp.toLowerCase()} in the room, we blend ${styles.toLowerCase()} — you'll see the technique, try it, and leave with a repeatable practice.`,
    `My background is ${exp.toLowerCase()}; we lean on ${styles.toLowerCase()} so concepts stick beyond the live session.`,
    `I keep things ${styles.toLowerCase()} because that's what worked for me across ${exp.toLowerCase()} of teaching this material.`,
  ];

  const closers = [
    `By the end, you'll have a finished milestone you can show off and a simple plan for what to practice next.`,
    `You'll walk away with something concrete to share plus notes on how to keep building without overwhelm.`,
    `Goal: tangible progress each week — one clear win per session and a short list of next steps.`,
  ];

  const hint = (input.promptHint ?? "").trim();
  const personal =
    hint.length > 12
      ? `\n\n[From your story]\nYou mentioned: "${hint.slice(0, 220)}${hint.length > 220 ? "…" : ""}" — we'll thread that into examples where it helps.`
      : "";

  const dn = mergedDomainNiches(input.domainNiches, input.foodNiches, input.domains);
  const nicheLine = formatNicheEmphasisBlock(dn, input.domains, fmt, sess);

  return `${openers[v]}

${bridges[v]}

${bodies[v]}

${closers[v]}${personal}${nicheLine}`.slice(0, 6000);
}

export function buildInstructorCourseDraft(
  input: {
    name: string;
    domains: string[];
    experienceBand: string;
    audience: string;
    classFormat: string;
    sessionLength: string;
    teachingStyles: string[];
    domainNiches?: Record<string, string[]>;
    foodNiches?: string[];
    promptHint?: string;
  },
  scriptVariant = 0,
) {
  const dn = mergedDomainNiches(input.domainNiches, input.foodNiches, input.domains);
  const primary = input.domains[0] ?? "art_craft";
  const domainLabel = labelById(INSTRUCTOR_DOMAINS, primary);
  const prompt = (input.promptHint ?? "").toLowerCase();
  let title = `${domainLabel.split("—")[0].trim()} — guided fundamentals`;
  if (prompt.includes("photo") || primary === "photography") {
    title = "Photography fundamentals: light, composition & editing workflow";
  }
  if (primary === "food_baking") {
    const n = dn.food_baking ?? input.foodNiches ?? [];
    if (n.includes("indian_regional")) title = "Indian home cooking — spices, techniques & everyday thalis";
    else if (n.includes("chinese_panasian")) title = "Chinese & pan-Asian cooking — wok skills & balanced meals";
    else if (n.includes("baking_dessert")) title = "Baking & desserts — technique, timing & presentation";
    else if (n.includes("continental_western")) title = "Continental cooking — sauces, plating & weeknight meals";
    else if (n.includes("street_snacks")) title = "Street food & snacks — bold flavors, safe prep at home";
    else if (n.includes("healthy_meal_prep")) title = "Healthy cooking & meal prep — realistic routines";
    else if (n.includes("plant_based")) title = "Plant-based cooking — flavor-first vegetarian & vegan dishes";
    else if (prompt.includes("bake")) title = "Hands-on baking: techniques, timing & presentation";
    else title = "Hands-on cooking: techniques, timing & confident home cooking";
  }
  if (prompt.includes("wood") || primary === "diy_maker") {
    title = "Maker workshop: tools, safety & your first finished piece";
  }
  if (primary === "yoga_pilates") {
    title = "Yoga & Pilates: alignment, breath, and sustainable practice";
    const y = dn.yoga_pilates;
    if (y?.includes("pilates_reformer")) title = "Pilates reformer: fundamentals, spring work & alignment";
    else if (y?.includes("yin_restorative")) title = "Yin & restorative yoga: stillness, breath & nervous-system care";
    else if (y?.includes("vinyasa_flow")) title = "Vinyasa flow: breath-linked movement & safe progressions";
  }
  if (primary === "fitness_strength") {
    title = "Strength & conditioning: form, progression, and smart training";
    const f = dn.fitness_strength;
    if (f?.includes("hiit_conditioning")) title = "HIIT & conditioning: intensity, recovery & smart scaling";
    else if (f?.includes("calisthenics_bodyweight")) title = "Calisthenics & bodyweight: skills, strength & control";
  }
  if (primary === "dance_movement") {
    title = "Dance fundamentals: rhythm, technique, and confident movement";
    const d = dn.dance_movement;
    if (d?.includes("bollywood_indian_folk")) title = "Bollywood & Indian folk dance: expression, rhythm & choreography";
    else if (d?.includes("latin_salsa_bachata")) title = "Latin dance: salsa, bachata & social floor skills";
  }
  if (primary === "music_audio") {
    const m = dn.music_audio;
    if (m?.includes("strings_guitar")) title = "Guitar: technique, repertoire & confident playing";
    else if (m?.includes("keys_piano")) title = "Piano & keys: reading, rhythm & expressive playing";
    else if (m?.includes("vocals_singing")) title = "Vocal coaching: breath, pitch & performance confidence";
    else if (m?.includes("production_daw")) title = "Music production: DAW workflow, arrangement & mix basics";
  }
  if (primary === "nutrition_health") {
    title = "Nutrition habits: planning, balance, and realistic meal systems";
  }

  const aud = labelById(AUDIENCE, input.audience);
  const fmt = labelById(CLASS_FORMAT, input.classFormat);
  const sess = labelById(SESSION_LENGTH, input.sessionLength);
  const exp = labelById(EXPERIENCE_BAND, input.experienceBand);
  const styles = input.teachingStyles.map((id) => labelById(TEACHING_STYLES, id)).join(", ");

  const nicheSentenceParts: string[] = [];
  for (const dom of input.domains) {
    const tags = dn[dom];
    if (!tags?.length) continue;
    const short = labelById(INSTRUCTOR_DOMAINS, dom).split("—")[0].trim();
    nicheSentenceParts.push(`${short}: ${tags.map((id) => labelNicheId(dom, id)).join(", ")}`);
  }
  const nicheExtra = nicheSentenceParts.length ? ` Focus areas include ${nicheSentenceParts.join(" · ")}.` : "";
  const description = `${title}. ${input.name} teaches ${aud} with a ${fmt.toLowerCase()} format. Sessions are structured around ${sess.toLowerCase()} pacing. With ${exp.toLowerCase()} teaching experience, the class blends ${styles}.${nicheExtra} Learners get clear milestones, demos, and feedback so progress feels tangible each week.`;

  const outcomes = `Complete a portfolio-ready project or repeatable practice routine.\nMaster core techniques with instructor checkpoints and examples.\nBuild confidence explaining your process to others.\nReceive a concise resource list and next steps after the class.`;

  return {
    title: title.slice(0, 160),
    category: categoryForDomain(primary),
    format: input.classFormat === "in_person_studio" ? ("IN_PERSON" as const) : ("ONLINE" as const),
    durationLabel:
      input.sessionLength === "multi_week"
        ? "6 weeks"
        : input.sessionLength === "half_day"
          ? "1 day intensive"
          : input.sessionLength === "under_60"
            ? "4 weeks (short sessions)"
            : "4 weeks",
    priceInr: 2499,
    description: description.slice(0, 5000),
    outcomes: outcomes.slice(0, 4000),
    imageKey: imageKeyForDomain(primary),
    classScript: buildInstructorClassScript(
      {
        ...input,
        domainNiches: dn,
        foodNiches: dn.food_baking ?? input.foodNiches ?? [],
      },
      scriptVariant,
    ),
  };
}
