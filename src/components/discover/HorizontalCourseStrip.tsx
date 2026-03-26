import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import DiscoverCourseCard from "./DiscoverCourseCard";
import type { DiscoverCourseCardBadges } from "./DiscoverCourseCard";
import type { CourseListItem } from "@/types/course";
import { Skeleton } from "@/components/ui/skeleton";

export type StripEmptyState = {
  title: string;
  description?: string;
  primaryCta: { label: string; to: string };
  secondaryCta?: { label: string; to: string };
};

type Props = {
  title: string;
  subtitle?: string;
  courses: CourseListItem[];
  isLoading: boolean;
  isError: boolean;
  seeAllTo: string;
  onRetry?: () => void;
  getBadges?: (course: CourseListItem, index: number) => DiscoverCourseCardBadges | undefined;
  /** When the row has no courses (after load), show supply-side / learner guidance instead of an empty scroller */
  emptyState?: StripEmptyState;
};

const HorizontalCourseStrip = ({
  title,
  subtitle,
  courses,
  isLoading,
  isError,
  seeAllTo,
  onRetry,
  getBadges,
  emptyState,
}: Props) => {
  const showEmpty = !isLoading && !isError && courses.length === 0 && emptyState;

  return (
    <section className="mt-8 md:mt-10 min-w-0">
      <div className="container mx-auto px-4 sm:px-6 flex items-end justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="font-heading text-lg sm:text-xl md:text-2xl font-light text-foreground">{title}</h2>
          {subtitle ? <p className="font-body text-xs text-muted-foreground mt-0.5">{subtitle}</p> : null}
        </div>
        <Link
          to={seeAllTo}
          className="shrink-0 inline-flex items-center gap-0.5 text-sm font-medium text-accent hover:underline"
        >
          See all
          <ChevronRight size={16} aria-hidden />
        </Link>
      </div>

      {isError ? (
        <p className="container mx-auto px-4 sm:px-6 font-body text-sm text-muted-foreground">
          Couldn’t load classes.{" "}
          {onRetry ? (
            <button type="button" className="text-accent underline" onClick={onRetry}>
              Retry
            </button>
          ) : null}
        </p>
      ) : null}

      {showEmpty ? (
        <div className="container mx-auto px-4 sm:px-6 pb-2">
          <div className="rounded-2xl border border-dashed border-accent/30 bg-accent/5 px-5 py-8 sm:px-8 sm:py-10 text-center max-w-xl mx-auto">
            <p className="font-heading text-lg sm:text-xl text-foreground">{emptyState.title}</p>
            {emptyState.description ? (
              <p className="font-body text-sm text-muted-foreground mt-2 leading-relaxed">{emptyState.description}</p>
            ) : null}
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <Link
                to={emptyState.primaryCta.to}
                className="inline-flex justify-center rounded-full bg-foreground px-6 py-3 font-body text-sm font-medium text-background hover:opacity-90 transition-opacity"
              >
                {emptyState.primaryCta.label}
              </Link>
              {emptyState.secondaryCta ? (
                <Link
                  to={emptyState.secondaryCta.to}
                  className="inline-flex justify-center rounded-full border border-border/70 px-6 py-3 font-body text-sm font-medium hover:bg-muted/40 transition-colors"
                >
                  {emptyState.secondaryCta.label}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 pt-1 px-4 sm:px-6 scroll-pl-4 sm:scroll-pl-6 overscroll-x-contain touch-pan-x snap-x snap-mandatory [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="shrink-0 snap-start w-[min(78vw,260px)] sm:w-[280px] rounded-2xl border border-border/40 overflow-hidden"
                >
                  <Skeleton className="aspect-[4/3] w-full rounded-none" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))
            : courses.map((course, index) => (
                <DiscoverCourseCard
                  key={course.id}
                  course={course}
                  badges={getBadges?.(course, index)}
                />
              ))}

          {!isLoading && !isError && courses.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground py-6 pl-2">No classes to show yet.</p>
          ) : null}
        </div>
      )}
    </section>
  );
};

export default HorizontalCourseStrip;
