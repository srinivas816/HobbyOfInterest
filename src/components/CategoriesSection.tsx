import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import StaggerChildren, { StaggerItem } from "./StaggerChildren";

import categoryBaking from "@/assets/category-baking.jpg";
import categoryWoodworking from "@/assets/category-woodworking.jpg";
import categoryWatercolor from "@/assets/category-watercolor.jpg";
import categorySewing from "@/assets/category-sewing.jpg";
import categoryMusic from "@/assets/category-music.jpg";
import heroPottery from "@/assets/hero-pottery.jpg";
import heroPainting from "@/assets/hero-painting.jpg";
import heroFloristry from "@/assets/hero-floristry.jpg";

const categories = ["All categories", "Crafts", "Art", "Culinary", "Music", "Wellness"];

const classes = [
  { title: "Wheel Thrown Pottery", image: heroPottery, duration: "6 weeks", category: "Crafts", instructor: "Maria Chen", price: "$89" },
  { title: "Artisan Bread Baking", image: categoryBaking, duration: "4 weeks", category: "Culinary", instructor: "James Oliver", price: "$65" },
  { title: "Woodworking Basics", image: categoryWoodworking, duration: "8 weeks", category: "Crafts", instructor: "Tom Birch", price: "$120" },
  { title: "Watercolor Landscapes", image: categoryWatercolor, duration: "5 weeks", category: "Art", instructor: "Lena Park", price: "$75" },
  { title: "Textile & Sewing", image: categorySewing, duration: "6 weeks", category: "Crafts", instructor: "Sarah Mills", price: "$95" },
  { title: "Acoustic Guitar", image: categoryMusic, duration: "10 weeks", category: "Music", instructor: "David Reyes", price: "$110" },
  { title: "Oil Painting Studio", image: heroPainting, duration: "8 weeks", category: "Art", instructor: "Claude Morel", price: "$99" },
  { title: "Floral Arrangement", image: heroFloristry, duration: "3 weeks", category: "Wellness", instructor: "Ivy Greene", price: "$55" },
];

const CategoriesSection = () => {
  const [active, setActive] = useState("All categories");

  const filtered = active === "All categories" ? classes : classes.filter((c) => c.category === active);

  return (
    <section id="categories" className="section-warm">
      <div className="container mx-auto px-6 py-20 md:py-28">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto">
            <span className="font-body text-xs tracking-[0.25em] uppercase text-accent font-medium">
              Our Classes
            </span>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-foreground mt-4">
              Unlimited access to 100+ instructors<span className="text-accent">.</span>
            </h2>
          </div>
        </ScrollReveal>

        {/* Category filters */}
        <ScrollReveal delay={0.15}>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-10 md:mt-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`font-body text-xs sm:text-sm px-4 sm:px-6 py-2.5 sm:py-3 rounded-full transition-all duration-300 border ${
                  active === cat
                    ? "bg-foreground text-background border-foreground shadow-lg"
                    : "bg-transparent text-foreground border-border hover:border-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Class grid */}
        <StaggerChildren
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mt-12 md:mt-14"
          staggerDelay={0.08}
        >
          {filtered.map((cls, i) => (
            <StaggerItem key={`${active}-${i}`}>
              <div className="group cursor-pointer">
                <div className="aspect-[4/3] overflow-hidden rounded-2xl relative">
                  <img
                    src={cls.image}
                    alt={cls.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 translate-x-2">
                    <ArrowUpRight size={16} className="text-foreground" />
                  </div>
                  {/* Price badge */}
                  <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
                    <span className="bg-background/90 backdrop-blur-sm text-foreground font-heading text-sm font-semibold px-3 py-1.5 rounded-full">
                      {cls.price}
                    </span>
                  </div>
                </div>
                <div className="pt-4 px-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading text-base sm:text-lg text-foreground group-hover:text-primary transition-colors">
                      {cls.title}
                    </h3>
                  </div>
                  <p className="font-body text-xs sm:text-sm text-muted-foreground mt-1">
                    {cls.instructor} · {cls.duration}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>

        <ScrollReveal delay={0.2}>
          <div className="text-center mt-12">
            <a
              href="#"
              className="inline-flex items-center gap-2 font-body text-sm text-foreground border border-border px-8 py-3.5 rounded-full hover:border-foreground hover:bg-foreground hover:text-background transition-all duration-300"
            >
              View All Classes <ArrowUpRight size={15} />
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default CategoriesSection;
