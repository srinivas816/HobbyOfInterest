import { Link } from "react-router-dom";
import { ChefHat, GraduationCap, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { mvpInstructorFocus } from "@/lib/productFocus";

/**
 * Persistent entry points after login so instructors/learners always see “what’s next”
 * (especially if they left onboarding or landed on the marketing home page).
 */
const PostAuthBanner = () => {
  const { user } = useAuth();
  const mvp = mvpInstructorFocus();
  if (!user) return null;

  if (user.role === "INSTRUCTOR") {
    return (
      <div className="border-b border-border/50 bg-gradient-to-r from-accent/12 via-background to-primary/10">
        <div className="container mx-auto py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-accent/20 p-2 text-accent">
              <ChefHat size={20} />
            </div>
            <div>
              <p className="font-heading text-sm text-foreground">
                {mvp ? "Run your hobby class from one place" : "Need to create another class or session?"}
              </p>
              <p className="font-body text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
                {mvp ? (
                  <>
                    <span className="text-foreground/90">Create a class</span>, then copy the invite link or tap{" "}
                    <span className="text-foreground/90">WhatsApp</span> in Studio → Teaching tools → Roster. Students join at{" "}
                    <span className="text-foreground/90">/join/your-code</span> — that’s your growth loop.
                  </>
                ) : (
                  <>
                    After onboarding, <span className="text-foreground/90">Studio</span> is always where you add classes, lessons, and publish — or
                    use <span className="text-foreground/90">Create a class</span> in the top bar on any page.
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              to={mvp ? "/instructor/studio?setup=1#studio-teaching-tools" : "/instructor/studio"}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Sparkles size={16} />
              {mvp ? "Invite students" : "Open Studio — create a class"}
            </Link>
            {!mvp ? (
              <Link
                to="/courses"
                className="inline-flex items-center justify-center rounded-full border border-border/70 px-4 py-2.5 text-sm text-foreground hover:bg-muted/40 transition-colors"
              >
                Browse classes
              </Link>
            ) : (
              <Link
                to="/instructor/studio?setup=1#studio-create-class"
                className="inline-flex items-center justify-center rounded-full border border-border/70 px-4 py-2.5 text-sm text-foreground hover:bg-muted/40 transition-colors"
              >
                New class
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border/50 bg-muted/30">
      <div className="container mx-auto py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-body">
          <GraduationCap size={18} className="text-accent shrink-0" />
          <span>
            Signed in — {mvp ? "open " : "explore classes or continue "}
            {!user.onboardingCompletedAt ? (
              <Link to={`/onboarding?next=${encodeURIComponent("/learn")}`} className="text-accent underline-offset-2 hover:underline">
                your learning profile
              </Link>
            ) : (
              <Link to="/learn" className="text-accent underline-offset-2 hover:underline">
                {mvp ? "My classes" : "My learning"}
              </Link>
            )}
            .
          </span>
        </div>
        {!mvp ? (
          <Link
            to="/courses"
            className="text-sm font-medium text-foreground rounded-full border border-border/70 px-4 py-2 hover:bg-background transition-colors self-start sm:self-auto"
          >
            Find a class
          </Link>
        ) : null}
      </div>
    </div>
  );
};

export default PostAuthBanner;
