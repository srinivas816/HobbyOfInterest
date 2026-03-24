import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin, Monitor } from "lucide-react";
import { courseCoverSrc } from "@/lib/courseImages";
import type { CourseListItem } from "@/types/course";

type CourseCardProps = { course: CourseListItem };

const CourseCard = ({ course }: CourseCardProps) => {
  const online = course.format === "ONLINE";
  const img = courseCoverSrc(course.imageKey, course.coverImageUrl);

  return (
    <Link to={`/courses/${course.slug}`} className="group block text-left">
      <div className="aspect-[4/3] overflow-hidden rounded-2xl relative">
        <img src={img} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 translate-x-2">
          <ArrowUpRight size={16} className="text-foreground" />
        </div>
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-1.5">
          <span
            className={`backdrop-blur-sm text-foreground font-body text-[11px] uppercase tracking-[0.18em] px-3 py-1.5 rounded-full flex items-center gap-1 ${
              online ? "bg-accent/90 text-accent-foreground" : "bg-background/90"
            }`}
          >
            {online ? <Monitor size={10} /> : <MapPin size={10} />}
            {course.locationLabel}
          </span>
        </div>
        {course.badge && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 group-hover:opacity-0 transition-opacity">
            <span className="bg-primary text-primary-foreground font-body text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-medium">
              {course.badge}
            </span>
          </div>
        )}
        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
          <span className="bg-background/90 backdrop-blur-sm text-foreground font-heading text-sm font-semibold px-3 py-1.5 rounded-full">
            {course.priceDisplay}
          </span>
        </div>
      </div>
      <div className="pt-4 px-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-base sm:text-lg text-foreground group-hover:text-primary transition-colors break-words">
            {course.title}
          </h3>
        </div>
        <p className="font-body text-xs sm:text-sm text-muted-foreground mt-1">
          {course.instructor.name} · {course.durationLabel}
          {course.city ? ` · ${course.city}` : ""}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="font-body text-xs text-accent font-medium">★ {course.rating}</span>
          <span className="font-body text-xs text-muted-foreground">({course.studentCount.toLocaleString("en-IN")} learners)</span>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
