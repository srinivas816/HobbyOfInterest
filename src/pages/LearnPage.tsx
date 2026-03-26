import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, CheckCircle2, Loader2, Sparkles, GraduationCap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, parseJson } from "@/lib/api";
import { courseCoverSrc } from "@/lib/courseImages";
import { mvpInstructorFocus } from "@/lib/productFocus";

type EnrollmentRow = {
  id: string;
  enrolledAt: string;
  course: {
    slug: string;
    title: string;
    imageKey: string;
    coverImageUrl?: string | null;
    durationLabel: string;
    priceDisplay: string;
    instructorName: string;
    totalLessons: number;
    completedLessons: number;
    progressPercent: number;
    nextLesson: { id: string; title: string } | null;
  };
};

type ForYouCourse = {
  slug: string;
  title: string;
  category: string;
  imageKey: string;
  coverImageUrl?: string | null;
  rating: number;
  durationLabel: string;
  priceDisplay: string;
  instructorName: string;
};

type ProgressResponse = {
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

const LearnPage = () => {
  const { token, ready, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mvp = mvpInstructorFocus();

  useEffect(() => {
    if (ready && !token) navigate(`/login?next=/learn`, { replace: true });
  }, [ready, token, navigate]);

  const [openCourseSlug, setOpenCourseSlug] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["enrollments"],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await apiFetch("/api/enrollments");
      return parseJson<{ enrollments: EnrollmentRow[] }>(res);
    },
  });

  const forYouQuery = useQuery({
    queryKey: ["for-you"],
    enabled: Boolean(token && user?.role === "LEARNER" && !mvp),
    queryFn: async () => {
      const res = await apiFetch("/api/me/for-you");
      return parseJson<{ courses: ForYouCourse[]; meta: { personalized: boolean } }>(res);
    },
  });

  const progressQuery = useQuery({
    queryKey: ["progress", openCourseSlug],
    enabled: Boolean(token && openCourseSlug),
    queryFn: async () => {
      const res = await apiFetch(`/api/progress/${openCourseSlug}`);
      return parseJson<ProgressResponse>(res);
    },
  });

  const completeLesson = useMutation({
    mutationFn: async (lessonId: string) => {
      const res = await apiFetch("/api/progress/complete", {
        method: "POST",
        body: JSON.stringify({ lessonId }),
      });
      await parseJson<{ ok: boolean }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress", openCourseSlug] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });

  if (!ready || !token) {
    return (
      <main className="container mx-auto py-24 flex justify-center">
        <Loader2 className="animate-spin text-accent" size={28} />
      </main>
    );
  }

  return (
    <main className="section-warm min-h-[60vh] pb-24">
      <div className="container mx-auto py-16 md:py-20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center">
            <BookOpen className="text-accent" size={22} />
          </div>
          <div>
            <h1 className="font-heading text-3xl md:text-4xl font-light text-foreground">{mvp ? "My classes" : "My learning"}</h1>
            <p className="font-body text-sm text-muted-foreground mt-1">
              {mvp
                ? "Classes you joined via your tutor’s invite — open Classroom for updates, Q&A, and announcements."
                : "Classes you’re enrolled in — open a class to browse the curriculum or continue the next lesson in the player."}
            </p>
          </div>
        </div>

        {user?.role === "INSTRUCTOR" && (
          <div className="mt-8 rounded-2xl border border-border/60 bg-card/50 px-4 py-3 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-foreground font-body leading-relaxed flex items-start gap-2">
              <GraduationCap className="text-accent shrink-0 mt-0.5" size={18} />
              <span>
                <span className="font-medium">Learner view.</span> This page lists classes you’ve joined as a student. To edit classes you teach,
                use{" "}
                <Link to="/instructor/studio" className="text-accent underline font-medium">
                  Teaching studio
                </Link>
                .
              </span>
            </p>
          </div>
        )}

        {user?.role === "LEARNER" && !user.onboardingCompletedAt && (
          <div className="mt-8 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-foreground font-body leading-relaxed">
              Tell us what you want to learn so we can personalize recommendations.
            </p>
            <Link
              to={`/onboarding?next=${encodeURIComponent("/learn")}`}
              className="shrink-0 text-center rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Continue onboarding
            </Link>
          </div>
        )}

        {forYouQuery.data && forYouQuery.data.courses.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-accent" size={18} />
              <h2 className="font-heading text-xl text-foreground">
                {forYouQuery.data.meta.personalized ? "Picked for you" : "Popular classes"}
              </h2>
            </div>
            <p className="font-body text-xs text-muted-foreground mb-6">
              {forYouQuery.data.meta.personalized
                ? "Based on your onboarding interests — browse and enroll from each class page."
                : "Trending in the catalog — complete onboarding for more tailored picks."}
            </p>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {forYouQuery.data.courses.map((c) => (
                <li key={c.slug}>
                  <Link to={`/courses/${c.slug}`} className="group block rounded-2xl border border-border/60 overflow-hidden bg-card/30 hover:border-accent/30 transition-colors">
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={courseCoverSrc(c.imageKey, c.coverImageUrl)}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-body text-[10px] uppercase tracking-wider text-accent">{c.category}</p>
                      <h3 className="font-heading text-base text-foreground mt-1 leading-snug">{c.title}</h3>
                      <p className="font-body text-xs text-muted-foreground mt-2">
                        {c.instructorName} · ★ {c.rating} · {c.durationLabel}
                      </p>
                      <p className="font-body text-xs text-foreground mt-2 font-medium">{c.priceDisplay}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {isLoading && (
          <div className="mt-14 flex justify-center py-12">
            <Loader2 className="animate-spin text-accent" size={28} />
          </div>
        )}

        {data && data.enrollments.length === 0 && (
          <div className="mt-14 rounded-2xl border border-border/60 bg-card/50 p-10 text-center max-w-lg">
            <p className="font-body text-muted-foreground">You haven’t enrolled in any class yet.</p>
            {mvp ? (
              <p className="font-body text-sm text-muted-foreground mt-4 max-w-md mx-auto leading-relaxed">
                Ask your tutor for their invite link (or WhatsApp message). Open it on this phone to join — no catalog browsing needed.
              </p>
            ) : null}
            <Link
              to={mvp ? "/" : "/courses"}
              className="inline-flex mt-6 font-body text-sm bg-foreground text-background px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
            >
              {mvp ? "Back home" : "Browse catalog"}
            </Link>
          </div>
        )}

        {data && data.enrollments.length > 0 && (
          <ul className="mt-12 space-y-6 max-w-3xl">
            {data.enrollments.map((e) => (
              <li key={e.id}>
                <div className="rounded-2xl border border-border/60 p-4 bg-card/40">
                  <div className="flex flex-col sm:flex-row sm:items-stretch gap-4">
                    <Link to={`/courses/${e.course.slug}`} className="flex gap-5 flex-1 min-w-0 hover:opacity-95 transition-opacity">
                      <div className="w-36 sm:w-44 aspect-video rounded-xl overflow-hidden flex-shrink-0 border border-border/40">
                        <img src={courseCoverSrc(e.course.imageKey, e.course.coverImageUrl)} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1 py-1">
                        <h2 className="font-heading text-lg text-foreground leading-snug">{e.course.title}</h2>
                        <p className="font-body text-xs text-muted-foreground mt-1">{e.course.instructorName}</p>
                        <p className="font-body text-xs text-muted-foreground mt-2">{e.course.durationLabel}</p>
                        <p className="font-body text-xs text-muted-foreground mt-2">
                          Progress: {e.course.progressPercent}% · {e.course.completedLessons}/{e.course.totalLessons} lessons
                        </p>
                        <p className="font-body text-xs text-accent mt-1">{e.course.priceDisplay}</p>
                      </div>
                    </Link>
                    <div className="flex flex-col gap-2 justify-stretch sm:justify-center shrink-0 w-full sm:w-auto sm:min-w-[10rem]">
                      <Link
                        to={`/learn/${e.course.slug}/classroom`}
                        className="inline-flex items-center justify-center rounded-full bg-foreground text-background px-4 py-2.5 text-xs font-medium hover:opacity-90 transition-opacity text-center"
                      >
                        {mvp ? "Open classroom" : "Classroom"}
                      </Link>
                      {!mvp && e.course.nextLesson ? (
                        <Link
                          to={`/learn/${e.course.slug}/lesson/${e.course.nextLesson.id}`}
                          className="inline-flex items-center justify-center rounded-full border border-border/70 bg-background px-4 py-2.5 text-xs font-medium hover:bg-muted/40 transition-colors text-center whitespace-normal sm:whitespace-nowrap break-words"
                        >
                          Continue: {e.course.nextLesson.title}
                        </Link>
                      ) : !mvp && e.course.totalLessons > 0 ? (
                        <span className="text-xs font-body text-accent whitespace-nowrap text-center">All lessons done</span>
                      ) : null}
                    </div>
                  </div>
                  {!mvp ? (
                    <button
                      type="button"
                      onClick={() => setOpenCourseSlug((prev) => (prev === e.course.slug ? null : e.course.slug))}
                      className="mt-3 text-xs font-body text-muted-foreground hover:text-foreground"
                    >
                      {openCourseSlug === e.course.slug ? "Hide lesson tracker" : "Open lesson tracker"}
                    </button>
                  ) : null}

                  {!mvp && openCourseSlug === e.course.slug && (
                    <div className="mt-4 rounded-xl border border-border/60 p-4">
                      {progressQuery.isLoading && <p className="text-xs text-muted-foreground">Loading progress...</p>}
                      {progressQuery.data && (
                        <>
                          <p className="text-xs font-body text-muted-foreground mb-3">
                            Progress: {progressQuery.data.progress.progressPercent}%
                          </p>
                          <div className="space-y-3">
                            {progressQuery.data.progress.sections.map((section) => (
                              <div key={section.id}>
                                <p className="font-heading text-sm">{section.title}</p>
                                <ul className="mt-2 space-y-2">
                                  {section.lessons.map((lesson) => {
                                    const done = progressQuery.data!.progress.completedLessonIds.includes(lesson.id);
                                    return (
                                      <li key={lesson.id} className="flex items-center justify-between text-xs">
                                        <span>{lesson.title}</span>
                                        <button
                                          type="button"
                                          onClick={() => completeLesson.mutate(lesson.id)}
                                          className={`inline-flex items-center gap-1 ${done ? "text-accent" : "text-muted-foreground"}`}
                                        >
                                          <CheckCircle2 size={14} className={done ? "fill-accent/20" : ""} />
                                          {done ? "Done" : "Mark done"}
                                        </button>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
};

export default LearnPage;
