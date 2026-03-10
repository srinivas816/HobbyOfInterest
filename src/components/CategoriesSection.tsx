import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

import categoryBaking from "@/assets/category-baking.jpg";
import categoryWoodworking from "@/assets/category-woodworking.jpg";
import categoryWatercolor from "@/assets/category-watercolor.jpg";
import categorySewing from "@/assets/category-sewing.jpg";
import categoryMusic from "@/assets/category-music.jpg";
import heroPottery from "@/assets/hero-pottery.jpg";
import heroPainting from "@/assets/hero-painting.jpg";
import heroFloristry from "@/assets/hero-floristry.jpg";

const categories = ["All", "Crafts", "Art", "Culinary", "Music", "Wellness"];

const classes = [
  { title: "Wheel Thrown Pottery", image: heroPottery, duration: "6 weeks", category: "Crafts", instructor: "Maria Chen" },
  { title: "Artisan Bread Baking", image: categoryBaking, duration: "4 weeks", category: "Culinary", instructor: "James Oliver" },
  { title: "Woodworking Basics", image: categoryWoodworking, duration: "8 weeks", category: "Crafts", instructor: "Tom Birch" },
  { title: "Watercolor Landscapes", image: categoryWatercolor, duration: "5 weeks", category: "Art", instructor: "Lena Park" },
  { title: "Textile & Sewing", image: categorySewing, duration: "6 weeks", category: "Crafts", instructor: "Sarah Mills" },
  { title: "Acoustic Guitar", image: categoryMusic, duration: "10 weeks", category: "Music", instructor: "David Reyes" },
  { title: "Oil Painting Studio", image: heroPainting, duration: "8 weeks", category: "Art", instructor: "Claude Morel" },
  { title: "Floral Arrangement", image: heroFloristry, duration: "3 weeks", category: "Wellness", instructor: "Ivy Greene" },
];

const CategoriesSection = () => {
  const [active, setActive] = useState("All");

  const filtered = active === "All" ? classes : classes.filter((c) => c.category === active);

  return (
    <section id="categories" className="section-divider">
      <div className="container mx-auto px-6 py-16 md:py-24">
        <h2 className="font-heading text-3xl md:text-5xl font-light text-foreground text-center">
          Unlimited access to 100+ classes<span className="text-primary">.</span>
        </h2>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-0 mt-10 border-architectural inline-flex mx-auto w-fit">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`font-body text-sm px-6 py-3 transition-colors border-r border-foreground/20 last:border-r-0 ${
                active === cat
                  ? "bg-foreground text-background"
                  : "bg-background text-foreground hover:bg-secondary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Class grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 mt-12">
          {filtered.map((cls, i) => (
            <div
              key={i}
              className="border-architectural group cursor-pointer hover:border-architectural-thick transition-all duration-300"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={cls.image}
                  alt={cls.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-body text-xs tracking-widest uppercase text-muted-foreground">
                      {cls.category} · {cls.duration}
                    </p>
                    <h3 className="font-heading text-lg mt-1 text-foreground">
                      {cls.title}
                    </h3>
                    <p className="font-body text-sm text-muted-foreground mt-1">
                      {cls.instructor}
                    </p>
                  </div>
                  <ArrowUpRight
                    size={20}
                    className="text-muted-foreground group-hover:text-primary transition-colors mt-1 flex-shrink-0"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
