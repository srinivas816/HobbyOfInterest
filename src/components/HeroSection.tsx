import { useState } from "react";
import { ArrowRight } from "lucide-react";
import heroPottery from "@/assets/hero-pottery.jpg";
import heroPainting from "@/assets/hero-painting.jpg";
import heroFloristry from "@/assets/hero-floristry.jpg";

const heroImages = [
  { src: heroPottery, label: "Pottery", category: "Ceramics" },
  { src: heroPainting, label: "Painting", category: "Fine Art" },
  { src: heroFloristry, label: "Floristry", category: "Botanical" },
];

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <section className="container mx-auto px-6 pt-12 pb-16 md:pt-20 md:pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left: Headline + Search */}
        <div>
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-light leading-[0.95] tracking-tight text-foreground">
            Explore.<br />
            Create.<br />
            Grow<span className="text-primary">.</span>
          </h1>
          <p className="font-body text-base text-muted-foreground mt-6 max-w-md leading-relaxed">
            Discover local and online hobby classes taught by passionate artisans. From pottery to painting — find your next obsession.
          </p>

          <div className="mt-8 flex border-architectural overflow-hidden">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find your passion"
              className="flex-1 px-5 py-4 font-body text-sm bg-background text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button className="bg-primary text-primary-foreground px-6 py-4 font-body text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
              Go <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Right: Hero Image Cards */}
        <div className="flex gap-4 h-[400px] md:h-[500px]">
          {heroImages.map((img, i) => (
            <div
              key={i}
              className={`relative overflow-hidden border-architectural group cursor-pointer transition-all duration-500 hover:border-architectural-thick ${
                i === 0 ? "flex-[2]" : "flex-1"
              }`}
            >
              <img
                src={img.src}
                alt={img.label}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-foreground/80 p-4">
                <span className="font-body text-xs tracking-widest uppercase text-background/70">
                  {img.category}
                </span>
                <p className="font-heading text-lg text-background mt-0.5">
                  {img.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-0 border-architectural">
        {[
          { number: "100+", label: "Hobby Classes" },
          { number: "50+", label: "Expert Instructors" },
          { number: "12", label: "Categories" },
          { number: "5k+", label: "Happy Learners" },
        ].map((stat, i) => (
          <div
            key={i}
            className={`p-6 text-center ${i < 3 ? "border-r border-foreground/20" : ""}`}
          >
            <span className="font-heading text-3xl md:text-4xl font-light text-foreground">
              {stat.number}
            </span>
            <p className="font-body text-xs tracking-widest uppercase text-muted-foreground mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
