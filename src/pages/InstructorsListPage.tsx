import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Star } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import StaggerChildren, { StaggerItem } from "@/components/StaggerChildren";
import { apiFetch, parseJson } from "@/lib/api";
import { courseCoverSrc } from "@/lib/courseImages";
import { Skeleton } from "@/components/ui/skeleton";

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

const InstructorsListPage = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["instructors"],
    queryFn: async () => {
      const res = await apiFetch("/api/instructors");
      const json = await parseJson<{ instructors: InstructorRow[] }>(res);
      return json.instructors;
    },
  });

  return (
    <main className="bg-background min-h-[60vh] pb-24">
      <div className="container mx-auto py-16 md:py-24">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft size={16} /> Back to home
        </Link>

        <ScrollReveal>
          <h1 className="font-heading text-4xl md:text-5xl font-light text-foreground">Instructors</h1>
          <p className="font-body text-muted-foreground mt-3 max-w-xl">
            Verified teachers across India and online. Open a profile to see their classes.
          </p>
        </ScrollReveal>

        {isError && (
          <p className="mt-10 font-body text-sm text-destructive">
            Could not load instructors.{" "}
            <button type="button" className="underline" onClick={() => refetch()}>
              Retry
            </button>
          </p>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl w-full" />
            ))}
          </div>
        )}

        {data && (
          <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14" staggerDelay={0.08}>
            {data.map((inst) => (
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
      </div>
    </main>
  );
};

export default InstructorsListPage;
