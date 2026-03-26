import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, parseJson } from "@/lib/api";
import { cn } from "@/lib/utils";

type Catalog = {
  learner: {
    interests: { id: string; label: string }[];
    primaryGoals: { id: string; label: string }[];
    weeklyHours: { id: string; label: string }[];
    formatPreference: { id: string; label: string }[];
    level: { id: string; label: string }[];
  };
};

function toggle(list: string[], id: string, max: number): string[] {
  if (list.includes(id)) return list.filter((x) => x !== id);
  if (list.length >= max) return [...list.slice(1), id];
  return [...list, id];
}

const LearnerQuickOnboarding = ({ next }: { next: string }) => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/api/onboarding/catalog");
        const data = await parseJson<{ catalog: Catalog }>(res);
        setCatalog(data.catalog);
      } catch {
        toast.error("Could not load options");
      }
    })();
  }, []);

  const skip = async () => {
    setBusy(true);
    try {
      const res = await apiFetch("/api/onboarding/skip", { method: "POST" });
      await parseJson(res);
      await refreshUser();
      navigate(next, { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not skip");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!catalog) return;
    if (interests.length < 1) {
      toast.error("Pick at least one interest, or tap Skip");
      return;
    }
    const g = catalog.learner.primaryGoals[0]?.id ?? "creative_outlet";
    const wh = catalog.learner.weeklyHours[0]?.id ?? "2_5";
    const fp = catalog.learner.formatPreference[0]?.id ?? "mixed";
    const lv = catalog.learner.level[0]?.id ?? "beginner";
    setBusy(true);
    try {
      const res = await apiFetch("/api/onboarding", {
        method: "PATCH",
        body: JSON.stringify({
          learner: {
            interests,
            primaryGoal: g,
            weeklyHours: wh,
            formatPreference: fp,
            level: lv,
          },
        }),
      });
      await parseJson(res);
      await refreshUser();
      toast.success("You're in");
      navigate(next, { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  if (!catalog) {
    return (
      <main className="container mx-auto py-24 flex justify-center">
        <Loader2 className="animate-spin text-accent" size={28} />
      </main>
    );
  }

  return (
    <main className="section-warm min-h-[70vh] pb-24">
      <div className="container mx-auto py-12 md:py-16 max-w-lg px-4">
        <h1 className="font-heading text-3xl font-light text-foreground">What do you want to try?</h1>
        <p className="font-body text-sm text-muted-foreground mt-2">Pick up to three — or skip and explore on your own.</p>

        <div className="mt-8 flex flex-wrap gap-2">
          {catalog.learner.interests.slice(0, 12).map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setInterests((s) => toggle(s, o.id, 3))}
              className={cn(
                "rounded-full border px-3 py-2 text-left text-xs font-body transition-colors",
                interests.includes(o.id)
                  ? "border-accent bg-accent/15 text-foreground"
                  : "border-border/70 text-muted-foreground hover:border-accent/40",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Button type="button" className="rounded-full h-11 flex-1" disabled={busy} onClick={() => void save()}>
            {busy ? <Loader2 className="animate-spin" size={18} /> : "Continue"}
          </Button>
          <Button type="button" variant="outline" className="rounded-full h-11 flex-1" disabled={busy} onClick={() => void skip()}>
            Skip for now
          </Button>
        </div>
      </div>
    </main>
  );
};

export default LearnerQuickOnboarding;
