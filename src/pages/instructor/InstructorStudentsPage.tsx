import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Cross-class student directory — placeholder until a dedicated API exists.
 */
const InstructorStudentsPage = () => {
  return (
    <div className="container mx-auto max-w-lg px-4 pt-6 pb-4">
      <div className="rounded-2xl border border-border/60 bg-card/60 p-8 text-center space-y-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 mx-auto">
          <Users className="h-7 w-7 text-accent" aria-hidden />
        </div>
        <h1 className="font-heading text-xl text-foreground">All students</h1>
        <p className="text-sm text-muted-foreground font-body leading-relaxed">
          A single list across every class is on the roadmap. For now, open a class from <span className="text-foreground font-medium">Classes</span>{" "}
          to see its roster, fees, and attendance.
        </p>
        <Button className="rounded-full h-12 w-full text-base" asChild>
          <Link to="/instructor/classes">Go to classes</Link>
        </Button>
      </div>
    </div>
  );
};

export default InstructorStudentsPage;
