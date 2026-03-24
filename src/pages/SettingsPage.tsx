import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, parseJson } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const SettingsPage = () => {
  const { user, token, ready, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  if (!ready) {
    return (
      <main className="container mx-auto py-24 flex justify-center">
        <Loader2 className="animate-spin text-accent" size={28} />
      </main>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login?next=/settings" replace />;
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("Name should be at least 2 characters.");
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch("/api/me/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: trimmed }),
      });
      await parseJson<{ user: { name: string } }>(res);
      await refreshUser();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="container mx-auto py-16 md:py-24 max-w-lg">
      <h1 className="font-heading text-3xl text-foreground">Account</h1>
      <p className="font-body text-sm text-muted-foreground mt-2">
        Update how you appear on reviews and in Studio. Email can’t be changed here yet.
      </p>

      <form onSubmit={saveProfile} className="mt-10 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={user.email} disabled className="bg-muted/40" />
          <p className="text-xs text-muted-foreground font-body">
            Email verification and change flow are not enabled in this demo build.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Display name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </div>
        <Button type="submit" disabled={saving || name.trim() === user.name}>
          {saving ? <Loader2 className="animate-spin" size={18} /> : "Save changes"}
        </Button>
      </form>

      <section className="mt-14 pt-10 border-t border-border/60">
        <h2 className="font-heading text-xl text-foreground">Password & security</h2>
        <p className="font-body text-sm text-muted-foreground mt-3 leading-relaxed">
          Password reset by email isn’t wired up yet. If you’re locked out on a self-hosted instance, an admin can reset your hash in the
          database, or create a new account for testing.
        </p>
      </section>

      <section className="mt-10">
        <Button type="button" variant="outline" className="rounded-full" onClick={() => { logout(); navigate("/"); }}>
          Log out
        </Button>
        <p className="mt-6 font-body text-sm">
          <Link to="/learn" className="text-accent underline">
            My learning
          </Link>
          {user.role === "INSTRUCTOR" ? (
            <>
              {" · "}
              <Link to="/instructor/studio" className="text-accent underline">
                Teaching studio
              </Link>
            </>
          ) : null}
        </p>
      </section>
    </main>
  );
};

export default SettingsPage;
