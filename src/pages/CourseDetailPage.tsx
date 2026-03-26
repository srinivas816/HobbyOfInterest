import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Heart, Loader2, MapPin, Monitor, Star, User } from "lucide-react";
import { toast } from "sonner";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import DataStateCard from "@/components/DataStateCard";
import { courseCoverSrc } from "@/lib/courseImages";
import { apiFetch, parseJson } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { CourseDetail } from "@/types/course";
import { mvpInstructorFocus } from "@/lib/productFocus";

const CourseDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, ready, token } = useAuth();
  const queryClient = useQueryClient();
  const mvp = mvpInstructorFocus();
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const { data: course, isLoading, isError, refetch } = useQuery({
    queryKey: ["course", slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const res = await apiFetch(`/api/courses/${slug}`);
      const data = await parseJson<{ course: CourseDetail }>(res);
      return data.course;
    },
  });

  const enroll = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/enrollments", {
        method: "POST",
        body: JSON.stringify({ courseSlug: slug }),
      });
      await parseJson<{ ok: boolean }>(res);
    },
    onSuccess: () => {
      toast.success("You’re enrolled! View your classes in My learning.");
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["course", slug] });
    },
    onError: (e: Error) => {
      if (e.message.includes("Authentication")) {
        toast.message("Sign in to enroll", { description: "Use the demo learner account from the login page." });
        navigate(`/login?next=/courses/${slug}`);
        return;
      }
      toast.error(e.message || "Could not enroll");
    },
  });

  const favMutation = useMutation({
    mutationFn: async (nextFavorite: boolean) => {
      if (nextFavorite) {
        const res = await apiFetch("/api/favorites", {
          method: "POST",
          body: JSON.stringify({ courseSlug: slug }),
        });
        await parseJson<{ ok: boolean }>(res);
        return;
      }
      const res = await apiFetch(`/api/favorites/${slug}`, { method: "DELETE" });
      await parseJson<{ ok: boolean }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", slug] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not update wishlist"),
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/courses/${slug}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      });
      await parseJson<{ ok: boolean }>(res);
    },
    onSuccess: () => {
      setReviewComment("");
      queryClient.invalidateQueries({ queryKey: ["course", slug] });
      toast.success("Review saved");
    },
    onError: (e: Error) => toast.error(e.message || "Could not save review"),
  });

  const reportReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const res = await apiFetch(`/api/courses/${slug}/reviews/${reviewId}/report`, {
        method: "PATCH",
      });
      await parseJson<{ ok: boolean }>(res);
    },
    onSuccess: () => {
      toast.success("Review reported");
    },
    onError: (e: Error) => toast.error(e.message || "Could not report review"),
  });

  const orderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/checkout/create-order", {
        method: "POST",
        body: JSON.stringify({ courseSlug: slug }),
      });
      return parseJson<{ order: { orderId: string; amountPaise: number; currency: string } }>(res);
    },
    onSuccess: (data) => {
      toast.message("Checkout scaffold created", {
        description: `Order ${data.order.orderId} · ${data.order.currency} ${(data.order.amountPaise / 100).toFixed(0)}`,
      });
    },
    onError: (e: Error) => toast.error(e.message || "Could not initialize checkout"),
  });

  if (!slug) return null;

  if (isLoading) {
    return (
      <main className="container mx-auto py-24 flex justify-center">
        <Loader2 className="animate-spin text-accent" size={32} />
      </main>
    );
  }

  if (isError || !course) {
    return (
      <main className="container mx-auto py-24">
        <DataStateCard
          title="Couldn’t load class data"
          description="This can happen if the API is restarting or unreachable. Please retry."
          ctaLabel="Back to catalog"
          ctaTo="/courses"
          className="max-w-xl mx-auto"
        />
        <div className="text-center mt-4">
          <button type="button" onClick={() => refetch()} className="text-sm text-accent underline">
            Retry loading
          </button>
        </div>
      </main>
    );
  }

  const bullets = course.outcomes?.split("\n").filter(Boolean) ?? [];
  const online = course.format === "ONLINE";
  const img = courseCoverSrc(course.imageKey, course.coverImageUrl);
  const totalLessons = course.sections.reduce((acc, s) => acc + s.lessons.length, 0);
  const firstLessonId = course.sections[0]?.lessons[0]?.id;

  const handleEnroll = () => {
    if (!ready) return;
    if (course.isEnrolled) return;
    if (!token) {
      navigate(`/login?next=/courses/${slug}`);
      return;
    }
    enroll.mutate();
  };

  const scrollToEnroll = () => {
    document.getElementById("enroll-cta")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <main className="bg-background pb-24">
      <div className="border-b border-border/40 bg-muted/20">
        <div className="container mx-auto py-6">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} /> All classes
          </Link>
        </div>
      </div>

      <div className="container mx-auto py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 lg:gap-14">
          <div>
            <ScrollReveal>
              <div className="aspect-video max-h-[420px] rounded-2xl overflow-hidden border border-border/50 shadow-lg">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
              <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-light text-foreground mt-8 leading-tight">{course.title}</h1>
              <p className="font-body text-muted-foreground mt-4 max-w-3xl leading-relaxed">{course.description}</p>

              <div className="flex flex-wrap gap-3 mt-6">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-body text-xs">
                  {online ? <Monitor size={14} /> : <MapPin size={14} />}
                  {course.locationLabel}
                  {course.city ? ` · ${course.city}` : ""}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-body text-xs">
                  {course.durationLabel}
                </span>
                {!mvp ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-body text-xs">
                    <Star size={14} className="text-accent fill-accent" /> {course.rating} · {course.studentCount.toLocaleString("en-IN")}{" "}
                    learners
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-body text-xs">
                    {course.studentCount.toLocaleString("en-IN")} learners
                  </span>
                )}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <section className="mt-14">
                <h2 className="font-heading text-2xl text-foreground">What you’ll learn</h2>
                {bullets.length > 0 ? (
                  <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {bullets.map((line) => (
                      <li key={line} className="flex gap-3 font-body text-sm text-foreground/90">
                        <Check size={18} className="text-accent flex-shrink-0 mt-0.5" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 font-body text-sm text-muted-foreground">Detailed outcomes will be listed here for this class.</p>
                )}
              </section>
            </ScrollReveal>

            <ScrollReveal delay={0.15}>
              <section className="mt-14 rounded-2xl border border-border/60 p-6 md:p-8 bg-card/40">
                <h2 className="font-heading text-xl text-foreground">This class includes</h2>
                <ul className="mt-4 space-y-2 font-body text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <Check size={16} className="text-accent mt-0.5 flex-shrink-0" /> Full access for the scheduled batch or cohort
                  </li>
                  <li className="flex gap-2">
                    <Check size={16} className="text-accent mt-0.5 flex-shrink-0" /> Instructor Q&amp;A and peer cohort (where applicable)
                  </li>
                  <li className="flex gap-2">
                    <Check size={16} className="text-accent mt-0.5 flex-shrink-0" /> Certificate of completion (roadmap — not issued in demo)
                  </li>
                </ul>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <section className="mt-14">
                <h2 className="font-heading text-xl text-foreground mb-4">Instructor</h2>
                <Link
                  to={`/instructors/${course.instructor.id}`}
                  className="flex items-start gap-4 rounded-2xl border border-border/60 p-5 hover:border-accent/40 transition-colors group"
                >
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User size={24} className="text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                  <div>
                    <p className="font-heading text-lg text-foreground group-hover:text-primary transition-colors">{course.instructor.name}</p>
                    <p className="font-body text-sm text-muted-foreground mt-1">{course.instructor.specialty || "Instructor"}</p>
                  </div>
                </Link>
              </section>
            </ScrollReveal>
          </div>

          <aside className="lg:sticky lg:top-28 h-fit">
            <div id="enroll-cta" className="rounded-2xl border border-border shadow-xl p-6 md:p-8 bg-card scroll-mt-28">
              <p className="font-heading text-4xl font-light text-foreground">{course.priceDisplay}</p>
              <p className="font-body text-xs text-muted-foreground mt-1">Planned price (INR, GST-inclusive display)</p>
              <p className="font-body text-xs text-muted-foreground mt-3 leading-relaxed rounded-lg bg-muted/40 border border-border/50 px-3 py-2">
                <span className="text-foreground font-medium">Joining is free in this build.</span> Enrollment does not charge your card — we
                show the future list price for transparency. Card checkout is a separate demo button below.
              </p>
              {course.isEnrolled ? (
                <>
                  <Button className="w-full mt-6 rounded-full h-12 text-base font-medium" size="lg" asChild>
                    <Link to={`/learn/${slug}/classroom`}>Open classroom</Link>
                  </Button>
                  <Button variant="outline" className="w-full mt-3 rounded-full h-11" size="lg" asChild>
                    <Link to="/learn">{mvp ? "My classes" : "Go to My learning"}</Link>
                  </Button>
                  {!mvp && firstLessonId ? (
                    <Button variant="outline" className="w-full mt-3 rounded-full h-11" asChild>
                      <Link to={`/learn/${slug}/lesson/${firstLessonId}`}>Open first lesson</Link>
                    </Button>
                  ) : null}
                  <p className="font-body text-xs text-center text-accent mt-3">
                    {mvp ? "You’re in — check Classroom for announcements and discussion." : "You’re enrolled — all lessons are unlocked."}
                  </p>
                </>
              ) : (
                <Button
                  className="w-full mt-6 rounded-full h-12 text-base font-medium"
                  size="lg"
                  onClick={handleEnroll}
                  disabled={enroll.isPending}
                >
                  {enroll.isPending ? <Loader2 className="animate-spin" size={20} /> : user ? "Enroll free" : "Log in to enroll"}
                </Button>
              )}
              {!user && (
                <p className="font-body text-xs text-center text-muted-foreground mt-3">
                  Demo: <span className="text-foreground">learner@demo.com</span> / demo12345
                </p>
              )}
              {!mvp ? (
                <>
                  <Button
                    variant="outline"
                    className="w-full mt-3 rounded-full h-11"
                    onClick={() => {
                      if (!token) {
                        navigate(`/login?next=/courses/${slug}`);
                        return;
                      }
                      favMutation.mutate(!course.isFavorite);
                    }}
                    disabled={favMutation.isPending}
                  >
                    <Heart size={16} className={course.isFavorite ? "fill-accent text-accent" : ""} />{" "}
                    {course.isFavorite ? "Saved to wishlist" : "Save to wishlist"}
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full mt-3 rounded-full h-11"
                    onClick={() => {
                      if (!token) {
                        navigate(`/login?next=/courses/${slug}`);
                        return;
                      }
                      orderMutation.mutate();
                    }}
                    disabled={orderMutation.isPending}
                  >
                    Razorpay checkout (scaffold)
                  </Button>
                </>
              ) : null}
              <p className="font-body text-xs text-muted-foreground mt-6 leading-relaxed">
                30-day satisfaction support on eligible first sessions. Refunds per policy shown at checkout (demo — no payment yet).
              </p>
            </div>
          </aside>
        </div>

        {mvp ? (
          <details className="mt-14 rounded-2xl border border-border/60 bg-card/30 group">
            <summary className="cursor-pointer list-none px-5 py-4 font-heading text-xl text-foreground [&::-webkit-details-marker]:hidden flex items-center justify-between gap-2">
              <span>Curriculum (optional)</span>
              <span className="text-xs font-body text-muted-foreground font-normal">
                {course.sections.length} sections · {totalLessons} lessons
              </span>
            </summary>
            <div className="px-5 pb-5 border-t border-border/40 pt-4 space-y-4">
              {course.sections.map((section) => (
                <div key={section.id} className="rounded-2xl border border-border/60 p-5 bg-card/40">
                  <h3 className="font-heading text-lg">{section.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {section.lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 text-sm font-body text-muted-foreground"
                      >
                        <span className="min-w-0 break-words sm:truncate">
                          {lesson.title} {lesson.preview ? <span className="text-accent">(Preview)</span> : null}
                        </span>
                        <span className="shrink-0 sm:text-right">
                          {lesson.preview ? (
                            <Link to={`/learn/${slug}/lesson/${lesson.id}`} className="text-accent hover:underline">
                              Watch preview · {lesson.durationMin}m
                            </Link>
                          ) : !token ? (
                            <Link to={`/login?next=/courses/${slug}`} className="text-accent hover:underline">
                              Log in to watch
                            </Link>
                          ) : !course.isEnrolled ? (
                            <button type="button" onClick={scrollToEnroll} className="text-accent hover:underline font-body text-sm">
                              Enroll to watch · {lesson.durationMin}m
                            </button>
                          ) : (
                            <Link to={`/learn/${slug}/lesson/${lesson.id}`} className="text-accent hover:underline">
                              Watch · {lesson.durationMin}m
                            </Link>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        ) : (
          <section className="mt-14">
            <h2 className="font-heading text-2xl text-foreground">Curriculum</h2>
            <p className="font-body text-sm text-muted-foreground mt-2">
              {course.sections.length} sections · {totalLessons} lessons
            </p>
            <div className="mt-6 space-y-4">
              {course.sections.map((section) => (
                <div key={section.id} className="rounded-2xl border border-border/60 p-5 bg-card/40">
                  <h3 className="font-heading text-lg">{section.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {section.lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 text-sm font-body text-muted-foreground"
                      >
                        <span className="min-w-0 break-words sm:truncate">
                          {lesson.title} {lesson.preview ? <span className="text-accent">(Preview)</span> : null}
                        </span>
                        <span className="shrink-0 sm:text-right">
                          {lesson.preview ? (
                            <Link to={`/learn/${slug}/lesson/${lesson.id}`} className="text-accent hover:underline">
                              Watch preview · {lesson.durationMin}m
                            </Link>
                          ) : !token ? (
                            <Link to={`/login?next=/courses/${slug}`} className="text-accent hover:underline">
                              Log in to watch
                            </Link>
                          ) : !course.isEnrolled ? (
                            <button type="button" onClick={scrollToEnroll} className="text-accent hover:underline font-body text-sm">
                              Enroll to watch · {lesson.durationMin}m
                            </button>
                          ) : (
                            <Link to={`/learn/${slug}/lesson/${lesson.id}`} className="text-accent hover:underline">
                              Watch · {lesson.durationMin}m
                            </Link>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {!mvp ? (
        <section className="mt-14">
          <h2 className="font-heading text-2xl text-foreground">Ratings & reviews</h2>
          <p className="font-body text-sm text-muted-foreground mt-2">
            {course.rating.toFixed(1)} average · {course.reviews.length} review{course.reviews.length === 1 ? "" : "s"}
          </p>

          {token && (
            <div className="mt-6 rounded-2xl border border-border/60 p-5 bg-card/40">
              <p className="font-heading text-lg">Write a review</p>
              <div className="mt-3 flex gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReviewRating(r)}
                    className={`px-3 py-1.5 rounded-full border text-xs ${reviewRating === r ? "bg-foreground text-background" : ""}`}
                  >
                    {r}★
                  </button>
                ))}
              </div>
              <textarea
                className="w-full mt-3 rounded-xl border border-border/60 bg-background p-3 text-sm"
                rows={3}
                placeholder="Share your learning experience..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
              <Button className="mt-3" onClick={() => reviewMutation.mutate()} disabled={reviewMutation.isPending}>
                Submit review
              </Button>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {course.reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-border/60 p-5 bg-card/40">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <p className="font-heading text-base min-w-0 break-words">{review.user.name}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="font-body text-xs text-accent">{review.rating}★</p>
                    {token && (
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                        onClick={() => reportReviewMutation.mutate(review.id)}
                      >
                        Report
                      </button>
                    )}
                  </div>
                </div>
                {review.comment ? <p className="font-body text-sm text-muted-foreground mt-2">{review.comment}</p> : null}
              </div>
            ))}
            {course.reviews.length === 0 && (
              <DataStateCard
                title="No reviews yet"
                description="Be the first learner to share feedback for this class."
                className="p-6 text-left"
              />
            )}
          </div>
        </section>
        ) : null}
      </div>
    </main>
  );
};

export default CourseDetailPage;
