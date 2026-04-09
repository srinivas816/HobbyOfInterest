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
                    <span className="text-foreground/90">Create a class</span>, invite on WhatsApp from{" "}
                    <span className="text-foreground/90">Students</span>, then mark attendance and fees from your class.
                  </>
                ) : (
                  <>
                    Daily teaching lives in <span className="text-foreground/90">Teaching home</span>. Curriculum, publishing, and analytics are
                    under <span className="text-foreground/90">More → Manage content</span> when you need them.
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              to="/instructor/home"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Sparkles size={16} />
              Teaching home
            </Link>
            {mvp ? (
              <Link
                to="/instructor/classes"
                className="inline-flex items-center justify-center rounded-full border border-border/70 px-4 py-2.5 text-sm text-foreground hover:bg-muted/40 transition-colors"
              >
                Your classes
              </Link>
            ) : null}
            {!mvp ? (
              <Link
                to="/courses"
                className="inline-flex items-center justify-center rounded-full border border-border/70 px-4 py-2.5 text-sm text-foreground hover:bg-muted/40 transition-colors"
              >
                Browse classes
              </Link>
            ) : null}
            <Link
              to="/instructor/activate"
              className="inline-flex items-center justify-center rounded-full border border-border/70 px-4 py-2.5 text-sm text-foreground hover:bg-muted/40 transition-colors"
            >
              New class
            </Link>
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
