import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Loader2, Plus } from "lucide-react";
import { apiFetch, parseJson } from "@/lib/api";
import { Button } from "@/components/ui/button";

/**
 * Class catalog only: names + open hub. No dashboard, fees, sessions, or teaching tools here.
 * Daily actions live on `/instructor/home`; deep work on `/instructor/class/:slug`; curriculum/publishing in Manage content (`/instructor/studio`).
 */
const InstructorClassesPage = () => {
  const q = useQuery({
    queryKey: ["studio-courses"],
    queryFn: async () => {
      const res = await apiFetch("/api/instructor-studio/courses");
      return parseJson<{
        courses: Array<{ id: string; slug: string; title: string; published: boolean }>;
      }>(res);
    },
  });

  const courses = q.data?.courses ?? [];

  return (
    <div className="mx-auto max-w-lg px-4 pt-4 pb-4">
      <h1 className="font-heading text-xl text-foreground">Your classes</h1>
      <p className="text-sm text-muted-foreground font-body mt-1">Tap a class to open it.</p>

      <Button className="mt-5 rounded-xl h-11 w-full text-sm font-semibold gap-2" asChild>
        <Link to="/instructor/activate">
          <Plus className="h-5 w-5 shrink-0" aria-hidden />
          Create new class
        </Link>
      </Button>

      {q.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-accent" aria-hidden />
        </div>
      ) : courses.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground font-body">No classes yet.</p>
          <Button className="rounded-xl h-10 w-full text-sm font-semibold" asChild>
            <Link to="/instructor/activate">Create class</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-5 space-y-2">
          {courses.map((c) => (
            <li key={c.id}>
              <Link
                to={`/instructor/class/${encodeURIComponent(c.slug)}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 active:scale-[0.99] transition-transform"
              >
                <div className="min-w-0">
                  <p className="font-heading text-base text-foreground truncate">{c.title}</p>
                  {!c.published ? (
                    <p className="text-[11px] text-muted-foreground font-body mt-0.5">Draft</p>
                  ) : null}
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default InstructorClassesPage;
