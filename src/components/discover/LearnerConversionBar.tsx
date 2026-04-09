import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const JOIN_NEXT = encodeURIComponent("/learn");

/** Logged-out end-of-feed: single primary action + optional invite path. */
const LearnerConversionBar = () => {
  return (
    <section className="mt-10 md:mt-12 border-t border-border/40 pt-8 pb-2">
      <div className="container mx-auto px-4 sm:px-6 text-center max-w-lg mx-auto">
        <Button className="rounded-full h-12 px-10" asChild>
          <Link to="/courses">Explore classes</Link>
        </Button>
        <p className="mt-4 font-body text-sm text-muted-foreground">
          <Link to={`/login?next=${JOIN_NEXT}`} className="underline underline-offset-2 hover:text-foreground transition-colors">
            Have a class invite? Join
          </Link>
        </p>
      </div>
    </section>
  );
};

export default LearnerConversionBar;
