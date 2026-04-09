import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import PostAuthBanner from "@/components/PostAuthBanner";
import CategoryScrollRow from "@/components/discover/CategoryScrollRow";
import type { DiscoverCourseCardBadges } from "@/components/discover/DiscoverCourseCard";
import DiscoverLoggedInHome from "@/components/discover/DiscoverLoggedInHome";
import HorizontalCourseStrip from "@/components/discover/HorizontalCourseStrip";
import { useAuth } from "@/context/AuthContext";
import { useCoursesQuery } from "@/hooks/useCoursesQuery";
import type { CourseListItem } from "@/types/course";
import { fillDiscoverStripCourses } from "@/data/discoverDemoCourses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CITY_CHIPS: { label: string; apiCity?: string }[] = [
  { label: "All India" },
  { label: "Mumbai", apiCity: "Mumbai" },
  { label: "Bangalore", apiCity: "Bengaluru" },
  { label: "Delhi NCR", apiCity: "Delhi NCR" },
  { label: "Hyderabad", apiCity: "Hyderabad" },
  { label: "Pune", apiCity: "Pune" },
];

const BEGINNER_MAX_PAISE = 350_000;

function beginnerHeuristic(c: CourseListItem): boolean {
  const b = c.badge?.toLowerCase() ?? "";
  if (b.includes("beginner") || b.includes("starter")) return true;
  return c.priceCents > 0 && c.priceCents <= BEGINNER_MAX_PAISE;
}

/**
 * Public discover home — sticky search, categories, horizontal strips, join (see `product-spec/home.md`).
 */
const DiscoverHomePage = () => {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [q, setQ] = useState("");
  const [cityChip, setCityChip] = useState(CITY_CHIPS[0]!);
  const [inviteCode, setInviteCode] = useState("");

  const loggedIn = Boolean(user);
  const authSettled = ready;

  const guestAllIndia = !loggedIn && !cityChip.apiCity;
  const isCityScoped = Boolean(cityChip.apiCity);

  const scopedQuery = useCoursesQuery({
    city: cityChip.apiCity,
    pageSize: isCityScoped ? 16 : guestAllIndia ? 22 : 16,
    sort: "popular",
  });

  const indiaBackupQuery = useCoursesQuery({
    pageSize: 28,
    sort: "popular",
    enabled: isCityScoped,
  });

  const trendingQuery = useCoursesQuery({
    pageSize: 36,
    sort: "popular",
  });

  const cityList = scopedQuery.data?.courses ?? [];
  const indiaList = indiaBackupQuery.data?.courses ?? [];
  const trendingList = trendingQuery.data?.courses ?? [];

  const rawPopular = useMemo(() => {
    if (!isCityScoped) return cityList;
    if (cityList.length > 0) return cityList;
    return indiaList;
  }, [isCityScoped, cityList, indiaList]);

  const popularFromCity = isCityScoped && cityList.length > 0;

  const popularTitle = useMemo(() => {
    if (popularFromCity) return `Popular in ${cityChip.label}`;
    return "Popular across India";
  }, [popularFromCity, cityChip.label]);

  const popularSeeAll = useMemo(() => {
    if (popularFromCity && cityChip.apiCity) {
      return `/courses?city=${encodeURIComponent(cityChip.apiCity)}`;
    }
    return "/courses?sort=popular";
  }, [popularFromCity, cityChip.apiCity]);

  const popularLoading =
    scopedQuery.isPending || (isCityScoped && !scopedQuery.isPending && cityList.length === 0 && indiaBackupQuery.isPending);

  const popularCourses = useMemo(() => fillDiscoverStripCourses(rawPopular), [rawPopular]);

  const trendingDeduped = useMemo(() => {
    const usedSlugs = new Set(popularCourses.map((c) => c.slug));
    return trendingList.filter((c) => !usedSlugs.has(c.slug));
  }, [popularCourses, trendingList]);

  const rawTrending = trendingDeduped.length > 0 ? trendingDeduped : trendingList.slice(0, 12);
  const popularSlugs = useMemo(() => new Set(popularCourses.map((c) => c.slug)), [popularCourses]);
  const trendingCourses = useMemo(
    () => fillDiscoverStripCourses(rawTrending, 8, popularSlugs),
    [rawTrending, popularSlugs],
  );

  const trendingSlugs = useMemo(() => new Set(trendingCourses.map((c) => c.slug)), [trendingCourses]);

  const beginnerRaw = useMemo(() => {
    const used = new Set([...popularSlugs, ...trendingSlugs]);
    const seen = new Set<string>();
    const out: CourseListItem[] = [];
    for (const c of [...trendingList, ...indiaList, ...cityList]) {
      if (used.has(c.slug) || seen.has(c.id) || !beginnerHeuristic(c)) continue;
      seen.add(c.id);
      out.push(c);
    }
    return out;
  }, [popularSlugs, trendingSlugs, trendingList, indiaList, cityList]);

  const beginnerExclude = useMemo(
    () => new Set([...popularSlugs, ...trendingSlugs]),
    [popularSlugs, trendingSlugs],
  );
  const beginnerCourses = useMemo(
    () => fillDiscoverStripCourses(beginnerRaw, 8, beginnerExclude),
    [beginnerRaw, beginnerExclude],
  );

  const beginnerLoading =
    scopedQuery.isPending || trendingQuery.isPending || (isCityScoped && indiaBackupQuery.isPending);

  const onSearch = () => {
    const t = q.trim();
    navigate(t ? `/courses?q=${encodeURIComponent(t)}` : "/courses");
  };

  const onJoinClass = () => {
    const code = inviteCode.trim().toUpperCase().replace(/\s+/g, "");
    if (code.length < 4) return;
    navigate(`/join/${encodeURIComponent(code)}`);
  };

  const nearbyBadges = (c: CourseListItem): DiscoverCourseCardBadges => ({
    nearby: popularFromCity,
    beginner: beginnerHeuristic(c),
  });

  const trendingBadges = (c: CourseListItem, index: number): DiscoverCourseCardBadges => ({
    popular: index < 5,
    beginner: beginnerHeuristic(c),
  });

  return (
    <>
      <PostAuthBanner />

      {authSettled && loggedIn ? <DiscoverLoggedInHome /> : null}

      <main className="min-h-[70vh] min-w-0 bg-background pb-6 md:pb-8">
        <header className="sticky top-[4.5rem] z-30 border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 sm:py-4 space-y-4">
            <h1 className="font-heading text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
              Find a class near you<span className="text-accent">.</span>
            </h1>

            <div className="rounded-2xl border-2 border-border/70 bg-card shadow-sm overflow-hidden transition-[border-color,box-shadow] focus-within:border-accent/60 focus-within:shadow-md focus-within:ring-2 focus-within:ring-accent/15">
              <div className="flex min-w-0 items-stretch touch-manipulation">
                <div className="pl-4 flex items-center text-accent shrink-0">
                  <Search className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.25} aria-hidden />
                </div>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSearch()}
                  placeholder="Search pottery, guitar, dance…"
                  className="flex-1 min-w-0 bg-transparent px-3 py-3.5 sm:py-4 font-body text-base outline-none placeholder:text-muted-foreground/70"
                  aria-label="Search classes"
                  enterKeyHint="search"
                />
                <button
                  type="button"
                  onClick={onSearch}
                  className="shrink-0 px-5 sm:px-6 py-3.5 sm:py-4 font-body text-sm sm:text-base font-semibold bg-foreground text-background hover:opacity-90 transition-opacity"
                >
                  Search
                </button>
              </div>
            </div>

            <div
              className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 touch-pan-x overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                    className={`shrink-0 rounded-full border px-3.5 py-2 font-body text-xs sm:text-sm transition-colors touch-manipulation active:scale-[0.98] ${
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
          title={popularTitle}
          courses={popularCourses}
          isLoading={popularLoading}
          isError={false}
          seeAllTo={popularSeeAll}
          onRetry={() => {
            void scopedQuery.refetch();
            if (isCityScoped) void indiaBackupQuery.refetch();
          }}
          getBadges={(c) => nearbyBadges(c)}
        />

        <HorizontalCourseStrip
          title="Trending now"
          courses={trendingCourses}
          isLoading={trendingQuery.isPending}
          isError={false}
          seeAllTo="/courses?sort=popular"
          onRetry={() => trendingQuery.refetch()}
          getBadges={(c, i) => trendingBadges(c, i)}
        />

        <HorizontalCourseStrip
          title="Beginner friendly"
          courses={beginnerCourses}
          isLoading={beginnerLoading}
          isError={false}
          seeAllTo="/courses?sort=popular"
          onRetry={() => {
            void trendingQuery.refetch();
            void scopedQuery.refetch();
            if (isCityScoped) void indiaBackupQuery.refetch();
          }}
          getBadges={() => ({ beginner: true })}
        />

        <section className="mt-6 mx-auto max-w-6xl px-4 sm:px-6" aria-label="Join with invite">
          <div className="rounded-2xl border border-border/60 bg-muted/15 px-3 py-3 sm:px-4 sm:py-4 space-y-3">
            <p className="font-heading text-sm text-foreground">Have an invite code?</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
              <Input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onJoinClass()}
                placeholder="Enter code"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                className="rounded-xl h-11 sm:h-12 font-mono text-sm tracking-wide border-border/70"
                aria-label="Class invite code"
              />
              <Button
                type="button"
                className="h-11 sm:h-12 rounded-xl px-6 shrink-0 font-semibold touch-manipulation"
                onClick={onJoinClass}
                disabled={inviteCode.trim().length < 4}
              >
                Join class
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default DiscoverHomePage;
