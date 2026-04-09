import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Loader2, Link2, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, parseJson } from "@/lib/api";

const TARGET_INVITES = 3;

/**
 * First success moment after activation: push invites before deeper setup.
 */
const InstructorClassReadyPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, token, ready } = useAuth();

  const coursesQuery = useQuery({
    queryKey: ["studio-courses"],
    enabled: Boolean(token && user?.role === "INSTRUCTOR"),
    queryFn: async () => {
      const res = await apiFetch("/api/instructor-studio/courses");
      return parseJson<{ courses: Array<{ slug: string; title: string }> }>(res);
    },
  });

  const course = slug ? coursesQuery.data?.courses.find((c) => c.slug === slug) : undefined;

  const inviteQuery = useQuery({
    queryKey: ["studio-invite", slug],
    enabled: Boolean(token && user?.role === "INSTRUCTOR" && slug && course),
    queryFn: async () => {
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(slug!)}/invite`);
      return parseJson<{ inviteCode: string }>(res);
    },
  });

  if (!ready) {
    return (
      <main className="container mx-auto py-24 flex justify-center">
        <Loader2 className="animate-spin text-accent" size={28} />
      </main>
    );
  }
  if (!token || !user || user.role !== "INSTRUCTOR") {
    return <Navigate to="/login?next=/instructor/home" replace />;
  }
  if (!slug) {
    return <Navigate to="/instructor/home" replace />;
  }

  if (coursesQuery.isSuccess && !course) {
    return <Navigate to="/instructor/home" replace />;
  }

  const inviteUrl =
    typeof window !== "undefined" && inviteQuery.data
      ? `${window.location.origin}/join/${inviteQuery.data.inviteCode}`
      : "";

  const studioHref = `/instructor/class/${encodeURIComponent(slug)}`;

  return (
    <main className="container mx-auto py-12 md:py-20 max-w-lg px-4">
      <div className="rounded-2xl border-2 border-accent/40 bg-gradient-to-b from-accent/15 to-card/80 p-8 md:p-10 text-center space-y-4 shadow-sm">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/20 mx-auto">
          <Sparkles className="h-7 w-7 text-accent" aria-hidden />
        </div>
        <h1 className="font-heading text-2xl md:text-3xl text-foreground">Your class is live 🎉</h1>
        {course ? <p className="font-body text-sm text-muted-foreground">{course.title}</p> : null}

        <div className="pt-4 text-left rounded-xl border border-border/50 bg-background/60 p-5 space-y-3">
          <p className="font-heading text-sm text-foreground">Next step</p>
          <p className="font-body text-sm text-muted-foreground leading-relaxed">
            Invite at least <span className="text-foreground font-semibold">{TARGET_INVITES} students</span> to get
            momentum — start with people you already teach.
          </p>
          <p className="font-body text-xs text-muted-foreground italic">Tip: Message parents or your existing batch first.</p>
        </div>

        {inviteQuery.isLoading ? (
          <Loader2 className="animate-spin text-accent mx-auto" size={28} />
        ) : inviteQuery.data ? (
          <div className="flex flex-col gap-3 pt-2">
            <Button className="rounded-full h-12 text-base w-full bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Join my class:\n${inviteUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="inline mr-2 h-5 w-5" aria-hidden />
                Share on WhatsApp
              </a>
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="rounded-full h-12 text-base w-full"
              onClick={() => {
                void navigator.clipboard.writeText(inviteUrl);
                toast.success("Link copied");
              }}
            >
              <Link2 className="inline mr-2 h-4 w-4" aria-hidden />
              Copy link
            </Button>
          </div>
        ) : null}

        <Button type="button" variant="outline" className="rounded-full w-full mt-4" onClick={() => navigate(studioHref, { replace: true })}>
          Open class workspace
        </Button>
        <p className="text-[11px] text-muted-foreground font-body">
          You can always find this link under <span className="text-foreground">Teaching tools → Invite</span>.
        </p>
      </div>
      <p className="text-center mt-8">
        <Link to="/" className="text-sm text-accent hover:underline font-body">
          Back to home
        </Link>
      </p>
    </main>
  );
};

export default InstructorClassReadyPage;
