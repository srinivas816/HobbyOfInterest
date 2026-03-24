import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Loader2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import CourseCard from "@/components/CourseCard";
import DataStateCard from "@/components/DataStateCard";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, parseJson } from "@/lib/api";
import type { CourseListItem } from "@/types/course";

type FavoriteRow = { id: string; course: CourseListItem };

const WishlistPage = () => {
  const { token, ready } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (ready && !token) navigate("/login?next=/wishlist", { replace: true });
  }, [ready, token, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["favorites"],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await apiFetch("/api/favorites");
      return parseJson<{ favorites: FavoriteRow[] }>(res);
    },
  });

  const removeFav = useMutation({
    mutationFn: async (slug: string) => {
      const res = await apiFetch(`/api/favorites/${slug}`, { method: "DELETE" });
      await parseJson<{ ok: boolean }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["course"] });
      toast.success("Removed from wishlist");
    },
  });

  if (!ready || !token) {
    return (
      <main className="container mx-auto py-24 flex justify-center">
        <Loader2 size={28} className="animate-spin text-accent" />
      </main>
    );
  }

  return (
    <main className="section-warm min-h-[60vh] pb-24">
      <div className="container mx-auto py-16 md:py-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center shrink-0">
            <Heart className="text-accent" size={22} />
          </div>
          <div className="min-w-0">
            <h1 className="font-heading text-3xl md:text-4xl font-light text-foreground">My wishlist</h1>
            <p className="font-body text-sm text-muted-foreground mt-1">Save classes and come back when ready to enroll.</p>
          </div>
        </div>

        {isLoading && (
          <div className="mt-14 flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-accent" />
          </div>
        )}

        {data && data.favorites.length === 0 && (
          <DataStateCard
            title="Your wishlist is empty"
            description="Save classes and compare them before you enroll."
            ctaLabel="Browse classes"
            ctaTo="/courses"
            className="mt-14 max-w-lg"
          />
        )}

        {data && data.favorites.length > 0 && (
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.favorites.map((f) => (
              <div key={f.id}>
                <CourseCard course={f.course} />
                <button
                  type="button"
                  onClick={() => removeFav.mutate(f.course.slug)}
                  className="mt-3 inline-flex items-center gap-2 font-body text-xs text-muted-foreground hover:text-foreground"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default WishlistPage;
