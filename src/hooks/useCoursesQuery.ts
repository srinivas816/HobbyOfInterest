import { useQuery } from "@tanstack/react-query";
import { apiFetch, parseJson } from "@/lib/api";
import type { CourseListItem } from "@/types/course";

type CoursesResponse = {
  courses: CourseListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type CoursesFilters = {
  q?: string;
  category?: string;
  city?: string;
  format?: "ONLINE" | "IN_PERSON" | "";
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  page?: number;
  pageSize?: number;
  sort?: "popular" | "price-asc" | "price-desc" | "rating";
  /** When false, the query does not run (TanStack Query `enabled`). */
  enabled?: boolean;
};

export function useCoursesQuery(filters: CoursesFilters = {}) {
  const { enabled = true, ...apiFilters } = filters;
  return useQuery({
    queryKey: ["courses", apiFilters],
    enabled,
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (apiFilters.q) sp.set("search", apiFilters.q);
      if (apiFilters.category) sp.set("category", apiFilters.category);
      if (apiFilters.city) sp.set("city", apiFilters.city);
      if (apiFilters.format) sp.set("format", apiFilters.format);
      if (typeof apiFilters.minPrice === "number") sp.set("minPrice", String(apiFilters.minPrice));
      if (typeof apiFilters.maxPrice === "number") sp.set("maxPrice", String(apiFilters.maxPrice));
      if (typeof apiFilters.minRating === "number") sp.set("minRating", String(apiFilters.minRating));
      if (typeof apiFilters.page === "number") sp.set("page", String(apiFilters.page));
      if (typeof apiFilters.pageSize === "number") sp.set("pageSize", String(apiFilters.pageSize));
      if (apiFilters.sort) sp.set("sort", apiFilters.sort);
      const query = sp.toString();
      const res = await apiFetch(`/api/courses${query ? `?${query}` : ""}`);
      return parseJson<CoursesResponse>(res);
    },
  });
}
