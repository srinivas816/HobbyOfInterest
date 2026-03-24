/** Canonical onboarding option ids — AI and clients must only use these. */

export const LEARNER_INTERESTS = [
  { id: "art_craft", label: "Art & illustration", categoryHint: "Art & Craft" },
  { id: "diy_maker", label: "DIY & woodworking / maker", categoryHint: "DIY & Maker" },
  { id: "food_baking", label: "Cooking & baking", categoryHint: "Food & Baking" },
  { id: "music_audio", label: "Music & audio", categoryHint: "Music" },
  { id: "yoga_pilates", label: "Yoga & Pilates", categoryHint: "Fitness & movement" },
  { id: "fitness_strength", label: "Gym, HIIT & strength training", categoryHint: "Fitness & movement" },
  { id: "dance_movement", label: "Dance & choreography", categoryHint: "Fitness & movement" },
  { id: "wellness", label: "Meditation, breathwork & nervous-system care", categoryHint: "Wellness" },
  { id: "nutrition_health", label: "Nutrition & healthy cooking", categoryHint: "Wellness" },
  { id: "photography", label: "Photography & video", categoryHint: "Art & Craft" },
  { id: "fashion_textiles", label: "Fashion, sewing & textiles", categoryHint: "Art & Craft" },
  { id: "writing_biz", label: "Writing, marketing & business skills", categoryHint: "Wellness" },
  { id: "kids_family", label: "Kids & family activities", categoryHint: "Art & Craft" },
  { id: "tech_creative", label: "Creative software & digital tools", categoryHint: "DIY & Maker" },
] as const;

export const LEARNER_GOALS = [
  { id: "creative_outlet", label: "Pure creative outlet" },
  { id: "career_skill", label: "Level up for my career" },
  { id: "side_income", label: "Build a side income" },
  { id: "social_fun", label: "Meet people & have fun" },
  { id: "kids_family", label: "Something to do with kids / family" },
  { id: "health_balance", label: "Balance & mental health" },
] as const;

export const WEEKLY_HOURS = [
  { id: "lt_2", label: "Under 2 hours / week" },
  { id: "2_5", label: "2–5 hours / week" },
  { id: "5_10", label: "5–10 hours / week" },
  { id: "gt_10", label: "10+ hours — I’m all in" },
] as const;

export const FORMAT_PREF = [
  { id: "online_only", label: "Mostly online / self-paced" },
  { id: "in_person", label: "In-person studio or workshops" },
  { id: "mixed", label: "Mix of online + in-person" },
] as const;

export const LEVEL = [
  { id: "beginner", label: "Beginner — starting fresh" },
  { id: "some_experience", label: "Some experience — want structure" },
  { id: "advanced", label: "Advanced — looking for depth" },
] as const;

export const INSTRUCTOR_DOMAINS = LEARNER_INTERESTS;

export const EXPERIENCE_BAND = [
  { id: "first_class", label: "Teaching my first paid class" },
  { id: "1_3_years", label: "1–3 years teaching" },
  { id: "3_plus", label: "3+ years — seasoned tutor" },
] as const;

export const AUDIENCE = [
  { id: "hobbyists", label: "Hobbyists & weekend learners" },
  { id: "career_switchers", label: "Career switchers" },
  { id: "kids_teens", label: "Kids & teens" },
  { id: "professionals", label: "Working professionals" },
  { id: "creators", label: "Independent creators & freelancers" },
] as const;

export const CLASS_FORMAT = [
  { id: "live_online", label: "Live online sessions" },
  { id: "in_person_studio", label: "In-person studio / venue" },
  { id: "hybrid_async", label: "Hybrid with async assignments" },
] as const;

export const SESSION_LENGTH = [
  { id: "under_60", label: "Under 60 minutes per session" },
  { id: "60_90", label: "60–90 minutes" },
  { id: "half_day", label: "Half-day intensives" },
  { id: "multi_week", label: "Multi-week structured program" },
] as const;

export const TEACHING_STYLES = [
  { id: "demo_heavy", label: "Demo-heavy — watch then try" },
  { id: "project_based", label: "Project-based milestones" },
  { id: "lecture_qa", label: "Lecture + Q&A" },
  { id: "critique_feedback", label: "Critique & personalized feedback" },
  { id: "community_cohort", label: "Community cohort & accountability" },
] as const;

/** Languages you’re comfortable teaching in — for discoverability & trust. */
/** When “Cooking & baking” is selected — narrows discovery & AI copy (Indian, bakery, etc.). */
export const FOOD_COOKING_NICHES = [
  { id: "indian_regional", label: "Indian regional & home-style" },
  { id: "chinese_panasian", label: "Chinese & pan-Asian" },
  { id: "baking_dessert", label: "Baking, breads & desserts" },
  { id: "continental_western", label: "Continental & Western cooking" },
  { id: "street_snacks", label: "Street food & snacks" },
  { id: "healthy_meal_prep", label: "Healthy meals & meal prep" },
  { id: "plant_based", label: "Plant-based & vegan cooking" },
] as const;

/** Sub-focus when Yoga & Pilates is selected (studio-style depth, similar to category + subcategory on large marketplaces). */
export const YOGA_PILATES_NICHES = [
  { id: "hatha_gentle", label: "Hatha & gentle foundations" },
  { id: "vinyasa_flow", label: "Vinyasa & flow" },
  { id: "ashtanga_power", label: "Ashtanga / power yoga" },
  { id: "yin_restorative", label: "Yin & restorative" },
  { id: "pilates_mat", label: "Pilates (mat)" },
  { id: "pilates_reformer", label: "Pilates (reformer / apparatus)" },
  { id: "prenatal_postnatal", label: "Prenatal & postnatal" },
] as const;

export const FITNESS_STRENGTH_NICHES = [
  { id: "hiit_conditioning", label: "HIIT & metabolic conditioning" },
  { id: "strength_weights", label: "Strength & barbell / dumbbells" },
  { id: "calisthenics_bodyweight", label: "Calisthenics & bodyweight" },
  { id: "functional_training", label: "Functional & athletic performance" },
  { id: "bodybuilding_hypertrophy", label: "Hypertrophy & physique" },
  { id: "mobility_recovery", label: "Mobility, stretching & recovery" },
] as const;

export const DANCE_MOVEMENT_NICHES = [
  { id: "bollywood_indian_folk", label: "Bollywood & Indian folk" },
  { id: "hiphop_street", label: "Hip-hop & street styles" },
  { id: "contemporary_modern", label: "Contemporary & modern" },
  { id: "classical_indian", label: "Classical Indian dance" },
  { id: "latin_salsa_bachata", label: "Latin, salsa & bachata" },
  { id: "ballroom_social", label: "Ballroom & social dance" },
  { id: "kpop_choreo", label: "K-pop & commercial choreo" },
] as const;

export const MUSIC_AUDIO_NICHES = [
  { id: "strings_guitar", label: "Guitar & string instruments" },
  { id: "keys_piano", label: "Piano & keys" },
  { id: "drums_percussion", label: "Drums & percussion" },
  { id: "vocals_singing", label: "Vocals & singing" },
  { id: "production_daw", label: "Music production & DAW" },
  { id: "dj_mixing", label: "DJ & live mixing" },
  { id: "theory_composition", label: "Theory, ear training & songwriting" },
] as const;

export const ART_CRAFT_NICHES = [
  { id: "drawing_sketch", label: "Drawing & sketching" },
  { id: "watercolor", label: "Watercolor" },
  { id: "acrylic_oil", label: "Acrylic & oil painting" },
  { id: "pottery_ceramics", label: "Pottery & ceramics" },
  { id: "printmaking", label: "Printmaking & mixed media" },
  { id: "digital_illustration", label: "Digital illustration & Procreate" },
] as const;

export const PHOTOGRAPHY_NICHES = [
  { id: "portrait_people", label: "Portrait & people" },
  { id: "landscape_travel", label: "Landscape & travel" },
  { id: "street_documentary", label: "Street & documentary" },
  { id: "product_commercial", label: "Product & small business" },
  { id: "mobile_iphone", label: "Mobile photography" },
  { id: "editing_lightroom", label: "Editing — Lightroom / Photoshop" },
  { id: "video_filmmaking", label: "Video & short filmmaking" },
] as const;

export const FASHION_TEXTILES_NICHES = [
  { id: "sewing_garments", label: "Sewing garments & alterations" },
  { id: "pattern_draping", label: "Patterns & draping" },
  { id: "embroidery", label: "Embroidery & surface design" },
  { id: "knit_crochet", label: "Knitting & crochet" },
  { id: "fashion_illustration", label: "Fashion illustration & design basics" },
] as const;

export const DIY_MAKER_NICHES = [
  { id: "woodworking", label: "Woodworking & carpentry" },
  { id: "metal_small_machining", label: "Metal, welding & small projects" },
  { id: "electronics_maker", label: "Electronics, Arduino & maker tech" },
  { id: "3d_printing_cad", label: "3D printing & CAD basics" },
  { id: "home_repair_upcycle", label: "Home repair & upcycling" },
] as const;

/** Domains that show a second-step “sub-focus” chip row (parity across verticals, not only food). */
export const DOMAIN_NICHE_CATALOG: Record<string, readonly { id: string; label: string }[]> = {
  food_baking: FOOD_COOKING_NICHES,
  yoga_pilates: YOGA_PILATES_NICHES,
  fitness_strength: FITNESS_STRENGTH_NICHES,
  dance_movement: DANCE_MOVEMENT_NICHES,
  music_audio: MUSIC_AUDIO_NICHES,
  art_craft: ART_CRAFT_NICHES,
  photography: PHOTOGRAPHY_NICHES,
  fashion_textiles: FASHION_TEXTILES_NICHES,
  diy_maker: DIY_MAKER_NICHES,
};

export function nicheOptionsForDomain(domainId: string): readonly { id: string; label: string }[] {
  return DOMAIN_NICHE_CATALOG[domainId] ?? [];
}

export function domainsWithNicheStep(selected: string[]): string[] {
  return selected.filter((id) => (DOMAIN_NICHE_CATALOG[id]?.length ?? 0) > 0);
}

export function sanitizeDomainNiches(
  raw: Record<string, string[] | undefined> | undefined,
  selected: string[],
  maxPerDomain = 4,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  if (!raw) return out;
  for (const domain of selected) {
    const opts = DOMAIN_NICHE_CATALOG[domain];
    if (!opts?.length) continue;
    const allowed = new Set(opts.map((o) => o.id));
    const list = raw[domain];
    if (!list?.length) continue;
    const picked: string[] = [];
    for (const x of list) {
      if (allowed.has(x) && !picked.includes(x)) picked.push(x);
      if (picked.length >= maxPerDomain) break;
    }
    if (picked.length) out[domain] = picked;
  }
  return out;
}

export function mergeDomainNicheRecords(
  a: Record<string, string[]>,
  b: Record<string, string[]>,
  selected: string[],
  maxPerDomain = 4,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const domain of selected) {
    const opts = DOMAIN_NICHE_CATALOG[domain];
    if (!opts?.length) continue;
    const allowed = new Set(opts.map((o) => o.id));
    const merged = [...(a[domain] ?? []), ...(b[domain] ?? [])];
    const picked: string[] = [];
    for (const x of merged) {
      if (allowed.has(x) && !picked.includes(x)) picked.push(x);
      if (picked.length >= maxPerDomain) break;
    }
    if (picked.length) out[domain] = picked;
  }
  return out;
}

/** Legacy profiles stored `foodNiches` only. */
export function domainNichesFromLegacyFood(foodNiches: string[] | undefined): Record<string, string[]> {
  if (!foodNiches?.length) return {};
  const allowed = new Set<string>(FOOD_COOKING_NICHES.map((x) => x.id));
  const picked = foodNiches.filter((x) => allowed.has(x)).slice(0, 4);
  return picked.length ? { food_baking: picked } : {};
}

export function foodNichesForStorage(domainNiches: Record<string, string[]>): string[] | undefined {
  const f = domainNiches.food_baking;
  return f?.length ? f : undefined;
}

export function labelNicheId(domainId: string, nicheId: string): string {
  const opts = DOMAIN_NICHE_CATALOG[domainId];
  if (!opts) return nicheId.replace(/_/g, " ");
  return opts.find((o) => o.id === nicheId)?.label ?? nicheId.replace(/_/g, " ");
}

export const TEACHING_LANGUAGES = [
  { id: "en", label: "English" },
  { id: "hi", label: "Hindi" },
  { id: "ta", label: "Tamil" },
  { id: "te", label: "Telugu" },
  { id: "mr", label: "Marathi" },
  { id: "bn", label: "Bengali" },
  { id: "kn", label: "Kannada" },
  { id: "ml", label: "Malayalam" },
  { id: "gu", label: "Gujarati" },
  { id: "pa", label: "Punjabi" },
] as const;

export const COURSE_CATEGORIES = [
  "Art & Craft",
  "DIY & Maker",
  "Food & Baking",
  "Music",
  "Fitness & movement",
  "Wellness",
] as const;

export const IMAGE_KEYS = [
  "hero-pottery",
  "hero-painting",
  "hero-floristry",
  "category-baking",
  "category-woodworking",
  "category-watercolor",
  "category-sewing",
  "category-music",
] as const;

const DOMAIN_TO_IMAGE: Record<string, (typeof IMAGE_KEYS)[number]> = {
  art_craft: "hero-painting",
  diy_maker: "category-woodworking",
  food_baking: "category-baking",
  music_audio: "category-music",
  yoga_pilates: "hero-floristry",
  fitness_strength: "category-woodworking",
  dance_movement: "category-music",
  wellness: "hero-floristry",
  nutrition_health: "category-baking",
  photography: "hero-painting",
  fashion_textiles: "category-sewing",
  writing_biz: "hero-floristry",
  kids_family: "hero-pottery",
  tech_creative: "category-woodworking",
};

const DOMAIN_TO_CATEGORY: Record<string, string> = Object.fromEntries(
  LEARNER_INTERESTS.map((i) => [i.id, i.categoryHint]),
);

export function categoryForDomain(domainId: string): string {
  return DOMAIN_TO_CATEGORY[domainId] ?? "Art & Craft";
}

export function imageKeyForDomain(domainId: string): (typeof IMAGE_KEYS)[number] {
  return DOMAIN_TO_IMAGE[domainId] ?? "hero-pottery";
}

export function catalogPayload() {
  const domainNicheOptions = Object.fromEntries(
    Object.entries(DOMAIN_NICHE_CATALOG).map(([k, v]) => [k, [...v]]),
  ) as Record<string, { id: string; label: string }[]>;
  return {
    learner: {
      interests: [...LEARNER_INTERESTS],
      primaryGoals: [...LEARNER_GOALS],
      weeklyHours: [...WEEKLY_HOURS],
      formatPreference: [...FORMAT_PREF],
      level: [...LEVEL],
      foodCookingNiches: [...FOOD_COOKING_NICHES],
      domainNicheOptions,
    },
    instructor: {
      domains: [...INSTRUCTOR_DOMAINS],
      experienceBand: [...EXPERIENCE_BAND],
      audience: [...AUDIENCE],
      classFormat: [...CLASS_FORMAT],
      sessionLength: [...SESSION_LENGTH],
      teachingStyles: [...TEACHING_STYLES],
      teachingLanguages: [...TEACHING_LANGUAGES],
      foodCookingNiches: [...FOOD_COOKING_NICHES],
      domainNicheOptions,
    },
    courseCategories: [...COURSE_CATEGORIES],
    imageKeys: [...IMAGE_KEYS],
  };
}

/** Compact id list for LLM system prompts (Gemini / OpenAI). */
export function catalogSummaryForAi(): string {
  const c = catalogPayload();
  return [
    `LEARNER interests: ${c.learner.interests.map((i) => i.id).join(", ")}`,
    `LEARNER primaryGoals: ${c.learner.primaryGoals.map((i) => i.id).join(", ")}`,
    `LEARNER weeklyHours: ${c.learner.weeklyHours.map((i) => i.id).join(", ")}`,
    `LEARNER formatPreference: ${c.learner.formatPreference.map((i) => i.id).join(", ")}`,
    `LEARNER level: ${c.learner.level.map((i) => i.id).join(", ")}`,
    `INSTRUCTOR domains: ${c.instructor.domains.map((i) => i.id).join(", ")}`,
    `INSTRUCTOR experienceBand: ${c.instructor.experienceBand.map((i) => i.id).join(", ")}`,
    `INSTRUCTOR audience: ${c.instructor.audience.map((i) => i.id).join(", ")}`,
    `INSTRUCTOR classFormat: ${c.instructor.classFormat.map((i) => i.id).join(", ")}`,
    `INSTRUCTOR sessionLength: ${c.instructor.sessionLength.map((i) => i.id).join(", ")}`,
    `INSTRUCTOR teachingStyles: ${c.instructor.teachingStyles.map((i) => i.id).join(", ")}`,
    `INSTRUCTOR teachingLanguages (optional): ${c.instructor.teachingLanguages.map((i) => i.id).join(", ")}`,
    `FOOD niches (optional, only if cooking/baking teaching or learning): ${c.learner.foodCookingNiches.map((i) => i.id).join(", ")}`,
  ].join("\n");
}

/** Infer food sub-focus from free text (tutor bios, learner stories). */
export function foodNichesFromKeywords(promptLower: string): string[] {
  const p = promptLower.toLowerCase();
  const out: string[] = [];
  const add = (id: string) => {
    if (!out.includes(id)) out.push(id);
  };
  if (
    /\bindian\b|\bbiryani\b|\bdosa\b|\bmasala\b|\bpaneer\b|\bcurry\b|\broti\b|\bthali\b|\bregional indian\b/.test(p) ||
    (p.includes("indian") && (p.includes("food") || p.includes("cook") || p.includes("cuisine")))
  ) {
    add("indian_regional");
  }
  if (
    /\bchinese\b|\bdim sum\b|\bwok\b|\bszechuan\b|\bsichuan\b|\bthai\b|\bjapanese\b|\bkorean\b|\bsushi\b|\bpan-?asian\b/.test(p)
  ) {
    add("chinese_panasian");
  }
  if (/\bbake\b|\bbakery\b|\bbread\b|\bcake\b|\bpastry\b|\bdessert\b|\bcookie\b|\bpatisserie\b|\bfrosting\b/.test(p)) {
    add("baking_dessert");
  }
  if (/\bitalian\b|\bpasta\b|\bpizza\b|\bcontinental\b|\bfrench\b|\bmexican\b|\bmediterranean\b/.test(p)) {
    add("continental_western");
  }
  if (/\bstreet food\b|\bchaat\b|\bsnack\b|\btapas\b/.test(p)) {
    add("street_snacks");
  }
  if (/\bhealthy\b|\bmeal prep\b|\bsalad\b|\bketo\b|\blow carb\b|\bhigh protein\b/.test(p)) {
    add("healthy_meal_prep");
  }
  if (/\bvegan\b|\bplant[- ]based\b|\bvegetarian\b/.test(p)) {
    add("plant_based");
  }
  if (/\bfood\b|\bcook\b|\bchef\b|\bcuisine\b|\bkitchen\b|\brecipe\b|\btutor\b.*\bfood\b|\bteach.*\bcook/.test(p) && out.length === 0) {
    add("indian_regional");
    add("baking_dessert");
  }
  const allowed = new Set<string>(FOOD_COOKING_NICHES.map((x) => x.id));
  return out.filter((id) => allowed.has(id)).slice(0, 4);
}

/** Keyword → sub-niches for every domain that has a niche step (used by heuristics + can augment LLM). */
export function domainNichesFromKeywords(promptLower: string, selectedIds: string[]): Record<string, string[]> {
  const p = promptLower.toLowerCase();
  const out: Record<string, string[]> = {};
  const take = (domain: string, ids: string[]) => {
    if (!selectedIds.includes(domain)) return;
    const opts = DOMAIN_NICHE_CATALOG[domain];
    if (!opts?.length) return;
    const allowed = new Set(opts.map((o) => o.id));
    const picked: string[] = [];
    for (const id of ids) {
      if (allowed.has(id) && !picked.includes(id)) picked.push(id);
      if (picked.length >= 4) break;
    }
    if (picked.length) out[domain] = picked;
  };

  if (selectedIds.includes("food_baking")) {
    const fn = foodNichesFromKeywords(p);
    if (fn.length) out.food_baking = fn;
  }

  if (selectedIds.includes("yoga_pilates")) {
    const ids: string[] = [];
    if (/\bpilates\b/.test(p)) {
      if (/\breformer\b|\bapparatus\b|\bcadillac\b/.test(p)) ids.push("pilates_reformer");
      else ids.push("pilates_mat");
    }
    if (/\byin\b|\brestorative\b/.test(p)) ids.push("yin_restorative");
    if (/\bashtanga\b|\bpower yoga\b|\bpower\b.*\byoga\b/.test(p)) ids.push("ashtanga_power");
    if (/\bvinyasa\b|\bflow\b/.test(p)) ids.push("vinyasa_flow");
    if (/\bhatha\b|\bgentle\b|\bbeginner\b.*\byoga\b/.test(p)) ids.push("hatha_gentle");
    if (/\bprenatal\b|\bpostnatal\b|\bpregnancy\b/.test(p)) ids.push("prenatal_postnatal");
    if (ids.length === 0 && /\byoga\b|\bpilates\b|\bbarre\b/.test(p)) ids.push("hatha_gentle", "pilates_mat");
    take("yoga_pilates", ids);
  }

  if (selectedIds.includes("fitness_strength")) {
    const ids: string[] = [];
    if (/\bhiit\b|\bmetcon\b|\bconditioning\b/.test(p)) ids.push("hiit_conditioning");
    if (/\bcalisthenics\b|\bbodyweight\b|\bpull-?up\b/.test(p)) ids.push("calisthenics_bodyweight");
    if (/\bhypertrophy\b|\bbodybuilding\b|\bbulk\b/.test(p)) ids.push("bodybuilding_hypertrophy");
    if (/\bfunctional\b|\bathletic\b|\bcrossfit\b/.test(p)) ids.push("functional_training");
    if (/\bmobility\b|\bstretch\b|\brecovery\b/.test(p)) ids.push("mobility_recovery");
    if (/\bstrength\b|\bweight\b|\bgym\b|\bbarbell\b|\bdumbbell\b/.test(p)) ids.push("strength_weights");
    if (ids.length === 0 && /\bgym\b|\bfitness\b|\bworkout\b/.test(p)) ids.push("strength_weights", "hiit_conditioning");
    take("fitness_strength", ids);
  }

  if (selectedIds.includes("dance_movement")) {
    const ids: string[] = [];
    if (/\bbollywood\b|\bbharatanatyam\b|\bclassical indian\b|\bindian dance\b/.test(p)) {
      if (/\bclassical\b|\bbharatanatyam\b|\bkathak\b/.test(p)) ids.push("classical_indian");
      else ids.push("bollywood_indian_folk");
    }
    if (/\bhip[- ]?hop\b|\bstreet dance\b|\bbreaking\b/.test(p)) ids.push("hiphop_street");
    if (/\bcontemporary\b|\bmodern dance\b/.test(p)) ids.push("contemporary_modern");
    if (/\bsalsa\b|\bbachata\b|\blatin\b|\btango\b/.test(p)) ids.push("latin_salsa_bachata");
    if (/\bballroom\b|\bwaltz\b|\bsocial dance\b/.test(p)) ids.push("ballroom_social");
    if (/\bk-?pop\b|\bcommercial\b.*\bdance\b/.test(p)) ids.push("kpop_choreo");
    if (ids.length === 0 && /\bdance\b|\bchoreo\b|\bzumba\b/.test(p)) ids.push("hiphop_street", "contemporary_modern");
    take("dance_movement", ids);
  }

  if (selectedIds.includes("music_audio")) {
    const ids: string[] = [];
    if (/\bguitar\b|\bukulele\b|\bviolin\b|\bcello\b|\bbass\b.*\binstrument\b/.test(p)) ids.push("strings_guitar");
    if (/\bpiano\b|\bkeyboard\b|\bkeys\b/.test(p)) ids.push("keys_piano");
    if (/\bdrum\b|\bpercussion\b/.test(p)) ids.push("drums_percussion");
    if (/\bvocal\b|\bsing\b|\bvoice\b/.test(p)) ids.push("vocals_singing");
    if (/\bproducer\b|\bableton\b|\bfl studio\b|\bdaw\b|\blogic pro\b/.test(p)) ids.push("production_daw");
    if (/\bdj\b|\bmixing\b|\bdecks\b/.test(p)) ids.push("dj_mixing");
    if (/\btheory\b|\bcomposition\b|\bear training\b|\bsongwriting\b/.test(p)) ids.push("theory_composition");
    if (ids.length === 0 && /\bmusic\b|\bguitar\b|\bpiano\b/.test(p)) ids.push("strings_guitar", "keys_piano");
    take("music_audio", ids);
  }

  if (selectedIds.includes("art_craft")) {
    const ids: string[] = [];
    if (/\bpottery\b|\bceramic\b|\bclay\b|\bwheel\b/.test(p)) ids.push("pottery_ceramics");
    if (/\bwatercolor\b/.test(p)) ids.push("watercolor");
    if (/\bacrylic\b|\boil paint\b|\boils\b/.test(p)) ids.push("acrylic_oil");
    if (/\bdraw\b|\bsketch\b|\bcharcoal\b/.test(p)) ids.push("drawing_sketch");
    if (/\bprint\b|\betching\b/.test(p)) ids.push("printmaking");
    if (/\bprocreate\b|\bipad\b.*\bart\b|\bdigital art\b|\billustrat/.test(p)) ids.push("digital_illustration");
    if (ids.length === 0 && /\bart\b|\bpaint\b|\bcraft\b/.test(p)) ids.push("drawing_sketch", "watercolor");
    take("art_craft", ids);
  }

  if (selectedIds.includes("photography")) {
    const ids: string[] = [];
    if (/\bportrait\b|\bheadshot\b|\bpeople\b/.test(p)) ids.push("portrait_people");
    if (/\blandscape\b|\btravel\b.*\bphoto\b/.test(p)) ids.push("landscape_travel");
    if (/\bstreet\b|\bdocumentary\b/.test(p)) ids.push("street_documentary");
    if (/\bproduct\b|\be-?commerce\b.*\bphoto\b/.test(p)) ids.push("product_commercial");
    if (/\bmobile\b|\biphone\b|\bphone photo\b/.test(p)) ids.push("mobile_iphone");
    if (/\blightroom\b|\bphotoshop\b|\bediting\b/.test(p)) ids.push("editing_lightroom");
    if (/\bvideo\b|\bfilm\b|\bcinematography\b/.test(p)) ids.push("video_filmmaking");
    if (ids.length === 0 && /\bphoto\b|\bcamera\b|\blightroom\b/.test(p)) ids.push("portrait_people", "editing_lightroom");
    take("photography", ids);
  }

  if (selectedIds.includes("fashion_textiles")) {
    const ids: string[] = [];
    if (/\bsew\b|\bgarment\b|\btailor\b|\balteration\b/.test(p)) ids.push("sewing_garments");
    if (/\bpattern\b|\bdraping\b/.test(p)) ids.push("pattern_draping");
    if (/\bembroid/.test(p)) ids.push("embroidery");
    if (/\bknit\b|\bcrochet\b/.test(p)) ids.push("knit_crochet");
    if (/\bfashion illust\b|\bdesign sketch\b/.test(p)) ids.push("fashion_illustration");
    if (ids.length === 0 && /\bsew\b|\bfabric\b|\bfashion\b/.test(p)) ids.push("sewing_garments");
    take("fashion_textiles", ids);
  }

  if (selectedIds.includes("diy_maker")) {
    const ids: string[] = [];
    if (/\bwood\b|\bcarpent\b|\bjointery\b/.test(p)) ids.push("woodworking");
    if (/\bweld\b|\bmetal\b/.test(p)) ids.push("metal_small_machining");
    if (/\barduino\b|\belectronic\b|\bcircuit\b|\braspberry\b/.test(p)) ids.push("electronics_maker");
    if (/\b3d print\b|\bcad\b|\bfusion\b|\bblender\b.*\bprint\b/.test(p)) ids.push("3d_printing_cad");
    if (/\brepair\b|\bupcycle\b|\bdiy home\b/.test(p)) ids.push("home_repair_upcycle");
    if (ids.length === 0 && /\bmaker\b|\bdiy\b|\bwood\b/.test(p)) ids.push("woodworking", "electronics_maker");
    take("diy_maker", ids);
  }

  return out;
}

export function interestCategoryHints(interestIds: string[]): string[] {
  const set = new Set<string>();
  for (const id of interestIds) {
    const row = LEARNER_INTERESTS.find((i) => i.id === id);
    if (row) set.add(row.categoryHint);
  }
  return [...set];
}
