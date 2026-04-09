import { Link } from "react-router-dom";
import { MapPin, Monitor, Star } from "lucide-react";
import { courseCoverSrc } from "@/lib/courseImages";
import type { CourseListItem } from "@/types/course";
import { cn } from "@/lib/utils";

export type DiscoverCourseCardBadges = {
  popular?: boolean;
  beginner?: boolean;
  nearby?: boolean;
};

function outcomeOneLiner(course: CourseListItem): string {
  const o = course.outcomes?.trim();
  if (o) {
    const line = o
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find(Boolean);
    if (line) return line.length > 92 ? `${line.slice(0, 89)}…` : line;
  }
  const d = course.description?.trim() ?? "";
  if (!d) return "";
  const one = d.replace(/\s+/g, " ");
  return one.length > 92 ? `${one.slice(0, 89)}…` : one;
}

type Props = { course: CourseListItem; className?: string; badges?: DiscoverCourseCardBadges };

/**
 * Horizontal discover card — large cover, title → instructor → outcome → price/rating.
 */
const DiscoverCourseCard = ({ course, className, badges }: Props) => {
  const online = course.format === "ONLINE";
  const img = courseCoverSrc(course.imageKey, course.coverImageUrl);
  const outcome = outcomeOneLiner(course);

  return (
    <Link
      to={`/courses/${course.slug}`}
      className={cn(
        "group shrink-0 snap-start block w-[min(85vw,300px)] sm:w-[300px] text-left rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm hover:border-accent/45 hover:shadow-md transition-all touch-manipulation active:scale-[0.98]",
        className,
      )}
    >
      <div className="aspect-[5/6] sm:aspect-[4/5] relative bg-muted/30">
        <img
          src={img}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-body text-[10px] font-semibold uppercase tracking-wide shrink-0 max-w-[58%]",
              online ? "bg-accent text-accent-foreground" : "bg-background/92 text-foreground backdrop-blur-sm",
            )}
          >
            {online ? <Monitor size={11} /> : <MapPin size={11} />}
            <span className="truncate">{online ? "Online" : course.city || course.locationLabel}</span>
          </span>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {badges?.popular ? (
              <span className="rounded-full bg-amber-500/95 px-2 py-0.5 font-body text-[9px] font-bold uppercase tracking-wide text-amber-950 shadow-sm">
                Popular
              </span>
            ) : null}
            {badges?.beginner ? (
              <span className="rounded-full bg-emerald-600/95 px-2 py-0.5 font-body text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                Beginner
              </span>
            ) : null}
            {badges?.nearby ? (
              <span className="rounded-full bg-sky-600/95 px-2 py-0.5 font-body text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                Nearby
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="px-3.5 pt-3 pb-3.5 flex flex-col gap-1.5">
        <h3 className="font-heading text-[15px] sm:text-base font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors">
          {course.title}
        </h3>
        <p className="font-body text-sm text-muted-foreground line-clamp-1">{course.instructor.name}</p>
        {outcome ? (
          <p className="font-body text-xs text-muted-foreground/90 leading-relaxed line-clamp-2">{outcome}</p>
        ) : null}
        <div className="mt-auto pt-2 flex items-center justify-between gap-2 border-t border-border/50">
          <span className="font-heading text-sm font-semibold text-foreground tabular-nums">{course.priceDisplay}</span>
          <span className="flex items-center gap-1 font-body text-xs text-muted-foreground shrink-0">
            <Star size={13} className="fill-accent text-accent shrink-0" aria-hidden />
            <span className="tabular-nums font-medium text-foreground">{course.rating.toFixed(1)}</span>
            <span className="text-muted-foreground/80 hidden sm:inline">· {course.durationLabel}</span>
          </span>
        </div>
      </div>
    </Link>
  );
};

export default DiscoverCourseCard;
