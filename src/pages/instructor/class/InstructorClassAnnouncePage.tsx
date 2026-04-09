import { useMemo, useState, useCallback } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, parseJson } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { InstructorClassSubHeader } from "./InstructorClassSubHeader";
import { studioCoursesQueryOptions } from "./classWorkspaceUtils";

const InstructorClassAnnouncePage = () => {
  const { slug: slugParam } = useParams<{ slug: string }>();
  const slug = slugParam?.trim() ?? "";
  const { user, token, ready } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [waPosting, setWaPosting] = useState(false);

  const coursesQ = useQuery({
    queryKey: ["studio-courses"],
    ...studioCoursesQueryOptions,
    enabled: Boolean(token && user?.role === "INSTRUCTOR"),
    queryFn: async () => {
      const res = await apiFetch("/api/instructor-studio/courses");
      return parseJson<{ courses: Array<{ slug: string; title: string }> }>(res);
    },
  });

  const courseTitle = useMemo(
    () => coursesQ.data?.courses.find((c) => c.slug === slug)?.title,
    [coursesQ.data?.courses, slug],
  );

  const postAnnouncement = useMutation({
    mutationFn: async (body: string) => {
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(slug)}/announcements`, {
        method: "POST",
        body: JSON.stringify({
          body,
          emailLearners: false,
        }),
      });
      return parseJson(res);
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["studio-announcements", slug] });
      queryClient.invalidateQueries({ queryKey: ["classroom-announcements", slug] });
      toast.success("Posted to class");
    },
    onError: (e: Error) => toast.error(e.message || "Could not post to class"),
  });

  const postAndWhatsApp = useCallback(async () => {
    const body = message.trim();
    if (body.length < 10) {
      toast.error("Write your message (10+ characters) first.");
      return;
    }
    setWaPosting(true);
    try {
      const res = await apiFetch(`/api/instructor-studio/courses/${encodeURIComponent(slug)}/announcements`, {
        method: "POST",
        body: JSON.stringify({
          body,
          emailLearners: false,
        }),
      });
      await parseJson(res);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["studio-announcements", slug] });
      queryClient.invalidateQueries({ queryKey: ["classroom-announcements", slug] });
      const waText = `${body}\n\n— Hobby of Interest`;
      window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, "_blank", "noopener,noreferrer");
      toast.success("Posted to class — opening WhatsApp");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not post to class");
    } finally {
      setWaPosting(false);
    }
  }, [message, queryClient, slug]);

  if (!ready) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden />
      </div>
    );
  }
  if (!token || user?.role !== "INSTRUCTOR") {
    return <Navigate to="/login?next=/instructor/classes" replace />;
  }
  if (!slug || (coursesQ.isSuccess && !coursesQ.data?.courses.some((c) => c.slug === slug))) {
    return <Navigate to="/instructor/classes" replace />;
  }

  const title = courseTitle ?? "Class";

  return (
    <div className="min-h-full flex flex-col pb-10">
      <InstructorClassSubHeader slug={slug} title="Message" subtitle={title} />

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3 flex-1">
        <textarea
          className="w-full rounded-xl border bg-background p-3 text-sm min-h-[96px]"
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button
          type="button"
          className="rounded-xl h-12 w-full text-sm font-semibold transition-transform active:scale-[0.98]"
          disabled={postAnnouncement.isPending || waPosting || message.trim().length < 10}
          aria-busy={postAnnouncement.isPending}
          onClick={() => postAnnouncement.mutate(message.trim())}
        >
          {postAnnouncement.isPending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="animate-spin h-5 w-5 shrink-0" aria-hidden />
              Posting…
            </span>
          ) : (
            "Post to class"
          )}
        </Button>
        <Button
          type="button"
          className="rounded-xl h-12 w-full text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-transform active:scale-[0.98]"
          disabled={postAnnouncement.isPending || waPosting || message.trim().length < 10}
          aria-busy={waPosting}
          onClick={() => void postAndWhatsApp()}
        >
          {waPosting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
              Posting…
            </span>
          ) : (
            <>
              <MessageCircle className="mr-2 h-4 w-4 inline shrink-0" aria-hidden />
              Post to class and open WhatsApp
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default InstructorClassAnnouncePage;
