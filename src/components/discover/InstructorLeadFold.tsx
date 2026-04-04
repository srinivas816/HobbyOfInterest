import { Link } from "react-router-dom";
import { ArrowRight, ClipboardCheck, IndianRupee, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const STUDIO_NEXT = encodeURIComponent("/instructor/studio?setup=1#studio-create-class");

/**
 * First-fold instructor priority for logged-out users (business: onboarding + retention before browse).
 */
const InstructorLeadFold = () => {
  return (
    <section className="border-b border-border/40 bg-gradient-to-br from-accent/12 via-background to-primary/10">
      <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-7">
        <div className="rounded-2xl border border-accent/25 bg-card/60 backdrop-blur-sm p-5 sm:p-7 md:p-8 shadow-sm">
          <p className="font-body text-[11px] uppercase tracking-[0.2em] text-accent font-semibold">For tutors &amp; hobby teachers</p>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-light text-foreground mt-3 leading-tight">
            Manage your classes in one place<span className="text-accent">.</span>
          </h2>
          <p className="font-body text-sm sm:text-base text-muted-foreground mt-3 max-w-2xl leading-relaxed">
            Track students, attendance, and payments — then list on the catalog when you&apos;re ready. Discovery for learners starts below.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-3 font-body text-sm text-foreground/90">
            <li className="flex items-start gap-2 rounded-xl border border-border/40 bg-background/50 px-3 py-2.5">
              <Users className="text-accent shrink-0 mt-0.5" size={18} aria-hidden />
              <span>Roster &amp; invite links</span>
            </li>
            <li className="flex items-start gap-2 rounded-xl border border-border/40 bg-background/50 px-3 py-2.5">
              <ClipboardCheck className="text-accent shrink-0 mt-0.5" size={18} aria-hidden />
              <span>Attendance per session</span>
            </li>
            <li className="flex items-start gap-2 rounded-xl border border-border/40 bg-background/50 px-3 py-2.5">
              <IndianRupee className="text-accent shrink-0 mt-0.5" size={18} aria-hidden />
              <span>Fee status by month</span>
            </li>
          </ul>
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <Button className="rounded-full h-12 px-8 text-base" asChild>
              <Link to={`/login?next=${STUDIO_NEXT}`}>
                Start teaching
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Link
              to={`/login?next=${encodeURIComponent("/instructor/studio")}`}
              className="text-center sm:text-left font-body text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            >
              Already an instructor? Log in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InstructorLeadFold;
