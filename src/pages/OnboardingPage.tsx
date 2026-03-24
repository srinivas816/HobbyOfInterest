import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, parseJson } from "@/lib/api";

type DomainNicheOptions = Record<string, { id: string; label: string }[]>;

type Catalog = {
  learner: {
    interests: { id: string; label: string }[];
    primaryGoals: { id: string; label: string }[];
    weeklyHours: { id: string; label: string }[];
    formatPreference: { id: string; label: string }[];
    level: { id: string; label: string }[];
    foodCookingNiches?: { id: string; label: string }[];
    domainNicheOptions: DomainNicheOptions;
  };
  instructor: {
    domains: { id: string; label: string }[];
    experienceBand: { id: string; label: string }[];
    audience: { id: string; label: string }[];
    classFormat: { id: string; label: string }[];
    sessionLength: { id: string; label: string }[];
    teachingStyles: { id: string; label: string }[];
    teachingLanguages: { id: string; label: string }[];
    foodCookingNiches?: { id: string; label: string }[];
    domainNicheOptions: DomainNicheOptions;
  };
};

type CourseDraft = {
  title: string;
  category: string;
  format: "ONLINE" | "IN_PERSON";
  durationLabel: string;
  priceInr?: number;
  description: string;
  outcomes: string;
  imageKey?: string;
  classScript?: string;
};

function toggleInList(list: string[], id: string, max: number): string[] {
  if (list.includes(id)) return list.filter((x) => x !== id);
  if (list.length >= max) return [...list.slice(1), id];
  return [...list, id];
}

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-left text-xs font-body transition-colors ${
        active ? "border-accent bg-accent/15 text-foreground" : "border-border/70 text-muted-foreground hover:border-accent/40"
      }`}
    >
      {label}
    </button>
  );
}

const OnboardingPage = () => {
  const [params] = useSearchParams();
  const next = params.get("next") || "/learn";
  const navigate = useNavigate();
  const { user, token, ready, refreshUser } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [step, setStep] = useState(0);
  const [aiPrompt, setAiPrompt] = useState(
    "I’m a photographer in Mumbai and want to teach beginners how to use natural light and edit in Lightroom.",
  );
  const [suggestBusy, setSuggestBusy] = useState(false);
  const [aiSource, setAiSource] = useState<string | null>(null);

  const [learner, setLearner] = useState({
    interests: [] as string[],
    domainNiches: {} as Record<string, string[]>,
    primaryGoal: "",
    weeklyHours: "",
    formatPreference: "",
    level: "",
  });

  const [instructor, setInstructor] = useState({
    domains: [] as string[],
    domainNiches: {} as Record<string, string[]>,
    experienceBand: "",
    audience: "",
    classFormat: "",
    sessionLength: "",
    teachingStyles: [] as string[],
    publicHeadline: "",
    teachingLanguages: [] as string[],
    publicLink: "",
  });

  const [courseDraft, setCourseDraft] = useState<CourseDraft | null>(null);
  const [classScriptDraft, setClassScriptDraft] = useState("");
  const [scriptVariant, setScriptVariant] = useState(0);
  const [previewBusy, setPreviewBusy] = useState(false);
  const reviewDraftLoaded = useRef(false);
  const learnerReviewLoaded = useRef(false);
  const [learnerJourneyDraft, setLearnerJourneyDraft] = useState("");
  const [learnerJourneyVariant, setLearnerJourneyVariant] = useState(0);
  const learnerJourneyRef = useRef(learnerJourneyDraft);
  learnerJourneyRef.current = learnerJourneyDraft;
  const classScriptRef = useRef(classScriptDraft);
  classScriptRef.current = classScriptDraft;
  const [saveBusy, setSaveBusy] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      navigate(`/login?next=${encodeURIComponent(`/onboarding?next=${encodeURIComponent(next)}`)}`, { replace: true });
      return;
    }
    if (user?.onboardingCompletedAt) {
      navigate(next, { replace: true });
    }
  }, [ready, token, user?.onboardingCompletedAt, navigate, next]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/api/onboarding/catalog");
        const data = await parseJson<{ catalog: Catalog }>(res);
        setCatalog(data.catalog);
      } catch {
        toast.error("Could not load onboarding options");
      }
    })();
  }, []);

  const learnerPromptSeeded = useRef(false);
  useEffect(() => {
    if (!ready || !user || user.role !== "LEARNER" || learnerPromptSeeded.current) return;
    learnerPromptSeeded.current = true;
    setAiPrompt(
      "I have a few hours on weekends for creative hobbies — maybe pottery or baking — and I’m a total beginner.",
    );
  }, [ready, user]);

  const role = user?.role === "INSTRUCTOR" ? "INSTRUCTOR" : "LEARNER";
  const maxStep = role === "LEARNER" ? 5 : 6;

  const applySuggest = useCallback(async () => {
    if (!aiPrompt.trim()) return;
    setSuggestBusy(true);
    try {
      const res = await apiFetch("/api/onboarding/suggest", {
        method: "POST",
        body: JSON.stringify({ role, prompt: aiPrompt.trim() }),
      });
      const data = await parseJson<{
        suggestions: {
          learner?: typeof learner;
          instructor?: typeof instructor & { courseDraftPreview?: CourseDraft };
        };
        source: "gemini" | "openai" | "rules";
      }>(res);
      const sourceLabels: Record<string, string> = {
        gemini: "AI-assisted (Google Gemini)",
        openai: "AI-assisted (OpenAI)",
        rules: "Smart defaults (no API key)",
      };
      setAiSource(sourceLabels[data.source] ?? data.source);
      if (data.suggestions.learner) {
        const sl = data.suggestions.learner as typeof learner & { domainNiches?: Record<string, string[]>; foodNiches?: string[] };
        const { domainNiches: slDn, foodNiches: slFood, interests: slInt, ...slRest } = sl;
        setLearner((prev) => {
          const nextInterests = slInt ?? prev.interests;
          const mergedDn = {
            ...prev.domainNiches,
            ...(slDn ?? {}),
            ...(slFood?.length ? { food_baking: slFood } : {}),
          };
          return {
            ...prev,
            ...slRest,
            interests: nextInterests,
            domainNiches: pruneDomainNicheMap(mergedDn, nextInterests),
          };
        });
      }
      if (data.suggestions.instructor) {
        const rawIns = data.suggestions.instructor as typeof instructor & {
          courseDraftPreview?: CourseDraft;
          domainNiches?: Record<string, string[]>;
          foodNiches?: string[];
        };
        const { courseDraftPreview, domainNiches: slDn, foodNiches: slFood, domains: slDom, teachingStyles: slTs, ...insRest } = rawIns;
        const keepScript = classScriptRef.current.trim().length >= 40;
        setInstructor((prev) => {
          const nextDomains = slDom ?? prev.domains;
          const mergedDn = {
            ...prev.domainNiches,
            ...(slDn ?? {}),
            ...(slFood?.length ? { food_baking: slFood } : {}),
          };
          return {
            ...prev,
            ...insRest,
            domains: nextDomains,
            teachingStyles: slTs ?? prev.teachingStyles,
            domainNiches: pruneDomainNicheMap(mergedDn, nextDomains),
          };
        });
        if (courseDraftPreview) {
          setCourseDraft(courseDraftPreview);
          if (!keepScript && courseDraftPreview.classScript) setClassScriptDraft(courseDraftPreview.classScript);
        }
      }
      toast.success(data.source === "rules" ? "Selections filled from keywords" : "Selections updated from your story");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Suggestion failed");
    } finally {
      setSuggestBusy(false);
    }
  }, [aiPrompt, role]);

  const loadInstructorPreview = useCallback(
    async (variant: number, opts?: { replaceScript: boolean }) => {
      const replaceScript = opts?.replaceScript ?? true;
      setPreviewBusy(true);
      try {
        const res = await apiFetch("/api/onboarding/instructor-preview", {
          method: "POST",
          body: JSON.stringify({
            prompt: aiPrompt.trim() || undefined,
            variant,
            instructor: {
              domains: instructor.domains.length ? instructor.domains : undefined,
              domainNiches:
                Object.keys(instructor.domainNiches).length > 0 ? instructor.domainNiches : undefined,
              experienceBand: instructor.experienceBand || undefined,
              audience: instructor.audience || undefined,
              classFormat: instructor.classFormat || undefined,
              sessionLength: instructor.sessionLength || undefined,
              teachingStyles: instructor.teachingStyles.length ? instructor.teachingStyles : undefined,
            },
          }),
        });
        const data = await parseJson<{ courseDraft: CourseDraft }>(res);
        if (replaceScript && data.courseDraft.classScript) setClassScriptDraft(data.courseDraft.classScript);
        return data.courseDraft;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not generate preview");
        return null;
      } finally {
        setPreviewBusy(false);
      }
    },
    [aiPrompt, instructor],
  );

  useEffect(() => {
    if (step < maxStep - 1) {
      if (role === "INSTRUCTOR") reviewDraftLoaded.current = false;
      if (role === "LEARNER") learnerReviewLoaded.current = false;
    }
  }, [step, role, maxStep]);

  useEffect(() => {
    if (step !== maxStep - 1 || role !== "INSTRUCTOR") return;
    if (instructor.domains.length === 0) return;
    if (reviewDraftLoaded.current) return;
    reviewDraftLoaded.current = true;
    void (async () => {
      try {
        const draft = await loadInstructorPreview(0, { replaceScript: false });
        if (draft) {
          setCourseDraft({
            ...draft,
            classScript: classScriptRef.current || draft.classScript || "",
          });
        }
      } catch {
        /* optional */
      }
    })();
  }, [step, maxStep, role, instructor.domains.length, loadInstructorPreview]);

  const loadLearnerPreview = useCallback(
    async (variant: number, opts?: { replaceJourney: boolean }) => {
      const replaceJourney = opts?.replaceJourney ?? true;
      setPreviewBusy(true);
      try {
        const res = await apiFetch("/api/onboarding/learner-preview", {
          method: "POST",
          body: JSON.stringify({
            prompt: aiPrompt.trim() || undefined,
            variant,
            learner: {
              interests: learner.interests.length ? learner.interests : undefined,
              domainNiches: Object.keys(learner.domainNiches).length > 0 ? learner.domainNiches : undefined,
              primaryGoal: learner.primaryGoal || undefined,
              weeklyHours: learner.weeklyHours || undefined,
              formatPreference: learner.formatPreference || undefined,
              level: learner.level || undefined,
            },
          }),
        });
        const data = await parseJson<{ journeySummary: string }>(res);
        if (replaceJourney && data.journeySummary) setLearnerJourneyDraft(data.journeySummary);
        return data.journeySummary;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not generate preview");
        return "";
      } finally {
        setPreviewBusy(false);
      }
    },
    [aiPrompt, learner],
  );

  useEffect(() => {
    if (step !== maxStep - 1 || role !== "LEARNER") return;
    if (!learner.interests.length || !learner.primaryGoal || !learner.weeklyHours || !learner.formatPreference || !learner.level) {
      return;
    }
    if (learnerReviewLoaded.current) return;
    learnerReviewLoaded.current = true;
    void (async () => {
      try {
        const summary = await loadLearnerPreview(0, { replaceJourney: false });
        if (summary) {
          setLearnerJourneyDraft(learnerJourneyRef.current.trim().length >= 40 ? learnerJourneyRef.current : summary);
        }
      } catch {
        /* optional */
      }
    })();
  }, [
    step,
    maxStep,
    role,
    learner.interests,
    learner.domainNiches,
    learner.primaryGoal,
    learner.weeklyHours,
    learner.formatPreference,
    learner.level,
    loadLearnerPreview,
  ]);

  const canProceedLearner = useMemo(() => {
    if (step === 0) return learnerJourneyDraft.trim().length >= 40;
    if (step === 1) {
      if (learner.interests.length < 1) return false;
      if (!catalog) return false;
      const need = domainsWithNicheOptions(learner.interests, catalog.learner.domainNicheOptions);
      for (const d of need) {
        if ((learner.domainNiches[d]?.length ?? 0) < 1) return false;
      }
      return true;
    }
    if (step === 2) return Boolean(learner.primaryGoal);
    if (step === 3) return Boolean(learner.weeklyHours && learner.formatPreference && learner.level);
    return true;
  }, [step, learner, learnerJourneyDraft, catalog]);

  const canProceedInstructor = useMemo(() => {
    if (step === 0) return classScriptDraft.trim().length >= 40;
    if (step === 1) {
      if (instructor.domains.length < 1) return false;
      if (instructor.domains.includes("food_baking") && instructor.foodNiches.length < 1) return false;
      return true;
    }
    if (step === 2) return Boolean(instructor.experienceBand && instructor.audience);
    if (step === 3) return Boolean(instructor.classFormat && instructor.sessionLength);
    if (step === 4) return instructor.teachingStyles.length >= 1;
    return true;
  }, [step, instructor, classScriptDraft, catalog]);

  const canProceed = role === "LEARNER" ? canProceedLearner : canProceedInstructor;

  const instructorHeader = useMemo(() => {
    const subtitles: Record<number, string> = {
      0: "Describe what you teach, generate a class intro you can edit, then apply it to pre-fill tags — or adjust tags on the next steps.",
      1: "Pick subject areas, then add a sub-focus for each (cooking style, yoga vs Pilates, music instrument, etc.) — same idea as category + subcategory on major learning marketplaces.",
      2: "A few quick choices about your experience and who you teach.",
      3: "How sessions run and how long they usually are.",
      4: "What learners should expect from your style (pick up to three).",
      5: "Polish your public one-liner, languages, and link (optional), then review your class draft.",
    };
    const titles: Record<number, string> = {
      0: "Set up your teaching profile",
      1: "What will you teach?",
      2: "Experience & audience",
      3: "Class format",
      4: "Teaching style",
      5: "Review",
    };
    return { title: titles[step] ?? titles[0], subtitle: subtitles[step] ?? subtitles[0] };
  }, [step]);

  const learnerHeader = useMemo(() => {
    const subtitles: Record<number, string> = {
      0: "Describe what you want to learn, generate a short learning summary you can edit, apply to pre-fill choices, then refine on the next steps.",
      1: "Subjects you want to explore — add sub-focus chips wherever they appear (food, movement, music, art, etc.).",
      2: "Outcome: hobby, career, family time, or wellbeing — one main goal.",
      3: "Weekly time, online vs in-person mix, and your starting level (industry-standard matching signals).",
      4: "Quick recap before you continue.",
    };
    const titles: Record<number, string> = {
      0: "Shape your learning journey",
      1: "Your interests",
      2: "Your goal",
      3: "How you learn",
      4: "Review",
    };
    return { title: titles[step] ?? titles[0], subtitle: subtitles[step] ?? subtitles[0] };
  }, [step]);

  const { title: pageTitle, subtitle: pageSubtitle } = role === "INSTRUCTOR" ? instructorHeader : learnerHeader;

  const finish = async () => {
    setSaveBusy(true);
    try {
      const body =
        role === "LEARNER"
          ? {
              learner: {
                ...learner,
                ...(learnerJourneyDraft.trim() ? { journeySummary: learnerJourneyDraft.trim() } : {}),
              },
            }
          : {
              instructor: {
                ...instructor,
                ...(courseDraft
                  ? {
                      courseDraft: {
                        ...courseDraft,
                        classScript: classScriptDraft.trim() || courseDraft.classScript,
                      },
                    }
                  : {}),
              },
            };
      const res = await apiFetch("/api/onboarding", { method: "PATCH", body: JSON.stringify(body) });
      await parseJson<{ user: unknown }>(res);
      await refreshUser();
      toast.success("You’re all set");
      navigate(next, { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaveBusy(false);
    }
  };

  const skip = async () => {
    setSaveBusy(true);
    try {
      const res = await apiFetch("/api/onboarding/skip", { method: "POST" });
      await parseJson(res);
      await refreshUser();
      navigate(next, { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not skip");
    } finally {
      setSaveBusy(false);
    }
  };

  if (!ready || !token || !user || user.onboardingCompletedAt) {
    return (
      <main className="container mx-auto py-24 flex justify-center">
        <Loader2 className="animate-spin text-accent" size={28} />
      </main>
    );
  }

  if (!catalog) {
    return (
      <main className="container mx-auto py-24 flex justify-center">
        <Loader2 className="animate-spin text-accent" size={28} />
      </main>
    );
  }

  return (
    <main className="section-warm min-h-[70vh] pb-24">
      <div className="container mx-auto py-12 md:py-16 max-w-3xl">
        <p className="font-body text-xs uppercase tracking-[0.2em] text-muted-foreground">Step {step + 1} of {maxStep}</p>
        <h1 className="font-heading text-3xl md:text-4xl font-light text-foreground mt-2">{pageTitle}</h1>
        <p className="font-body text-sm text-muted-foreground mt-2 max-w-2xl">{pageSubtitle}</p>

        {step === 0 && (
          <div className="mt-10 rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-accent">
              <Sparkles size={18} />
              <span className="font-heading text-sm">Describe yourself in one short paragraph</span>
            </div>
            <p className="font-body text-xs text-muted-foreground">
              {role === "LEARNER"
                ? "Example: “Weekend pottery in a small group” or “Learn guitar after work — complete beginner, online is fine.”"
                : "Example: “I’m a hobby baker who wants structured weekend classes” or “Professional photographer teaching natural light portraits.”"}
            </p>
            <textarea
              className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm min-h-[120px]"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={
                role === "LEARNER"
                  ? "What you want to learn, time you have, online vs in-person, beginner vs advanced…"
                  : "What you teach, who it’s for, online vs in-person, region or cuisine if food-related…"
              }
            />

            {role === "LEARNER" && (
              <div className="pt-4 border-t border-border/50 space-y-3">
                <div className="flex items-center gap-2 text-accent">
                  <Sparkles size={18} />
                  <span className="font-heading text-sm">Your learning summary</span>
                </div>
                <p className="font-body text-xs text-muted-foreground">
                  We turn your story into a short summary you can edit. When it feels right, use{" "}
                  <span className="text-foreground/80">Apply to my selections</span> to pre-fill interests (including cooking focus if relevant), goal, time, format, and level.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full inline-flex items-center gap-2"
                    disabled={previewBusy || !aiPrompt.trim()}
                    onClick={() => {
                      setLearnerJourneyVariant(0);
                      void loadLearnerPreview(0);
                    }}
                  >
                    {previewBusy ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                    Generate summary
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-full inline-flex items-center gap-2"
                    disabled={previewBusy || !learnerJourneyDraft.trim()}
                    onClick={() => {
                      const v = learnerJourneyVariant + 1;
                      setLearnerJourneyVariant(v);
                      void loadLearnerPreview(v);
                    }}
                  >
                    {previewBusy ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                    Regenerate wording
                  </Button>
                </div>
                <textarea
                  className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm min-h-[200px] font-body leading-relaxed"
                  value={learnerJourneyDraft}
                  onChange={(e) => setLearnerJourneyDraft(e.target.value)}
                  placeholder="Click “Generate summary” to preview text from your story…"
                  disabled={previewBusy}
                />
              </div>
            )}

            {role === "INSTRUCTOR" && (
              <div className="pt-4 border-t border-border/50 space-y-3">
                <div className="flex items-center gap-2 text-accent">
                  <Sparkles size={18} />
                  <span className="font-heading text-sm">Class intro script (for your listing or first session)</span>
                </div>
                <p className="font-body text-xs text-muted-foreground">
                  Generate a draft from your story, edit it or try another wording, then use <span className="text-foreground/80">Apply to my selections</span> when you’re happy so we can pre-fill your teaching tags.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full inline-flex items-center gap-2"
                    disabled={previewBusy || !aiPrompt.trim()}
                    onClick={() => {
                      setScriptVariant(0);
                      void loadInstructorPreview(0);
                    }}
                  >
                    {previewBusy ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                    Generate class intro
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-full inline-flex items-center gap-2"
                    disabled={previewBusy || !classScriptDraft.trim()}
                    onClick={() => {
                      const v = scriptVariant + 1;
                      setScriptVariant(v);
                      void loadInstructorPreview(v);
                    }}
                  >
                    {previewBusy ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                    Regenerate wording
                  </Button>
                </div>
                <textarea
                  className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm min-h-[200px] font-body leading-relaxed"
                  value={classScriptDraft}
                  onChange={(e) => setClassScriptDraft(e.target.value)}
                  placeholder="Click “Generate class intro” to preview a script from your story…"
                  disabled={previewBusy}
                />
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <Button
                type="button"
                variant="secondary"
                className="rounded-full"
                disabled={
                  suggestBusy ||
                  (role === "INSTRUCTOR" && classScriptDraft.trim().length < 40) ||
                  (role === "LEARNER" && learnerJourneyDraft.trim().length < 40)
                }
                onClick={() => void applySuggest()}
              >
                {suggestBusy ? <Loader2 className="animate-spin" size={16} /> : "Apply to my selections"}
              </Button>
              {aiSource ? <span className="text-xs text-muted-foreground">{aiSource}</span> : null}
              {role === "INSTRUCTOR" && classScriptDraft.trim().length < 40 ? (
                <span className="text-xs text-muted-foreground">
                  Generate a class intro first (at least a few lines), then you can apply.
                </span>
              ) : null}
              {role === "LEARNER" && learnerJourneyDraft.trim().length < 40 ? (
                <span className="text-xs text-muted-foreground">
                  Generate a learning summary first (a few sentences), then you can apply.
                </span>
              ) : null}
            </div>
          </div>
        )}

        {role === "LEARNER" && step === 1 && (
          <div className="mt-10 space-y-6">
            <div className="space-y-3">
              <h2 className="font-heading text-lg">What do you want to explore? (pick up to 6)</h2>
              <p className="font-body text-xs text-muted-foreground max-w-2xl leading-relaxed">
                Choose broad areas first. For topics like food, yoga, gym, dance, music, art, photo, sewing, or maker skills, you’ll see an extra row of
                sub-focus chips — that’s how we match you precisely (similar to filters on class marketplaces).
              </p>
              <div className="flex flex-wrap gap-2">
                {catalog.learner.interests.map((o) => (
                  <Chip
                    key={o.id}
                    label={o.label}
                    active={learner.interests.includes(o.id)}
                    onClick={() =>
                      setLearner((s) => {
                        const next = toggleInList(s.interests, o.id, 6);
                        return { ...s, interests: next, domainNiches: pruneDomainNicheMap(s.domainNiches, next) };
                      })
                    }
                  />
                ))}
              </div>
            </div>
            {domainsWithNicheOptions(learner.interests, catalog.learner.domainNicheOptions).map((domainId) => {
              const domainLabel = catalog.learner.interests.find((x) => x.id === domainId)?.label ?? domainId;
              const opts = catalog.learner.domainNicheOptions[domainId] ?? [];
              return (
                <div key={domainId} className="space-y-3 rounded-xl border border-border/50 bg-card/30 p-4">
                  <h3 className="font-heading text-sm text-foreground">{domainLabel} — narrow your focus (up to 4)</h3>
                  <p className="font-body text-xs text-muted-foreground leading-relaxed">
                    Pick what you actually want to learn under this topic. We use this for recommendations and AI summaries.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {opts.map((o) => (
                      <Chip
                        key={o.id}
                        label={o.label}
                        active={(learner.domainNiches[domainId] ?? []).includes(o.id)}
                        onClick={() =>
                          setLearner((s) => ({
                            ...s,
                            domainNiches: toggleDomainNicheEntry(s.domainNiches, domainId, o.id, 4),
                          }))
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {role === "LEARNER" && step === 2 && (
          <div className="mt-10 space-y-3">
            <h2 className="font-heading text-lg">What’s your main goal right now?</h2>
            <div className="flex flex-wrap gap-2">
              {catalog.learner.primaryGoals.map((o) => (
                <Chip
                  key={o.id}
                  label={o.label}
                  active={learner.primaryGoal === o.id}
                  onClick={() => setLearner((s) => ({ ...s, primaryGoal: o.id }))}
                />
              ))}
            </div>
          </div>
        )}

        {role === "LEARNER" && step === 3 && (
          <div className="mt-10 space-y-8">
            <div className="space-y-3">
              <h2 className="font-heading text-lg">Time you can invest weekly</h2>
              <div className="flex flex-wrap gap-2">
                {catalog.learner.weeklyHours.map((o) => (
                  <Chip
                    key={o.id}
                    label={o.label}
                    active={learner.weeklyHours === o.id}
                    onClick={() => setLearner((s) => ({ ...s, weeklyHours: o.id }))}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="font-heading text-lg">How do you like to learn?</h2>
              <div className="flex flex-wrap gap-2">
                {catalog.learner.formatPreference.map((o) => (
                  <Chip
                    key={o.id}
                    label={o.label}
                    active={learner.formatPreference === o.id}
                    onClick={() => setLearner((s) => ({ ...s, formatPreference: o.id }))}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="font-heading text-lg">Your starting level</h2>
              <div className="flex flex-wrap gap-2">
                {catalog.learner.level.map((o) => (
                  <Chip
                    key={o.id}
                    label={o.label}
                    active={learner.level === o.id}
                    onClick={() => setLearner((s) => ({ ...s, level: o.id }))}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {role === "LEARNER" && step === 4 && (
          <div className="mt-10 rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-6 space-y-6">
            <h2 className="font-heading text-lg">Review</h2>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-heading text-sm">Learning summary</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full"
                  disabled={previewBusy}
                  onClick={() => {
                    const v = learnerJourneyVariant + 1;
                    setLearnerJourneyVariant(v);
                    void loadLearnerPreview(v, { replaceJourney: true });
                  }}
                >
                  {previewBusy ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                  <span className="ml-1.5">Regenerate from selections</span>
                </Button>
              </div>
              <textarea
                className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm min-h-[160px] font-body leading-relaxed"
                value={learnerJourneyDraft}
                onChange={(e) => setLearnerJourneyDraft(e.target.value)}
                disabled={previewBusy}
              />
            </div>
            <ul className="font-body text-sm text-muted-foreground space-y-1 list-disc pl-5">
              <li>
                Interests:{" "}
                {learner.interests
                  .map((id) => catalog.learner.interests.find((x) => x.id === id)?.label)
                  .filter(Boolean)
                  .join(", ")}
              </li>
              {domainsWithNicheOptions(learner.interests, catalog.learner.domainNicheOptions).map((domainId) => {
                const tags = learner.domainNiches[domainId];
                if (!tags?.length) return null;
                const domainLabel = catalog.learner.interests.find((x) => x.id === domainId)?.label ?? domainId;
                const opts = catalog.learner.domainNicheOptions[domainId] ?? [];
                return (
                  <li key={domainId}>
                    {domainLabel} — focus:{" "}
                    {tags
                      .map((id) => opts.find((x) => x.id === id)?.label)
                      .filter(Boolean)
                      .join(", ")}
                  </li>
                );
              })}
              <li>Goal: {catalog.learner.primaryGoals.find((x) => x.id === learner.primaryGoal)?.label}</li>
              <li>Weekly time: {catalog.learner.weeklyHours.find((x) => x.id === learner.weeklyHours)?.label}</li>
              <li>Format: {catalog.learner.formatPreference.find((x) => x.id === learner.formatPreference)?.label}</li>
              <li>Level: {catalog.learner.level.find((x) => x.id === learner.level)?.label}</li>
            </ul>
          </div>
        )}

        {role === "INSTRUCTOR" && step === 1 && (
          <div className="mt-10 space-y-6">
            <div className="space-y-3">
              <h2 className="font-heading text-lg">What will you teach? (pick up to 4)</h2>
              <p className="font-body text-xs text-muted-foreground max-w-2xl leading-relaxed">
                Main teaching buckets first. Where you see sub-focus chips (food, movement, music, art, photo, sewing, maker…), add at least one — it
                powers discovery, your class draft, and learner matching the same way subcategories work on large platforms.
              </p>
              <div className="flex flex-wrap gap-2">
                {catalog.instructor.domains.map((o) => (
                  <Chip
                    key={o.id}
                    label={o.label}
                    active={instructor.domains.includes(o.id)}
                    onClick={() =>
                      setInstructor((s) => {
                        const next = toggleInList(s.domains, o.id, 4);
                        return { ...s, domains: next, domainNiches: pruneDomainNicheMap(s.domainNiches, next) };
                      })
                    }
                  />
                ))}
              </div>
            </div>
            {domainsWithNicheOptions(instructor.domains, catalog.instructor.domainNicheOptions).map((domainId) => {
              const domainLabel = catalog.instructor.domains.find((x) => x.id === domainId)?.label ?? domainId;
              const opts = catalog.instructor.domainNicheOptions[domainId] ?? [];
              return (
                <div key={domainId} className="space-y-3 rounded-xl border border-border/50 bg-card/30 p-4">
                  <h3 className="font-heading text-sm text-foreground">{domainLabel} — your specialty (up to 4)</h3>
                  <p className="font-body text-xs text-muted-foreground leading-relaxed">
                    Be specific: learners and search use these tags alongside your class intro.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {opts.map((o) => (
                      <Chip
                        key={o.id}
                        label={o.label}
                        active={(instructor.domainNiches[domainId] ?? []).includes(o.id)}
                        onClick={() =>
                          setInstructor((s) => ({
                            ...s,
                            domainNiches: toggleDomainNicheEntry(s.domainNiches, domainId, o.id, 4),
                          }))
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {role === "INSTRUCTOR" && step === 2 && (
          <div className="mt-10 space-y-8">
            <div className="space-y-3">
              <h2 className="font-heading text-lg">Teaching experience</h2>
              <div className="flex flex-wrap gap-2">
                {catalog.instructor.experienceBand.map((o) => (
                  <Chip
                    key={o.id}
                    label={o.label}
                    active={instructor.experienceBand === o.id}
                    onClick={() => setInstructor((s) => ({ ...s, experienceBand: o.id }))}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="font-heading text-lg">Who is your ideal student?</h2>
              <div className="flex flex-wrap gap-2">
                {catalog.instructor.audience.map((o) => (
                  <Chip
                    key={o.id}
                    label={o.label}
                    active={instructor.audience === o.id}
                    onClick={() => setInstructor((s) => ({ ...s, audience: o.id }))}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {role === "INSTRUCTOR" && step === 3 && (
          <div className="mt-10 space-y-8">
            <div className="space-y-3">
              <h2 className="font-heading text-lg">Class format</h2>
              <div className="flex flex-wrap gap-2">
                {catalog.instructor.classFormat.map((o) => (
                  <Chip
                    key={o.id}
                    label={o.label}
                    active={instructor.classFormat === o.id}
                    onClick={() => setInstructor((s) => ({ ...s, classFormat: o.id }))}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="font-heading text-lg">Typical session length</h2>
              <div className="flex flex-wrap gap-2">
                {catalog.instructor.sessionLength.map((o) => (
                  <Chip
                    key={o.id}
                    label={o.label}
                    active={instructor.sessionLength === o.id}
                    onClick={() => setInstructor((s) => ({ ...s, sessionLength: o.id }))}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {role === "INSTRUCTOR" && step === 4 && (
          <div className="mt-10 space-y-3">
            <h2 className="font-heading text-lg">Teaching style (pick up to 3)</h2>
            <div className="flex flex-wrap gap-2">
              {catalog.instructor.teachingStyles.map((o) => (
                <Chip
                  key={o.id}
                  label={o.label}
                  active={instructor.teachingStyles.includes(o.id)}
                  onClick={() =>
                    setInstructor((s) => ({
                      ...s,
                      teachingStyles: toggleInList(s.teachingStyles, o.id, 3),
                    }))
                  }
                />
              ))}
            </div>
          </div>
        )}

        {role === "INSTRUCTOR" && step === maxStep - 1 && (
          <div className="mt-10 rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-6 space-y-6">
            <h2 className="font-heading text-lg">Your first class draft</h2>
            <p className="font-body text-xs text-muted-foreground">
              We’ll save this to your profile and pre-fill Instructor Studio. Edit anything later.
            </p>
            <ul className="font-body text-sm text-muted-foreground space-y-1 list-disc pl-5">
              <li>
                Teaching areas:{" "}
                {instructor.domains
                  .map((id) => catalog.instructor.domains.find((x) => x.id === id)?.label)
                  .filter(Boolean)
                  .join(", ")}
              </li>
              {domainsWithNicheOptions(instructor.domains, catalog.instructor.domainNicheOptions).map((domainId) => {
                const tags = instructor.domainNiches[domainId];
                if (!tags?.length) return null;
                const domainLabel = catalog.instructor.domains.find((x) => x.id === domainId)?.label ?? domainId;
                const opts = catalog.instructor.domainNicheOptions[domainId] ?? [];
                return (
                  <li key={domainId}>
                    {domainLabel} — focus:{" "}
                    {tags
                      .map((id) => opts.find((x) => x.id === id)?.label)
                      .filter(Boolean)
                      .join(", ")}
                  </li>
                );
              })}
            </ul>

            <div className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-4">
              <p className="font-heading text-sm text-foreground">Public profile (optional)</p>
              <p className="font-body text-xs text-muted-foreground">
                Short lines that show next to your name — like Teachable, Udemy, or a Link-in-bio. You can change these anytime in Studio.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-body text-muted-foreground" htmlFor="onb-headline">
                  One-line headline
                </label>
                <Input
                  id="onb-headline"
                  className="rounded-xl"
                  placeholder="e.g. Yoga for desk workers · 200-hour certified"
                  maxLength={140}
                  value={instructor.publicHeadline}
                  onChange={(e) => setInstructor((s) => ({ ...s, publicHeadline: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-body text-muted-foreground">Languages you teach in (up to 5)</p>
                <div className="flex flex-wrap gap-2">
                  {catalog.instructor.teachingLanguages.map((o) => (
                    <Chip
                      key={o.id}
                      label={o.label}
                      active={instructor.teachingLanguages.includes(o.id)}
                      onClick={() =>
                        setInstructor((s) => ({
                          ...s,
                          teachingLanguages: toggleInList(s.teachingLanguages, o.id, 5),
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-body text-muted-foreground" htmlFor="onb-link">
                  Website, Instagram, or portfolio URL
                </label>
                <Input
                  id="onb-link"
                  type="url"
                  className="rounded-xl"
                  placeholder="https://"
                  value={instructor.publicLink}
                  onChange={(e) => setInstructor((s) => ({ ...s, publicLink: e.target.value }))}
                />
              </div>
            </div>

            {courseDraft ? (
              <div className="space-y-4">
                <div className="space-y-2 font-body text-sm">
                  <p>
                    <span className="text-muted-foreground">Title</span> — {courseDraft.title}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Category</span> — {courseDraft.category} · {courseDraft.format}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Duration</span> — {courseDraft.durationLabel}
                  </p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{courseDraft.description.slice(0, 280)}…</p>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-heading text-sm">Class intro script</span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="rounded-full"
                      disabled={previewBusy}
                      onClick={() => {
                        const v = scriptVariant + 1;
                        setScriptVariant(v);
                        void (async () => {
                          const draft = await loadInstructorPreview(v, { replaceScript: true });
                          if (draft?.classScript) setClassScriptDraft(draft.classScript);
                        })();
                      }}
                    >
                      {previewBusy ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                      <span className="ml-1.5">Regenerate from selections</span>
                    </Button>
                  </div>
                  <textarea
                    className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm min-h-[180px] font-body leading-relaxed"
                    value={classScriptDraft}
                    onChange={(e) => setClassScriptDraft(e.target.value)}
                    disabled={previewBusy}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Generating preview… open Studio to refine details.</p>
            )}
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-3">
          {step > 0 ? (
            <Button type="button" variant="outline" className="rounded-full" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          ) : null}
          {step < maxStep - 1 ? (
            <Button type="button" className="rounded-full" disabled={!canProceed} onClick={() => setStep((s) => s + 1)}>
              Continue
            </Button>
          ) : (
            <Button type="button" className="rounded-full" disabled={saveBusy} onClick={() => void finish()}>
              {saveBusy ? <Loader2 className="animate-spin" size={16} /> : "Finish & continue"}
            </Button>
          )}
          <button
            type="button"
            className="text-xs text-muted-foreground underline ml-auto"
            disabled={saveBusy}
            onClick={() => void skip()}
          >
            Skip for now
          </button>
        </div>
      </div>
    </main>
  );
};

export default OnboardingPage;
