import InstructorLeadFold from "@/components/discover/InstructorLeadFold";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * Public entry for tutors — keeps the marketplace homepage learner-first.
 */
const TeachLandingPage = () => {
  return (
    <div className="min-w-0 bg-background">
      <div className="container mx-auto px-4 sm:px-6 pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Back to classes
        </Link>
      </div>
      <InstructorLeadFold />
    </div>
  );
};

export default TeachLandingPage;
