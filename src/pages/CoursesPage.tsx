import { useMemo, useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import StaggerChildren, { StaggerItem } from "@/components/StaggerChildren";
import CourseCard from "@/components/CourseCard";
import { useCoursesQuery } from "@/hooks/useCoursesQuery";
import { Skeleton } from "@/components/ui/skeleton";

const categories = ["All", "Art & Craft", "Food & Baking", "Music", "DIY & Maker", "Wellness", "Online Only"];
const cities = ["All", "Mumbai", "Bengaluru", "Delhi NCR", "Hyderabad", "Pune", "Chennai", "Kolkata"];

const CoursesPage = () => {
  const [params, setParams] = useSearchParams();
  const initialQ = params.get("q") ?? "";
  const [search, setSearch] = useState(initialQ);
  const [active, setActive] = useState("All");
  const [city, setCity] = useState("All");
  const [format, setFormat] = useState<"" | "ONLINE" | "IN_PERSON">("");
  const [sort, setSort] = useState<"popular" | "price-asc" | "price-desc" | "rating">("popular");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setSearch(params.get("q") ?? "");
  }, [params]);

  const queryCategory = active === "Online Only" ? "All" : active;
  const queryFormat = active === "Online Only" ? "ONLINE" : format;
  const { data, isLoading, isError, refetch } = useCoursesQuery({
    q: search.trim() || undefined,
    category: queryCategory === "All" ? undefined : queryCategory,
    city: city === "All" ? undefined : city,
    format: queryFormat,
    page,
    pageSize: 12,
    sort,
  });
  const courses = data?.courses ?? [];
  const pagination = data?.pagination;

  const commitSearch = () => {
    const next = new URLSearchParams(params);
    if (search.trim()) next.set("q", search.trim());
    else next.delete("q");
    setParams(next);
    setPage(1);
  };

  return (
    <main className="section-warm min-h-[60vh]">
      <div className="container mx-auto py-16 md:py-24">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft size={16} /> Back to home
        </Link>

        <ScrollReveal>
          <div className="max-w-3xl">
            <span className="font-body text-xs tracking-[0.25em] uppercase text-accent font-medium">All classes</span>
            <h1 className="font-heading text-4xl md:text-5xl font-light text-foreground mt-3">Browse workshops & courses</h1>
            <p className="font-body text-muted-foreground mt-3 max-w-xl">
              Prices in INR. Tap a class for full description, what you’ll learn, and enrollment — similar to Udemy-style course pages.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 max-w-2xl">
          <div className="flex-1 flex rounded-2xl border border-border/60 bg-card/80 overflow-hidden">
            <div className="pl-4 flex items-center text-muted-foreground">
              <Search size={18} />
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commitSearch()}
              placeholder="Search pottery, baking, guitar…"
              className="flex-1 min-w-0 px-3 py-3.5 font-body text-sm bg-transparent outline-none"
            />
            <button
              type="button"
              onClick={commitSearch}
              className="px-5 font-body text-sm bg-foreground text-background hover:opacity-90 transition-opacity"
            >
              Search
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-8">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setActive(cat);
                setPage(1);
              }}
              className={`font-body text-xs sm:text-sm px-4 sm:px-6 py-2.5 rounded-full border transition-all duration-300 ${
                active === cat
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:border-foreground/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
          <select
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-border/60 bg-card px-3 py-2 text-sm"
          >
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={format}
            onChange={(e) => {
              setFormat(e.target.value as "" | "ONLINE" | "IN_PERSON");
              setPage(1);
            }}
            className="rounded-xl border border-border/60 bg-card px-3 py-2 text-sm"
          >
            <option value="">Any format</option>
            <option value="ONLINE">Online</option>
            <option value="IN_PERSON">In-person</option>
          </select>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as "popular" | "price-asc" | "price-desc" | "rating");
              setPage(1);
            }}
            className="rounded-xl border border-border/60 bg-card px-3 py-2 text-sm"
          >
            <option value="popular">Most popular</option>
            <option value="rating">Highest rated</option>
            <option value="price-asc">Price low to high</option>
            <option value="price-desc">Price high to low</option>
          </select>
        </div>

        {isError && (
          <div className="mt-12 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="font-body text-sm text-foreground">Couldn’t load classes. Is the API running?</p>
            <p className="font-body text-xs text-muted-foreground mt-2">From the repo root: cd server && npm run dev</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 font-body text-sm underline text-accent"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] rounded-2xl w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && !isError && (
          <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12" staggerDelay={0.06}>
            {courses.map((course) => (
              <StaggerItem key={course.slug}>
                <CourseCard course={course} />
              </StaggerItem>
            ))}
          </StaggerChildren>
        )}

        {!isLoading && !isError && courses.length === 0 && (
          <p className="mt-16 text-center font-body text-muted-foreground">No classes match your filters.</p>
        )}
        {!isLoading && !isError && pagination && pagination.totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-full border text-sm disabled:opacity-40"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              className="px-4 py-2 rounded-full border text-sm disabled:opacity-40"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default CoursesPage;
