import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ScrollReveal from "./ScrollReveal";
import StaggerChildren, { StaggerItem } from "./StaggerChildren";
import { apiFetch, parseJson } from "@/lib/api";
import { courseCoverSrc } from "@/lib/courseImages";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

type InstructorRow = {
  id: string;
  name: string;
  specialty: string;
  students: number;
  classes: number;
  rating: number;
  imageKey: string;
  coverImageUrl?: string | null;
};

const InstructorsSection = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["instructors"],
    queryFn: async () => {
      const res = await apiFetch("/api/instructors");
      return parseJson<{ instructors: InstructorRow[] }>(res).then((j) => j.instructors);
    },
  });

  const list = data?.slice(0, 4) ?? [];

  return (
    <section className="bg-background">
      <div className="container mx-auto py-20 md:py-28">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto">
            <span className="font-body text-xs tracking-[0.25em] uppercase text-accent font-medium">Meet our instructors</span>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-foreground mt-4">
              Learn from passionate experts<span className="text-accent">.</span>
            </h2>
            <p className="font-body text-sm sm:text-base text-muted-foreground mt-4">
              Every instructor is vetted for expertise, teaching quality, and student satisfaction.
            </p>
          </div>
        </ScrollReveal>

        {isError && <p className="text-center font-body text-sm text-muted-foreground mt-14">Instructors load when the API is available.</p>}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl w-full" />
            ))}
          </div>
        )}

        {!isLoading && !isError && (
          <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14" staggerDelay={0.1}>
            {list.map((inst) => (
              <StaggerItem key={inst.id}>
                <Link to={`/instructors/${inst.id}`} className="group block">
                  <div className="aspect-[3/4] overflow-hidden rounded-2xl relative">
                    <img
                      src={courseCoverSrc(inst.imageKey, inst.coverImageUrl)}
                      alt={inst.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <p className="font-heading text-xl text-background">{inst.name}</p>
                      <p className="font-body text-xs text-background/70 mt-1">{inst.specialty}</p>
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <span className="font-body text-xs text-background/80 flex items-center gap-1">
                          <Star size={12} className="fill-accent text-accent" /> {inst.rating}
                        </span>
                        <span className="font-body text-xs text-background/60">{inst.students.toLocaleString("en-IN")} learners</span>
                        <span className="font-body text-xs text-background/60">{inst.classes} classes</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerChildren>
        )}

        <ScrollReveal delay={0.2}>
          <div className="text-center mt-12">
            <Link
              to="/instructors"
              className="inline-flex items-center gap-2 font-body text-sm text-foreground border border-border px-8 py-3.5 rounded-full hover:border-foreground hover:bg-foreground hover:text-background transition-all duration-300"
            >
              View All Instructors
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default InstructorsSection;
