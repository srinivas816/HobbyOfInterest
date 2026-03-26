import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, parseJson } from "@/lib/api";

const CATEGORIES = [
  "Art & Craft",
  "Music",
  "Fitness",
  "Food & Baking",
  "Photography",
  "Dance",
  "Tech & Design",
  "Wellness",
  "Kids & Family",
  "Other",
];

/**
 * First-run activation: one screen → create draft class → Studio focused on invite.
 */
const InstructorActivatePage = () => {
  const { user, token, ready } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Art & Craft");
  const [format, setFormat] = useState<"ONLINE" | "IN_PERSON">("ONLINE");
  const [city, setCity] = useState("Mumbai");
  const [whenLabel, setWhenLabel] = useState("Weekends, mornings");
  const [priceInr, setPriceInr] = useState("2499");
  const [busy, setBusy] = useState(false);

  if (!ready) {
    return (
      <main className="container mx-auto py-24 flex justify-center">
        <Loader2 className="animate-spin text-accent" size={28} />
      </main>
    );
  }
  if (!token || !user) {
    return <Navigate to="/login?mode=register&role=instructor" replace />;
  }
  if (user.role !== "INSTRUCTOR") {
    return <Navigate to="/learn" replace />;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (t.length < 3) {
      toast.error("Add a short class name (what you teach)");
      return;
    }
    const price = Number(priceInr.replace(/\D/g, "")) || 0;
    setBusy(true);
    try {
      const res = await apiFetch("/api/instructor-studio/courses/activation", {
        method: "POST",
        body: JSON.stringify({
          title: t,
          category,
          format,
          city: format === "IN_PERSON" ? city.trim() || "Mumbai" : null,
          durationLabel: whenLabel.trim() || "Flexible schedule",
          priceInr: price,
        }),
      });
      const data = await parseJson<{ course: { slug: string } }>(res);
      navigate(`/instructor/class-ready/${encodeURIComponent(data.course.slug)}`, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create class");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container mx-auto py-12 md:py-20 max-w-lg px-4">
      <h1 className="font-heading text-3xl font-light text-foreground">Create your class</h1>
      <p className="font-body text-sm text-muted-foreground mt-2">One minute — then you’ll get your invite link.</p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="act-title">What do you teach?</Label>
          <Input
            id="act-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Weekend watercolor for beginners"
            required
            minLength={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="act-cat">Category</Label>
          <select
            id="act-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Where</Label>
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 rounded-full border py-2 text-sm font-body ${format === "ONLINE" ? "border-foreground bg-foreground text-background" : "border-border"}`}
              onClick={() => setFormat("ONLINE")}
            >
              Online
            </button>
            <button
              type="button"
              className={`flex-1 rounded-full border py-2 text-sm font-body ${format === "IN_PERSON" ? "border-foreground bg-foreground text-background" : "border-border"}`}
              onClick={() => setFormat("IN_PERSON")}
            >
              In person
            </button>
          </div>
          {format === "IN_PERSON" ? (
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="mt-2" />
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="act-when">When (schedule)</Label>
          <Input id="act-when" value={whenLabel} onChange={(e) => setWhenLabel(e.target.value)} placeholder="e.g. Sat–Sun 10am" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="act-price">Fee (₹ per student / term — 0 for free)</Label>
          <Input
            id="act-price"
            inputMode="numeric"
            value={priceInr}
            onChange={(e) => setPriceInr(e.target.value)}
            placeholder="2499"
          />
        </div>
        <Button type="submit" className="w-full rounded-full h-12" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" size={18} /> : "Create & get invite link"}
        </Button>
      </form>
    </main>
  );
};

export default InstructorActivatePage;
