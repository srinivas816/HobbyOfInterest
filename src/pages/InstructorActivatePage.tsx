import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, parseJson } from "@/lib/api";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "skillshare:instructor-activate-draft";

type Venue = "MY_PLACE" | "STUDENT_PLACE" | "ONLINE";
type ScheduleKey = "WEEKDAYS" | "WEEKENDS" | "MORNING" | "EVENING";

const PRESETS = [
  { id: "badminton" as const, title: "Badminton", category: "Fitness" },
  { id: "dance" as const, title: "Dance", category: "Dance" },
  { id: "music" as const, title: "Music", category: "Music" },
];

const VENUE_OPTIONS: { key: Venue; label: string }[] = [
  { key: "MY_PLACE", label: "At my place" },
  { key: "STUDENT_PLACE", label: "Student’s place" },
  { key: "ONLINE", label: "Online" },
];

const SCHEDULE_OPTIONS: { key: ScheduleKey; label: string }[] = [
  { key: "WEEKDAYS", label: "Weekdays" },
  { key: "WEEKENDS", label: "Weekends" },
  { key: "MORNING", label: "Morning" },
  { key: "EVENING", label: "Evening" },
];

type Draft = {
  step: number;
  presetId: (typeof PRESETS)[number]["id"] | "custom" | null;
  customTitle: string;
  category: string;
  venues: Venue[];
  schedule: ScheduleKey[];
  priceDigits: string;
};

const defaultDraft = (): Draft => ({
  step: 0,
  presetId: null,
  customTitle: "",
  category: "Teaching",
  venues: [],
  schedule: [],
  priceDigits: "2500",
});

function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return defaultDraft();
    const p = JSON.parse(raw) as Partial<Draft>;
    const base = defaultDraft();
    return {
      step: typeof p.step === "number" && p.step >= 0 && p.step < 5 ? p.step : 0,
      presetId: p.presetId ?? null,
      customTitle: typeof p.customTitle === "string" ? p.customTitle : "",
      category: typeof p.category === "string" ? p.category : base.category,
      venues: Array.isArray(p.venues) ? p.venues.filter((v): v is Venue => VENUE_OPTIONS.some((o) => o.key === v)) : [],
      schedule: Array.isArray(p.schedule)
        ? p.schedule.filter((s): s is ScheduleKey => SCHEDULE_OPTIONS.some((o) => o.key === s))
        : [],
      priceDigits: typeof p.priceDigits === "string" ? p.priceDigits : base.priceDigits,
    };
  } catch {
    return defaultDraft();
  }
}

function formatInrPaise(digits: string): number {
  const n = Number(digits.replace(/\D/g, "")) || 0;
  return Math.min(n, 9_999_999) * 100;
}

function formatRupeesDisplay(digits: string): string {
  const n = Number(digits.replace(/\D/g, "")) || 0;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

/**
 * Guided first class setup → POST activation → students (invite).
 */
const InstructorActivatePage = () => {
  const { user, token, ready } = useAuth();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft>(() => (typeof window !== "undefined" ? loadDraft() : defaultDraft()));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [draft]);

  const resolvedTitle = useMemo(() => {
    if (draft.presetId && draft.presetId !== "custom") {
      const pr = PRESETS.find((x) => x.id === draft.presetId);
      return pr?.title.trim() ?? "";
    }
    return draft.customTitle.trim();
  }, [draft.presetId, draft.customTitle]);

  const resolvedCategory = useMemo(() => {
    if (draft.presetId && draft.presetId !== "custom") {
      return PRESETS.find((x) => x.id === draft.presetId)?.category ?? "Teaching";
    }
    return draft.category.trim().length >= 2 ? draft.category.trim() : "Teaching";
  }, [draft.presetId, draft.category]);

  const scheduleSummary = useMemo(
    () =>
      [...draft.schedule]
        .sort()
        .map((k) => SCHEDULE_OPTIONS.find((o) => o.key === k)?.label ?? k)
        .join(" · "),
    [draft.schedule],
  );

  const venueSummary = useMemo(
    () => draft.venues.map((k) => VENUE_OPTIONS.find((o) => o.key === k)?.label ?? k).join(" · "),
    [draft.venues],
  );

  const canAdvance = useCallback(
    (fromStep: number): boolean => {
      if (fromStep === 0) {
        if (!draft.presetId) return false;
        if (draft.presetId === "custom") return draft.customTitle.trim().length >= 3;
        return true;
      }
      if (fromStep === 1) return draft.venues.length >= 1;
      if (fromStep === 2) return draft.schedule.length >= 1;
      if (fromStep === 3) return true;
      return true;
    },
    [draft.presetId, draft.customTitle, draft.venues.length, draft.schedule.length],
  );

  const goNext = () => {
    if (!canAdvance(draft.step)) {
      if (draft.step === 0) toast.error("Pick what you teach (or add your own)");
      else if (draft.step === 1) toast.error("Pick at least one place");
      else if (draft.step === 2) toast.error("Pick at least one time option");
      return;
    }
    setDraft((d) => ({ ...d, step: Math.min(d.step + 1, 4) }));
  };

  const goBack = () => setDraft((d) => ({ ...d, step: Math.max(d.step - 1, 0) }));

  const toggleVenue = (v: Venue) => {
    setDraft((d) => ({
      ...d,
      venues: d.venues.includes(v) ? d.venues.filter((x) => x !== v) : [...d.venues, v],
    }));
  };

  const toggleSchedule = (s: ScheduleKey) => {
    setDraft((d) => ({
      ...d,
      schedule: d.schedule.includes(s) ? d.schedule.filter((x) => x !== s) : [...d.schedule, s],
    }));
  };

  const createClass = async () => {
    const t = resolvedTitle;
    if (t.length < 3) {
      toast.error("Add a class name");
      return;
    }
    if (draft.venues.length < 1 || draft.schedule.length < 1) {
      toast.error("Complete where and when");
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch("/api/instructor-studio/courses/activation", {
        method: "POST",
        body: JSON.stringify({
          title: t,
          category: resolvedCategory,
          venues: draft.venues,
          schedule: draft.schedule,
          pricePaise: formatInrPaise(draft.priceDigits),
          city: null,
        }),
      });
      const data = await parseJson<{ course: { slug: string } }>(res);
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      navigate(`/instructor/class/${encodeURIComponent(data.course.slug)}/students`, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create class");
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return (
      <main className="container mx-auto py-24 flex justify-center">
        <Loader2 className="animate-spin text-accent" size={28} />
      </main>
    );
  }
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== "INSTRUCTOR") {
    return <Navigate to="/learn" replace />;
  }

  const step = draft.step;
  const progressLabel = `Step ${step + 1} of 5`;

  return (
    <main className="container mx-auto max-w-lg px-4 pt-8 pb-16 md:pt-12 md:pb-24">
      <div className="flex items-center gap-2 mb-6">
        {step > 0 ? (
          <Button type="button" variant="ghost" size="icon" className="shrink-0 rounded-full" onClick={goBack} aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : (
          <span className="w-10" aria-hidden />
        )}
        <p className="text-xs font-medium text-muted-foreground font-body tracking-wide uppercase flex-1 text-center pr-10">
          {progressLabel}
        </p>
      </div>

      {step === 0 && (
        <div className="space-y-8">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl text-foreground leading-tight">Start your first class</h1>
            <p className="font-body text-base text-muted-foreground mt-3">What do you teach?</p>
          </div>
          <div className="flex flex-col gap-3">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, presetId: p.id, category: p.category }))}
                className={cn(
                  "w-full rounded-2xl border-2 py-4 px-5 text-left font-heading text-lg transition-colors min-h-[3.5rem]",
                  draft.presetId === p.id ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-muted/30",
                )}
              >
                {p.title}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setDraft((d) => ({ ...d, presetId: "custom", category: "Teaching" }))}
              className={cn(
                "w-full rounded-2xl border-2 border-dashed py-4 px-5 text-left font-heading text-lg transition-colors min-h-[3.5rem]",
                draft.presetId === "custom" ? "border-accent text-accent bg-accent/5" : "border-border text-muted-foreground hover:border-accent/40",
              )}
            >
              + Add your own
            </button>
            {draft.presetId === "custom" ? (
              <div className="pt-1">
                <Input
                  value={draft.customTitle}
                  onChange={(e) => setDraft((d) => ({ ...d, customTitle: e.target.value }))}
                  placeholder="e.g. Yoga for kids"
                  className="h-12 rounded-xl text-base"
                  autoFocus
                />
              </div>
            ) : null}
          </div>
          <Button type="button" className="w-full rounded-full h-12 text-base" onClick={goNext}>
            Continue
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-8">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl text-foreground leading-tight">Where do you teach?</h1>
            <p className="font-body text-sm text-muted-foreground mt-2">Pick all that apply.</p>
          </div>
          <div className="flex flex-col gap-3">
            {VENUE_OPTIONS.map(({ key, label }) => {
              const on = draft.venues.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleVenue(key)}
                  className={cn(
                    "w-full rounded-2xl border-2 py-4 px-5 text-left font-heading text-lg transition-colors min-h-[3.5rem]",
                    on ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-muted/30",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <Button type="button" className="w-full rounded-full h-12 text-base" onClick={goNext}>
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl text-foreground leading-tight">When do you teach?</h1>
            <p className="font-body text-sm text-muted-foreground mt-2">Pick all that apply — exact times come later.</p>
          </div>
          <div className="flex flex-col gap-3">
            {SCHEDULE_OPTIONS.map(({ key, label }) => {
              const on = draft.schedule.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSchedule(key)}
                  className={cn(
                    "w-full rounded-2xl border-2 py-4 px-5 text-left font-heading text-lg transition-colors min-h-[3.5rem]",
                    on ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-muted/30",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <Button type="button" className="w-full rounded-full h-12 text-base" onClick={goNext}>
            Continue
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl text-foreground leading-tight">Monthly fee</h1>
            <p className="font-body text-sm text-muted-foreground mt-2">What do you charge per student per month? (0 for free)</p>
          </div>
          <div>
            <label className="sr-only" htmlFor="act-price">
              Amount in rupees
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-body text-lg">₹</span>
              <Input
                id="act-price"
                inputMode="numeric"
                value={draft.priceDigits}
                onChange={(e) => setDraft((d) => ({ ...d, priceDigits: e.target.value.replace(/\D/g, "").slice(0, 7) }))}
                className="h-14 pl-10 rounded-2xl text-lg font-semibold"
                placeholder="2500"
              />
            </div>
            <p className="text-xs text-muted-foreground font-body mt-2">Suggested: ₹2,500 — edit anytime in Manage content (More menu).</p>
          </div>
          <Button type="button" className="w-full rounded-full h-12 text-base" onClick={goNext}>
            Continue
          </Button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-8">
          <div className="text-center space-y-2 pt-2">
            <p className="text-4xl" aria-hidden>
              🎉
            </p>
            <h1 className="font-heading text-2xl md:text-3xl text-foreground leading-tight">Your class is ready</h1>
            <p className="font-body text-sm text-muted-foreground leading-relaxed px-2">
              {resolvedTitle}
              {scheduleSummary ? ` · ${scheduleSummary}` : ""}
              {venueSummary ? ` · ${venueSummary}` : ""}
              {" · "}
              {formatRupeesDisplay(draft.priceDigits)}
            </p>
          </div>
          <Button type="button" className="w-full rounded-full h-14 text-base font-semibold" disabled={busy} onClick={() => void createClass()}>
            {busy ? <Loader2 className="animate-spin" size={22} /> : "Create class"}
          </Button>
        </div>
      )}
    </main>
  );
};

export default InstructorActivatePage;
