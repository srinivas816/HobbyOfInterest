export type CourseListItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  format: "ONLINE" | "IN_PERSON";
  locationLabel: string;
  city: string | null;
  durationLabel: string;
  priceCents: number;
  priceDisplay: string;
  outcomes: string | null;
  imageKey: string;
  coverImageUrl?: string | null;
  rating: number;
  studentCount: number;
  badge: string | null;
  instructor: { id: string; name: string };
};

export type CourseDetail = CourseListItem & {
  instructor: { id: string; name: string; specialty: string | null };
  isFavorite: boolean;
  isEnrolled: boolean;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: { id: string; name: string };
  }>;
  sections: Array<{
    id: string;
    title: string;
    sortOrder: number;
    lessons: Array<{
      id: string;
      title: string;
      durationMin: number;
      preview: boolean;
      sortOrder: number;
    }>;
  }>;
};
