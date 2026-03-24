import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Star } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { apiFetch, parseJson } from "@/lib/api";
import { courseCoverSrc } from "@/lib/courseImages";
import CourseCard from "@/components/CourseCard";
import type { CourseListItem } from "@/types/course";

type InstructorDetail = {
  id: string;
  name: string;
  specialty: string;
  students: number;
  classes: number;
  rating: number;
  courses: (Pick<
    CourseListItem,
    "slug" | "title" | "imageKey" | "rating" | "studentCount" | "priceCents" | "durationLabel" | "badge" | "format" | "locationLabel"
  > & { priceDisplay: string })[];
};

const InstructorPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["instructor", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await apiFetch(`/api/instructors/${id}`);
      const json = await parseJson<{ instructor: InstructorDetail }>(res);
      return json.instructor;
    },
  });

  if (!id) return null;

  if (isLoading) {
    return (
      <main className="container mx-auto py-24 flex justify-center">
        <Loader2 className="animate-spin text-accent" size={32} />
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="container mx-auto py-24 text-center">
        <p className="font-heading text-xl">Instructor not found</p>
        <Link to="/instructors" className="inline-block mt-6 text-accent underline text-sm">
          All instructors
        </Link>
      </main>
    );
  }

  const listCourses: CourseListItem[] = data.courses.map((c) => ({
    id: c.slug,
    slug: c.slug,
    title: c.title,
    description: "",
    category: "",
    format: c.format,
    locationLabel: c.locationLabel,
    city: null,
    durationLabel: c.durationLabel,
    priceCents: c.priceCents,
    priceDisplay: c.priceDisplay,
    outcomes: null,
    imageKey: c.imageKey,
    coverImageUrl: c.coverImageUrl,
    rating: c.rating,
    studentCount: c.studentCount,
    badge: c.badge,
    instructor: { id: data.id, name: data.name },
  }));

  return (
    <main className="bg-background pb-24">
      <div className="border-b border-border/40 bg-muted/20">
        <div className="container mx-auto py-6">
          <Link
            to="/instructors"
            className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} /> All instructors
          </Link>
        </div>
      </div>

      <div className="container mx-auto py-12 md:py-16">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
            <div className="w-full md:w-72 aspect-[3/4] md:aspect-auto md:h-96 rounded-2xl overflow-hidden border border-border/50 flex-shrink-0">
              <img
                src={courseCoverSrc(data.courses[0]?.imageKey ?? "hero-pottery", data.courses[0]?.coverImageUrl)}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="font-heading text-4xl md:text-5xl font-light text-foreground">{data.name}</h1>
              <p className="font-body text-accent mt-2">{data.specialty}</p>
              <div className="flex flex-wrap gap-4 mt-6 font-body text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star size={14} className="text-accent fill-accent" /> {data.rating} instructor rating
                </span>
                <span>{data.students.toLocaleString("en-IN")} learners</span>
                <span>{data.classes} classes</span>
              </div>
              <p className="font-body text-muted-foreground mt-8 max-w-2xl leading-relaxed">
                Passionate about hands-on teaching and small batches. Browse classes below to enroll — pricing is shown in INR.
              </p>
            </div>
          </div>
        </ScrollReveal>

        <section className="mt-16 md:mt-20">
          <h2 className="font-heading text-2xl text-foreground mb-8">Classes by this instructor</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {listCourses.map((c) => (
              <CourseCard key={c.slug} course={c} />
            ))}
          </div>
          {listCourses.length === 0 && <p className="font-body text-muted-foreground">No published classes yet.</p>}
        </section>
      </div>
    </main>
  );
};

export default InstructorPage;
