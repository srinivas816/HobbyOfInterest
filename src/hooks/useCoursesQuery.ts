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
};

export function useCoursesQuery(filters: CoursesFilters = {}) {
  return useQuery({
    queryKey: ["courses", filters],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (filters.q) sp.set("search", filters.q);
      if (filters.category) sp.set("category", filters.category);
      if (filters.city) sp.set("city", filters.city);
      if (filters.format) sp.set("format", filters.format);
      if (typeof filters.minPrice === "number") sp.set("minPrice", String(filters.minPrice));
      if (typeof filters.maxPrice === "number") sp.set("maxPrice", String(filters.maxPrice));
      if (typeof filters.minRating === "number") sp.set("minRating", String(filters.minRating));
      if (typeof filters.page === "number") sp.set("page", String(filters.page));
      if (typeof filters.pageSize === "number") sp.set("pageSize", String(filters.pageSize));
      if (filters.sort) sp.set("sort", filters.sort);
      const query = sp.toString();
      const res = await apiFetch(`/api/courses${query ? `?${query}` : ""}`);
      return parseJson<CoursesResponse>(res);
    },
  });
}
