import { Link } from "react-router-dom";

const CATEGORIES: { label: string; emoji: string; href: string }[] = [
  { label: "Art & Craft", emoji: "🎨", href: "/courses?category=Art%20%26%20Craft" },
  { label: "Food & Baking", emoji: "🧁", href: "/courses?category=Food%20%26%20Baking" },
  { label: "Music", emoji: "🎸", href: "/courses?category=Music" },
  { label: "DIY & Maker", emoji: "🛠️", href: "/courses?category=DIY%20%26%20Maker" },
  { label: "Wellness", emoji: "🧘", href: "/courses?category=Wellness" },
  { label: "Online", emoji: "💻", href: "/courses?category=Online%20Only" },
  { label: "Dance", emoji: "💃", href: "/courses?q=dance" },
  { label: "Sports", emoji: "🏸", href: "/courses?q=sports" },
];

const CategoryScrollRow = () => {
  return (
    <section className="mt-4 min-w-0" aria-labelledby="discover-categories-heading">
      <h2 id="discover-categories-heading" className="sr-only">
        Categories
      </h2>
      <div
        className="flex gap-2 sm:gap-3 overflow-x-auto py-1 px-4 sm:px-6 scroll-pl-4 sm:scroll-pl-6 overscroll-x-contain touch-pan-x snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {CATEGORIES.map((c) => (
          <Link
            key={c.label}
            to={c.href}
            className="snap-start shrink-0 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2.5 font-body text-sm font-medium text-foreground hover:border-accent/50 hover:bg-accent/5 transition-colors touch-manipulation active:scale-[0.98]"
          >
            <span className="text-lg" aria-hidden>
              {c.emoji}
            </span>
            {c.label}
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategoryScrollRow;
