import { Link } from "react-router-dom";
import { BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Conversion after browse: emotion-led CTA (logged-out). */
const LearnerConversionBar = () => {
  return (
    <section className="mt-10 md:mt-12 border-t border-border/40 bg-gradient-to-b from-accent/8 via-muted/15 to-background">
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-12 text-center max-w-2xl mx-auto">
        <BookOpen className="mx-auto text-accent mb-4" size={36} strokeWidth={1.5} aria-hidden />
        <h2 className="font-heading text-2xl sm:text-3xl font-light text-foreground">Start your hobby today</h2>
        <p className="font-body text-sm text-muted-foreground mt-3 leading-relaxed">
          Find classes near you or online — pottery, music, fitness, and more. Have a tutor link? Log in and you&apos;re in.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Button className="rounded-full h-12 px-8" asChild>
            <Link to="/courses">
              <Sparkles className="mr-2 h-4 w-4" aria-hidden />
              Explore classes
            </Link>
          </Button>
          <Button variant="outline" className="rounded-full h-12 px-8" asChild>
            <Link to={`/login?next=${encodeURIComponent("/learn")}`}>Log in with invite</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LearnerConversionBar;
