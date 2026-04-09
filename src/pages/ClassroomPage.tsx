import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";
import { BookOpen, Loader2, Megaphone, MessageCircle, PenLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch, parseJson } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { mvpInstructorFocus } from "@/lib/productFocus";

const ClassroomPage = () => {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const { token, ready } = useAuth();
  const queryClient = useQueryClient();
  const mvp = mvpInstructorFocus();
  const [tab, setTab] = useState<"announcements" | "discussion" | "assignments">("announcements");
  const [joinWelcome, setJoinWelcome] = useState<{ title: string } | null>(null);
  const [questionBody, setQuestionBody] = useState("");
  const [submitByAssignment, setSubmitByAssignment] = useState<Record<string, string>>({});
  const [answerDraft, setAnswerDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (ready && !token) return;
  }, [ready, token]);

  const base = courseSlug ? `/api/course-engagement/${encodeURIComponent(courseSlug)}` : "";

  const announcementsQuery = useQuery({
    queryKey: ["classroom-announcements", courseSlug],
    enabled: Boolean(token && courseSlug),
    queryFn: async () => {
      const res = await apiFetch(`${base}/announcements`);
      return parseJson<{
        announcements: Array<{
          id: string;
          title: string | null;
          body: string;
          emailed: boolean;
          createdAt: string;
          author: { id: string; name: string };
        }>;
      }>(res);
    },
  });

  const questionsQuery = useQuery({
    queryKey: ["classroom-questions", courseSlug],
    enabled: Boolean(token && courseSlug),
    queryFn: async () => {
      const res = await apiFetch(`${base}/questions`);
      return parseJson<{
        questions: Array<{
          id: string;
          body: string;
          createdAt: string;
          author: { id: string; name: string };
          answer: string | null;
          answeredAt: string | null;
          answeredBy: { id: string; name: string } | null;
        }>;
        isInstructor: boolean;
      }>(res);
    },
  });

  useEffect(() => {
    if (mvp && tab === "assignments") setTab("announcements");
  }, [mvp, tab]);

  useEffect(() => {
    if (!courseSlug) return;
    try {
      const k = `classroomWelcome:${courseSlug}`;
      const raw = sessionStorage.getItem(k);
      if (raw) {
        sessionStorage.removeItem(k);
        setJoinWelcome(JSON.parse(raw) as { title: string });
      }
    } catch {
      setJoinWelcome(null);
    }
  }, [courseSlug]);

  const assignmentsQuery = useQuery({
    queryKey: ["classroom-assignments", courseSlug],
    enabled: Boolean(token && courseSlug && !mvp),
    queryFn: async () => {
      const res = await apiFetch(`${base}/assignments`);
      return parseJson<{
        assignments: Array<{
          id: string;
          title: string;
          description: string;
          dueAt: string | null;
          mySubmission: { content: string; updatedAt: string } | null;
        }>;
        isInstructor: boolean;
      }>(res);
    },
  });

  const trackingQuery = useQuery({
    queryKey: ["enrolled-tracking", courseSlug],
    enabled: Boolean(token && courseSlug),
    retry: false,
    queryFn: async () => {
      const res = await apiFetch(`/api/me/enrolled/${encodeURIComponent(courseSlug!)}/tracking`);
      return parseJson<{
        attendancePercent: number;
        sessionsTracked: number;
        sessionsAttended: number;
        feeThisMonth: { yearMonth: string; status: string };
      }>(res);
    },
  });

  const askMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`${base}/questions`, {
        method: "POST",
        body: JSON.stringify({ body: questionBody }),
      });
      await parseJson<{ question: { id: string } }>(res);
    },
    onSuccess: () => {
      setQuestionBody("");
      queryClient.invalidateQueries({ queryKey: ["classroom-questions", courseSlug] });
      toast.success("Question posted");
    },
    onError: (e: Error) => toast.error(e.message || "Could not post"),
  });

  const answerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: string }) => {
      const res = await apiFetch(`${base}/questions/${encodeURIComponent(questionId)}`, {
        method: "PATCH",
        body: JSON.stringify({ answer }),
      });
      await parseJson<{ question: { id: string } }>(res);
    },
    onSuccess: (_data, { questionId }) => {
      queryClient.invalidateQueries({ queryKey: ["classroom-questions", courseSlug] });
      if (courseSlug) {
        queryClient.invalidateQueries({ queryKey: ["studio-tool-questions", courseSlug] });
      }
      setAnswerDraft((m) => {
        const next = { ...m };
        delete next[questionId];
        return next;
      });
      toast.success("Reply saved");
    },
    onError: (e: Error) => toast.error(e.message || "Could not save reply"),
  });

  const submitMutation = useMutation({
    mutationFn: async ({ assignmentId, content }: { assignmentId: string; content: string }) => {
      const res = await apiFetch(`${base}/assignments/${encodeURIComponent(assignmentId)}/submit`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      await parseJson<{ submission: { content: string } }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classroom-assignments", courseSlug] });
      toast.success("Submission saved");
    },
    onError: (e: Error) => toast.error(e.message || "Could not submit"),
  });

  if (!courseSlug) return null;
  if (!ready) {
    return (
      <main className="container mx-auto py-24 flex justify-center">
        <Loader2 className="animate-spin text-accent" size={28} />
      </main>
    );
  }
  if (!token) return <Navigate to={`/login?next=/learn/${courseSlug}/classroom`} replace />;

  const loadErr =
    announcementsQuery.isError || questionsQuery.isError || (!mvp && assignmentsQuery.isError)
      ? "You need to be enrolled in this class (or be its instructor) to open the classroom."
      : null;

  return (
    <main className="container mx-auto py-12 md:py-16 pb-24 max-w-3xl">
      <Link
        to="/learn"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-body"
      >
        <BookOpen size={16} /> {mvp ? "My classes" : "My learning"}
      </Link>
      <h1 className="font-heading text-3xl mt-6 text-foreground">Class classroom</h1>
      <p className="text-sm text-muted-foreground mt-2 font-body">
        Announcements, discussion{mvp ? "" : ", and assignments"} for{" "}
        <Link to={`/courses/${courseSlug}`} className="text-accent underline">
          this class
        </Link>
        .
      </p>

      {joinWelcome ? (
        <div className="mt-6 rounded-2xl border-2 border-accent/45 bg-gradient-to-br from-accent/12 to-card/60 p-5 md:p-6 space-y-3">
          <p className="font-heading text-lg md:text-xl text-foreground">
            You joined <span className="text-accent">{joinWelcome.title}</span> 🎉
          </p>
          <p className="text-sm text-muted-foreground font-body">Next:</p>
          <ul className="text-sm font-body text-foreground space-y-2 list-disc pl-5">
            <li>
              <Link to={`/learn/${courseSlug}`} className="text-accent font-medium hover:underline">
                View today&apos;s class &amp; lessons
              </Link>
            </li>
            <li>
              <button type="button" className="text-left text-accent font-medium hover:underline" onClick={() => setTab("announcements")}>
                Check updates &amp; announcements
              </button>
            </li>
          </ul>
        </div>
      ) : null}

      {trackingQuery.isSuccess && trackingQuery.data.sessionsTracked > 0 ? (
        <div className="mt-6 rounded-xl border border-border/50 bg-card/40 px-4 py-3 text-sm font-body text-muted-foreground">
          <span className="text-foreground font-medium">{trackingQuery.data.attendancePercent}%</span> attendance across{" "}
          {trackingQuery.data.sessionsTracked} session
          {trackingQuery.data.sessionsTracked === 1 ? "" : "s"} · Fee {trackingQuery.data.feeThisMonth.yearMonth}:{" "}
          <span className="text-foreground">
            {trackingQuery.data.feeThisMonth.status === "PAID" ? "Paid" : "Pending"}
          </span>
        </div>
      ) : trackingQuery.isSuccess && trackingQuery.data.sessionsTracked === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border/50 px-4 py-3 text-xs text-muted-foreground font-body">
          When your tutor records sessions, your attendance summary will appear here.
        </div>
      ) : null}

      {loadErr &&
      (announcementsQuery.isFetched || questionsQuery.isFetched || (!mvp && assignmentsQuery.isFetched)) ? (
        <div className="mt-10 rounded-2xl border border-border/60 bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground font-body">{loadErr}</p>
          <Button className="mt-6 rounded-full" asChild>
            <Link to={`/courses/${courseSlug}`}>View class page</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap gap-2 border-b border-border/50 pb-3">
            {(
              [
                ["announcements", "Announcements", Megaphone],
                ["discussion", "Discussion", MessageCircle],
                ...(!mvp ? ([["assignments", "Assignments", PenLine]] as const) : []),
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-body transition-colors ${
                  tab === id ? "bg-foreground text-background" : "bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          <div className="mt-8">
            {tab === "announcements" && (
              <div className="space-y-6">
                {announcementsQuery.isLoading && <Loader2 className="animate-spin text-accent" />}
                {announcementsQuery.data?.announcements.map((a) => (
                  <article key={a.id} className="rounded-2xl border border-border/60 p-5 bg-card/40">
                    {a.title ? <h2 className="font-heading text-lg text-foreground">{a.title}</h2> : null}
                    <p className="text-xs text-muted-foreground mt-1 font-body">
                      {a.author.name} · {new Date(a.createdAt).toLocaleString()}
                      {a.emailed ? " · Emailed to learners" : ""}
                    </p>
                    <p className="mt-3 text-sm text-foreground font-body whitespace-pre-wrap">{a.body}</p>
                  </article>
                ))}
                {announcementsQuery.data?.announcements.length === 0 && (
                  <p className="text-sm text-muted-foreground font-body">No announcements yet.</p>
                )}
              </div>
            )}

            {tab === "discussion" && (
              <div className="space-y-6">
                {questionsQuery.data?.isInstructor && (
                  <p className="text-sm text-muted-foreground font-body rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
                    You’re viewing as the instructor — reply to questions below. Learners post from this same tab.
                  </p>
                )}
                {!questionsQuery.data?.isInstructor && (
                  <div className="rounded-2xl border border-border/60 p-4 bg-card/30">
                    <p className="text-sm font-medium text-foreground">Ask the instructor</p>
                    <textarea
                      className="w-full mt-2 rounded-xl border border-border/60 bg-background p-3 text-sm min-h-[100px]"
                      placeholder="Be specific — at least 10 characters."
                      value={questionBody}
                      onChange={(e) => setQuestionBody(e.target.value)}
                    />
                    <Button
                      type="button"
                      className="mt-3 rounded-full"
                      disabled={askMutation.isPending || questionBody.trim().length < 10}
                      onClick={() => askMutation.mutate()}
                    >
                      Post question
                    </Button>
                  </div>
                )}
                {questionsQuery.isLoading && <Loader2 className="animate-spin text-accent" />}
                {questionsQuery.data?.questions.map((q) => (
                  <div key={q.id} className="rounded-2xl border border-border/60 p-5 bg-card/40">
                    <p className="text-xs text-muted-foreground font-body">
                      {q.author.name} · {new Date(q.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-2 text-sm text-foreground font-body whitespace-pre-wrap">{q.body}</p>
                    {q.answer ? (
                      <div className="mt-4 rounded-xl bg-accent/10 border border-accent/20 p-4">
                        <p className="text-xs font-medium text-accent">Instructor reply</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {q.answeredBy?.name} · {q.answeredAt ? new Date(q.answeredAt).toLocaleString() : ""}
                        </p>
                        <p className="mt-2 text-sm font-body whitespace-pre-wrap">{q.answer}</p>
                      </div>
                    ) : questionsQuery.data?.isInstructor ? (
                      <div className="mt-4 space-y-2">
                        <textarea
                          className="w-full rounded-xl border border-border/60 bg-background p-3 text-sm min-h-[80px]"
                          placeholder="Write your reply…"
                          value={answerDraft[q.id] ?? ""}
                          onChange={(e) => setAnswerDraft((m) => ({ ...m, [q.id]: e.target.value }))}
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-full"
                          disabled={answerMutation.isPending || (answerDraft[q.id] ?? "").trim().length < 3}
                          onClick={() =>
                            answerMutation.mutate({ questionId: q.id, answer: (answerDraft[q.id] ?? "").trim() })
                          }
                        >
                          Post reply
                        </Button>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-muted-foreground font-body">Awaiting instructor reply.</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!mvp && tab === "assignments" && (
              <div className="space-y-8">
                {assignmentsQuery.isLoading && <Loader2 className="animate-spin text-accent" />}
                {assignmentsQuery.data?.assignments.map((a) => (
                  <div key={a.id} className="rounded-2xl border border-border/60 p-5 bg-card/40">
                    <h2 className="font-heading text-lg text-foreground">{a.title}</h2>
                    {a.dueAt ? (
                      <p className="text-xs text-muted-foreground mt-1">Due {new Date(a.dueAt).toLocaleString()}</p>
                    ) : null}
                    <p className="mt-3 text-sm text-muted-foreground font-body whitespace-pre-wrap">{a.description}</p>
                    {!assignmentsQuery.data.isInstructor && (
                      <div className="mt-4">
                        <label className="text-xs text-muted-foreground font-body">Your submission</label>
                        <textarea
                          className="w-full mt-1 rounded-xl border border-border/60 bg-background p-3 text-sm min-h-[120px]"
                          placeholder="Write your response (20+ characters)."
                          value={submitByAssignment[a.id] ?? a.mySubmission?.content ?? ""}
                          onChange={(e) => setSubmitByAssignment((m) => ({ ...m, [a.id]: e.target.value }))}
                        />
                        {a.mySubmission ? (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Last saved {new Date(a.mySubmission.updatedAt).toLocaleString()}
                          </p>
                        ) : null}
                        <Button
                          type="button"
                          className="mt-3 rounded-full"
                          disabled={submitMutation.isPending || (submitByAssignment[a.id] ?? a.mySubmission?.content ?? "").trim().length < 20}
                          onClick={() =>
                            submitMutation.mutate({
                              assignmentId: a.id,
                              content: (submitByAssignment[a.id] ?? a.mySubmission?.content ?? "").trim(),
                            })
                          }
                        >
                          Save submission
                        </Button>
                      </div>
                    )}
                    {assignmentsQuery.data.isInstructor && (
                      <p className="mt-3 text-xs text-muted-foreground font-body">
                        Learners submit from this page. Open{" "}
                        <Link to="/instructor/studio?tool=assign#studio-teaching-tools" className="text-accent underline">
                          Manage content → Assignments
                        </Link>{" "}
                        to read submissions.
                      </p>
                    )}
                  </div>
                ))}
                {assignmentsQuery.data?.assignments.length === 0 && (
                  <p className="text-sm text-muted-foreground font-body">No assignments posted yet.</p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
};

export default ClassroomPage;
