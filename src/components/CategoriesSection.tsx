import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import StaggerChildren, { StaggerItem } from "./StaggerChildren";
import CourseCard from "./CourseCard";
import { useCoursesQuery } from "@/hooks/useCoursesQuery";
import { Skeleton } from "@/components/ui/skeleton";

const categories = ["All", "Art & Craft", "Food & Baking", "Music", "DIY & Maker", "Wellness", "Online Only"];

const CategoriesSection = () => {
  const [active, setActive] = useState("All");
  const { data, isLoading, isError, refetch } = useCoursesQuery({ pageSize: 32, sort: "popular" });
  const courses = data?.courses ?? [];

  const filtered = useMemo(() => {
    if (active === "All") return courses;
    if (active === "Online Only") return courses.filter((c) => c.format === "ONLINE");
    return courses.filter((c) => c.category === active);
  }, [courses, active]);

  const preview = filtered.slice(0, 8);

  return (
    <section id="categories" className="section-warm">
      <div className="container mx-auto py-20 md:py-28">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto">
            <span className="font-body text-xs tracking-[0.25em] uppercase text-accent font-medium">Browse classes</span>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-foreground mt-4">
              Explore hobbies people actually stick with<span className="text-accent">.</span>
            </h2>
            <p className="font-body text-sm sm:text-base text-muted-foreground mt-4 max-w-xl mx-auto">
              In-person studio classes, live online workshops, and self-paced courses — all taught by verified instructors. Prices in INR.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-10 md:mt-12">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActive(cat)}
                className={`font-body text-xs sm:text-sm px-4 sm:px-6 py-2.5 sm:py-3 rounded-full transition-all duration-300 border ${
                  active === cat
                    ? "bg-foreground text-background border-foreground shadow-lg"
                    : "bg-transparent text-foreground border-border hover:border-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {isError && (
          <p className="text-center font-body text-sm text-muted-foreground mt-12">
            Connect the API to browse live catalog.{" "}
            <button type="button" className="text-accent underline" onClick={() => refetch()}>
              Retry
            </button>
          </p>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mt-12 md:mt-14">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] rounded-2xl w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && !isError && (
          <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mt-12 md:mt-14" staggerDelay={0.08}>
            {preview.map((course) => (
              <StaggerItem key={`${active}-${course.slug}`}>
                <CourseCard course={course} />
              </StaggerItem>
            ))}
          </StaggerChildren>
        )}

        <ScrollReveal delay={0.2}>
          <div className="text-center mt-12">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 font-body text-sm text-foreground border border-border px-8 py-3.5 rounded-full hover:border-foreground hover:bg-foreground hover:text-background transition-all duration-300"
            >
              View All Classes <ArrowUpRight size={15} />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default CategoriesSection;
