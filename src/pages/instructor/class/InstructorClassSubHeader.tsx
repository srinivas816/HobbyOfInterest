import { memo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { classHubPath } from "./classWorkspaceUtils";

type Props = {
  slug: string;
  title: string;
  subtitle?: string;
};

export const InstructorClassSubHeader = memo(function InstructorClassSubHeader({ slug, title, subtitle }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-md px-3 pt-2 pb-3">
      <div className="flex items-center gap-2 max-w-lg mx-auto">
        <Button variant="ghost" size="icon" className="shrink-0 rounded-full transition-transform active:scale-95" asChild aria-label="Back to class">
          <Link to={classHubPath(slug)}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-lg leading-tight truncate">{title}</h1>
          {subtitle ? <p className="text-[11px] text-muted-foreground font-body truncate mt-0.5">{subtitle}</p> : null}
        </div>
      </div>
    </header>
  );
});
