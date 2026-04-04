import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import PostAuthBanner from "@/components/PostAuthBanner";
import CategoryScrollRow from "@/components/discover/CategoryScrollRow";
import type { DiscoverCourseCardBadges } from "@/components/discover/DiscoverCourseCard";
import DiscoverLoggedInHome from "@/components/discover/DiscoverLoggedInHome";
import HorizontalCourseStrip, { type StripEmptyState } from "@/components/discover/HorizontalCourseStrip";
import InstructorLeadFold from "@/components/discover/InstructorLeadFold";
import LearnerConversionBar from "@/components/discover/LearnerConversionBar";
import { useAuth } from "@/context/AuthContext";
import { useCoursesQuery } from "@/hooks/useCoursesQuery";
import type { CourseListItem } from "@/types/course";

const CITY_CHIPS: { label: string; apiCity?: string }[] = [
  { label: "All India" },
  { label: "Mumbai", apiCity: "Mumbai" },
  { label: "Bengaluru", apiCity: "Bengaluru" },
  { label: "Delhi NCR", apiCity: "Delhi NCR" },
  { label: "Hyderabad", apiCity: "Hyderabad" },
  { label: "Pune", apiCity: "Pune" },
];

const INSTRUCTOR_STUDIO_ONBOARD = encodeURIComponent("/instructor/studio?setup=1#studio-create-class");

/** Paise — tag lower-priced listings as friendly entry points */
const BEGINNER_MAX_PAISE = 350_000;

/** Strip badges use list position + price until the API exposes enrollment velocity, ratings buckets, and geo match. */

function beginnerHeuristic(c: CourseListItem): boolean {
  const b = c.badge?.toLowerCase() ?? "";
  if (b.includes("beginner") || b.includes("starter")) return true;
  return c.priceCents > 0 && c.priceCents <= BEGINNER_MAX_PAISE;
}

/**
 * App-first home: instructor lead (logged out), daily layer (logged in), then Categories + Nearby + Trending.
 * Shown when VITE_MVP_INSTRUCTOR_FOCUS is on (see Index.tsx).
 */
const DiscoverHomePage = () => {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [q, setQ] = useState("");
  const [cityChip, setCityChip] = useState(CITY_CHIPS[1]!);

  const loggedIn = Boolean(user);
  const authSettled = ready;

  const nearbyQuery = useCoursesQuery({
    city: cityChip.apiCity,
    pageSize: 16,
    sort: "popular",
  });

  const trendingQuery = useCoursesQuery({
    pageSize: 16,
    sort: "popular",
  });

  const trendingDeduped = useMemo(() => {
    const nearIds = new Set((nearbyQuery.data?.courses ?? []).map((c) => c.id));
    const list = trendingQuery.data?.courses ?? [];
    return list.filter((c) => !nearIds.has(c.id));
  }, [nearbyQuery.data?.courses, trendingQuery.data?.courses]);

  const onSearch = () => {
    const t = q.trim();
    navigate(t ? `/courses?q=${encodeURIComponent(t)}` : "/courses");
  };

  const nearbySeeAll =
    cityChip.apiCity != null
      ? `/courses?city=${encodeURIComponent(cityChip.apiCity)}`
      : "/courses?sort=popular";

  const nearbyBadges = (c: CourseListItem): DiscoverCourseCardBadges => ({
    nearby: Boolean(cityChip.apiCity),
    beginner: beginnerHeuristic(c),
  });

  const trendingBadges = (c: CourseListItem, index: number): DiscoverCourseCardBadges => ({
    popular: index < 5,
    beginner: beginnerHeuristic(c),
  });

  const nearbyEmptyState = useMemo((): StripEmptyState => {
    const teach = `/login?next=${INSTRUCTOR_STUDIO_ONBOARD}`;
    if (cityChip.apiCity) {
      return {
        title: `No classes yet in ${cityChip.apiCity}`,
        description: "Be the first to list a batch here — learners searching your city will see you first.",
        primaryCta: { label: "Start teaching", to: teach },
        secondaryCta: { label: "Browse all India", to: "/courses?sort=popular" },
      };
    }
    return {
      title: "No public listings in this row yet",
      description: "Seed the catalog: create your class, invite students, then publish when you’re ready.",
      primaryCta: { label: "Start teaching", to: teach },
      secondaryCta: { label: "See all classes", to: "/courses" },
    };
  }, [cityChip.apiCity]);

  const trendingEmptyState = useMemo((): StripEmptyState => {
    const teach = `/login?next=${INSTRUCTOR_STUDIO_ONBOARD}`;
    return {
      title: "Trending fills up as learners join",
      description: "Explore the full catalog — or list your own class to appear here.",
      primaryCta: { label: "Explore classes", to: "/courses?sort=popular" },
      secondaryCta: { label: "Start teaching", to: teach },
    };
  }, []);

  return (
    <>
      <PostAuthBanner />

      {authSettled ? loggedIn ? <DiscoverLoggedInHome /> : <InstructorLeadFold /> : null}

      <main className="min-h-[70vh] min-w-0 bg-background pb-8">
        <header className="sticky top-[4.5rem] z-30 border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="font-heading text-xl sm:text-2xl md:text-3xl font-light text-foreground leading-tight">
                  {loggedIn ? (
                    <>
                      More to explore<span className="text-accent">.</span>
                    </>
                  ) : (
                    <>
                      Find your next class<span className="text-accent">.</span>
                    </>
                  )}
                </h1>
                <p className="font-body text-xs sm:text-sm text-muted-foreground mt-1 max-w-md">
                  {loggedIn
                    ? "After today’s class and quick actions above, browse more below."
                    : "Tutors: manage classes in the section above. Learners: search and browse here."}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
              <div className="flex flex-1 min-w-0 rounded-2xl border border-border/60 bg-card/60 overflow-hidden">
                <div className="pl-3 flex items-center text-muted-foreground shrink-0">
                  <Search size={18} aria-hidden />
                </div>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSearch()}
                  placeholder="Pottery, guitar, weekend batch…"
                  className="flex-1 min-w-0 bg-transparent px-2 py-2.5 font-body text-sm outline-none"
                  aria-label="Search classes"
                />
                <button
                  type="button"
                  onClick={onSearch}
                  className="shrink-0 px-4 py-2.5 font-body text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
                >
                  Search
                </button>
              </div>
              <Link
                to="/courses"
                className="shrink-0 text-center rounded-2xl border border-border/60 px-4 py-2.5 font-body text-sm font-medium hover:bg-muted/40 transition-colors"
              >
                All classes
              </Link>
            </div>

            <div
              className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 touch-pan-x overscroll-x-contain [scrollbar-width:thin]"
              style={{ WebkitOverflowScrolling: "touch" }}
              role="list"
              aria-label="Choose area"
            >
              {CITY_CHIPS.map((c) => {
                const active = c.label === cityChip.label;
                return (
                  <button
                    key={c.label}
                    type="button"
                    role="listitem"
                    onClick={() => setCityChip(c)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 font-body text-xs sm:text-sm transition-colors ${
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border/70 bg-background hover:border-foreground/30"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        <CategoryScrollRow />

        <HorizontalCourseStrip
          title={cityChip.apiCity ? `Classes in ${cityChip.apiCity}` : "Popular across India"}
          subtitle={cityChip.apiCity ? `In-person & online picks near you` : "Most enrolled right now"}
          courses={nearbyQuery.data?.courses ?? []}
          isLoading={nearbyQuery.isLoading}
          isError={nearbyQuery.isError}
          seeAllTo={nearbySeeAll}
          onRetry={() => nearbyQuery.refetch()}
          getBadges={(c) => nearbyBadges(c)}
          emptyState={nearbyEmptyState}
        />

        <HorizontalCourseStrip
          title="Trending now"
          subtitle="What learners are booking"
          courses={trendingDeduped.length > 0 ? trendingDeduped : (trendingQuery.data?.courses ?? []).slice(0, 12)}
          isLoading={trendingQuery.isLoading}
          isError={trendingQuery.isError}
          seeAllTo="/courses?sort=popular"
          onRetry={() => trendingQuery.refetch()}
          getBadges={(c, i) => trendingBadges(c, i)}
          emptyState={trendingEmptyState}
        />

        {authSettled && !loggedIn ? <LearnerConversionBar /> : null}
      </main>
    </>
  );
};

export default DiscoverHomePage;
