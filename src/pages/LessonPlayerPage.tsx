import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch, parseJson } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { CourseDetail } from "@/types/course";

type LessonResponse = {
  lesson: {
    id: string;
    title: string;
    durationMin: number;
    preview: boolean;
    videoUrl: string;
    course: { slug: string; title: string };
    section: { id: string; title: string };
  };
};

type ProgressPayload = {
  progress: {
    progressPercent: number;
    completedLessonIds: string[];
    sections: Array<{
      id: string;
      title: string;
      lessons: Array<{ id: string; title: string; durationMin: number; preview: boolean }>;
    }>;
  };
};

const LessonPlayerPage = () => {
  const { courseSlug, lessonId } = useParams<{ courseSlug: string; lessonId: string }>();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const courseQuery = useQuery({
    queryKey: ["course", courseSlug],
    enabled: Boolean(courseSlug),
    queryFn: async () => {
      const res = await apiFetch(`/api/courses/${courseSlug}`);
      const data = await parseJson<{ course: CourseDetail }>(res);
      return data.course;
    },
  });

  const lessonQuery = useQuery({
    queryKey: ["lesson", courseSlug, lessonId, Boolean(token)],
    enabled: Boolean(courseSlug && lessonId),
    retry: false,
    queryFn: async () => {
      const res = await apiFetch(`/api/courses/${courseSlug}/lessons/${lessonId}`);
      return parseJson<LessonResponse>(res);
    },
  });

  const progressQuery = useQuery({
    queryKey: ["progress", courseSlug],
    enabled: Boolean(token && courseSlug),
    queryFn: async () => {
      const res = await apiFetch(`/api/progress/${courseSlug}`);
      return parseJson<ProgressPayload>(res);
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch("/api/progress/complete", {
        method: "POST",
        body: JSON.stringify({ lessonId: id }),
      });
      await parseJson<{ ok: boolean }>(res);
    },
    onSuccess: () => {
      toast.success("Marked complete");
      queryClient.invalidateQueries({ queryKey: ["progress", courseSlug] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not update progress"),
  });

  const flatLessons = useMemo(() => {
    const c = courseQuery.data;
    if (!c) return [];
    return c.sections.flatMap((s) => s.lessons.map((l) => ({ ...l, sectionTitle: s.title })));
  }, [courseQuery.data]);

  const navIndex = useMemo(() => flatLessons.findIndex((l) => l.id === lessonId), [flatLessons, lessonId]);
  const prevLesson = navIndex > 0 ? flatLessons[navIndex - 1] : null;
  const nextLesson = navIndex >= 0 && navIndex < flatLessons.length - 1 ? flatLessons[navIndex + 1] : null;

  const completedSet = useMemo(
    () => new Set(progressQuery.data?.progress.completedLessonIds ?? []),
    [progressQuery.data?.progress.completedLessonIds],
  );
  const isDone = lessonId ? completedSet.has(lessonId) : false;

  const course = courseQuery.data;
  const enrollGate =
    lessonQuery.isError &&
    lessonQuery.error instanceof Error &&
    (lessonQuery.error.message.includes("Enroll") || lessonQuery.error.message.includes("enroll"));

  if (!courseSlug || !lessonId) return null;

  if (enrollGate) {
    return (
      <main className="container mx-auto py-16 md:py-24 max-w-lg">
        <Link to={`/courses/${courseSlug}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={15} /> Back to class page
        </Link>
        <h1 className="font-heading text-2xl mt-8 text-foreground">Enroll to watch this lesson</h1>
        <p className="font-body text-sm text-muted-foreground mt-3 leading-relaxed">
          Preview lessons are open to everyone. Full lessons are available after you enroll (free in this build — no card required).
        </p>
        <Button className="mt-8 rounded-full" asChild>
          <Link to={`/courses/${courseSlug}`}>View class &amp; enroll</Link>
        </Button>
      </main>
    );
  }

  if (lessonQuery.isLoading || !lessonQuery.data) {
    return (
      <main className="container mx-auto py-20 flex justify-center">
        <Loader2 size={30} className="animate-spin text-accent" />
      </main>
    );
  }

  const { lesson } = lessonQuery.data;
  const canTrackProgress = Boolean(token && course?.isEnrolled);

  return (
    <main className="bg-background pb-24 min-h-[70vh] min-w-0">
      <div className="container mx-auto py-6 sm:py-8 min-w-0">
        <Link to={`/courses/${courseSlug}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={15} /> Back to class
        </Link>

        <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,280px)_1fr] lg:gap-10 xl:gap-14">
          <aside className="mb-10 lg:mb-0 lg:order-1 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2 lg:sticky lg:top-24 self-start">
            <p className="font-heading text-sm text-muted-foreground uppercase tracking-wider">Curriculum</p>
            <p className="font-heading text-lg text-foreground mt-1">{lesson.course.title}</p>
            {courseQuery.isLoading && <p className="text-xs text-muted-foreground mt-4">Loading outline…</p>}
            {course && (
              <nav className="mt-4 space-y-4 border border-border/50 rounded-2xl p-3 bg-card/30">
                {course.sections.map((section) => (
                  <div key={section.id}>
                    <p className="font-heading text-xs text-foreground/90 px-1">{section.title}</p>
                    <ul className="mt-2 space-y-0.5">
                      {section.lessons.map((l) => {
                        const active = l.id === lessonId;
                        const done = completedSet.has(l.id);
                        const locked = !l.preview && !course.isEnrolled;
                        return (
                          <li key={l.id}>
                            {locked ? (
                              <span className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground">
                                <span className="truncate">{l.title}</span>
                                <span className="shrink-0 text-[10px]">Locked</span>
                              </span>
                            ) : (
                              <Link
                                to={`/learn/${courseSlug}/lesson/${l.id}`}
                                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                                  active ? "bg-accent/15 text-foreground font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                }`}
                              >
                                {done ? <CheckCircle2 size={14} className="text-accent shrink-0" /> : <span className="w-3.5 shrink-0" />}
                                <span className="truncate">{l.title}</span>
                              </Link>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>
            )}
          </aside>

          <div className="lg:order-2 min-w-0">
            <h1 className="font-heading text-2xl md:text-3xl text-foreground">{lesson.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {lesson.section.title} · {lesson.durationMin} min
              {lesson.preview ? <span className="text-accent"> · Preview</span> : null}
            </p>
            <div className="mt-6 rounded-2xl overflow-hidden border border-border/60 bg-card">
              <video src={lesson.videoUrl} controls className="w-full h-auto max-h-[70vh] bg-black" playsInline />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {prevLesson ? (
                <Button variant="outline" size="sm" className="rounded-full gap-1" asChild>
                  <Link to={`/learn/${courseSlug}/lesson/${prevLesson.id}`}>
                    <ChevronLeft size={16} /> Previous
                  </Link>
                </Button>
              ) : null}
              {canTrackProgress ? (
                <Button
                  type="button"
                  size="sm"
                  variant={isDone ? "secondary" : "default"}
                  className="rounded-full"
                  disabled={completeMutation.isPending || isDone}
                  onClick={() => lessonId && completeMutation.mutate(lessonId)}
                >
                  {isDone ? (
                    <>
                      <CheckCircle2 size={16} className="mr-1" /> Completed
                    </>
                  ) : completeMutation.isPending ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    "Mark as complete"
                  )}
                </Button>
              ) : token && !course?.isEnrolled && !lesson.preview ? (
                <p className="text-xs text-muted-foreground font-body">Enroll on the class page to track progress.</p>
              ) : !token && !lesson.preview ? (
                <Button size="sm" className="rounded-full" asChild>
                  <Link to={`/login?next=/learn/${courseSlug}/lesson/${lessonId}`}>Log in to track progress</Link>
                </Button>
              ) : null}
              {nextLesson ? (
                <Button size="sm" className="rounded-full gap-1" asChild>
                  <Link to={`/learn/${courseSlug}/lesson/${nextLesson.id}`}>
                    Next <ChevronRight size={16} />
                  </Link>
                </Button>
              ) : null}
            </div>

            <p className="mt-6 font-body text-sm">
              <Link to="/learn" className="text-accent underline">
                My learning
              </Link>
              <span className="text-muted-foreground"> · </span>
              <Link to={`/courses/${courseSlug}`} className="text-accent underline">
                Class overview
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LessonPlayerPage;
