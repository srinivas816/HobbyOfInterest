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

type Props = { course: CourseListItem; className?: string; badges?: DiscoverCourseCardBadges };

/**
 * Wide visual card for horizontal discover strips (Swiggy-style tappable row).
 */
const DiscoverCourseCard = ({ course, className, badges }: Props) => {
  const online = course.format === "ONLINE";
  const img = courseCoverSrc(course.imageKey, course.coverImageUrl);

  return (
    <Link
      to={`/courses/${course.slug}`}
      className={cn(
        "group shrink-0 snap-start block w-[min(78vw,260px)] sm:w-[280px] text-left rounded-2xl border border-border/50 bg-card/40 overflow-hidden shadow-sm hover:border-accent/40 hover:shadow-md transition-all",
        className,
      )}
    >
      <div className="aspect-[4/3] relative bg-muted/30">
        <img
          src={img}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 font-body text-[10px] font-medium uppercase tracking-wide shrink-0 max-w-[55%]",
              online ? "bg-accent text-accent-foreground" : "bg-background/90 text-foreground backdrop-blur-sm",
            )}
          >
            {online ? <Monitor size={10} /> : <MapPin size={10} />}
            <span className="truncate">{online ? "Online" : course.city || course.locationLabel}</span>
          </span>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {badges?.popular ? (
              <span className="rounded-full bg-amber-500/95 px-2 py-0.5 font-body text-[9px] font-semibold uppercase tracking-wide text-amber-950 shadow-sm">
                Popular
              </span>
            ) : null}
            {badges?.beginner ? (
              <span className="rounded-full bg-emerald-600/95 px-2 py-0.5 font-body text-[9px] font-semibold uppercase tracking-wide text-white shadow-sm">
                Beginner
              </span>
            ) : null}
            {badges?.nearby ? (
              <span className="rounded-full bg-sky-600/95 px-2 py-0.5 font-body text-[9px] font-semibold uppercase tracking-wide text-white shadow-sm">
                Nearby
              </span>
            ) : null}
          </div>
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
          <span className="rounded-full bg-background/95 px-2.5 py-1 font-heading text-xs font-semibold text-foreground backdrop-blur-sm">
            {course.priceDisplay}
          </span>
          <span className="flex items-center gap-0.5 rounded-full bg-background/90 px-2 py-1 font-body text-[11px] text-foreground backdrop-blur-sm">
            <Star size={12} className="fill-accent text-accent shrink-0" />
            {course.rating.toFixed(1)}
          </span>
        </div>
      </div>
      <div className="p-3 space-y-1">
        <h3 className="font-heading text-sm sm:text-base font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <p className="font-body text-xs text-muted-foreground line-clamp-1">{course.instructor.name}</p>
        <p className="font-body text-[11px] text-muted-foreground">
          {course.durationLabel} · {course.studentCount.toLocaleString("en-IN")} learners
        </p>
      </div>
    </Link>
  );
};

export default DiscoverCourseCard;
