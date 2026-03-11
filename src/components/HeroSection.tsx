import { useState } from "react";
import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";
import heroPottery from "@/assets/hero-pottery.jpg";
import heroPainting from "@/assets/hero-painting.jpg";
import heroFloristry from "@/assets/hero-floristry.jpg";

const heroImages = [
  { src: heroPottery, label: "Pottery", category: "Ceramics", topics: "45" },
  { src: heroPainting, label: "Painting", category: "Fine Art", topics: "60" },
  { src: heroFloristry, label: "Floristry", category: "Botanical", topics: "30" },
];

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <section className="hero-gradient overflow-hidden">
      <div className="container mx-auto px-6 pt-12 pb-16 md:pt-20 md:pb-28 lg:pt-24 lg:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left: Headline + Search */}
          <div>
            <ScrollReveal direction="up" delay={0}>
              <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-light leading-[0.92] tracking-tight text-foreground">
                Explore.<br />
                Create.<br />
                Grow<span className="text-accent">.</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.15}>
              <p className="font-body text-base sm:text-lg text-muted-foreground mt-6 max-w-md leading-relaxed">
                Discover hundreds of hands-on classes taught by passionate instructors. From pottery to guitar — find your next creative obsession.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.25}>
              <div className="mt-8 flex overflow-hidden rounded-xl shadow-xl bg-background border border-border/40">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find your passion — pottery, guitar, baking..."
                  className="flex-1 min-w-0 px-4 sm:px-6 py-4 sm:py-5 font-body text-sm bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
                />
                <button className="bg-accent text-accent-foreground px-6 sm:px-8 py-4 sm:py-5 font-heading text-base sm:text-lg font-semibold hover:brightness-110 transition-all duration-300 flex-shrink-0">
                  Go
                </button>
              </div>
            </ScrollReveal>
          </div>

          {/* Right: Hero Image Cards */}
          <div className="flex gap-3 sm:gap-4 h-[320px] sm:h-[380px] md:h-[420px] lg:h-[520px]">
            {heroImages.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 60, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.8,
                  delay: 0.3 + i * 0.15,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className={`relative overflow-hidden rounded-2xl sm:rounded-3xl group cursor-pointer transition-all duration-500 ${
                  i === 0 ? "flex-[2]" : "flex-1"
                }`}
              >
                <img
                  src={img.src}
                  alt={img.label}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5">
                  {i === 0 ? (
                    <>
                      <span className="font-body text-[10px] sm:text-xs tracking-widest uppercase text-background/60">
                        {img.category}
                      </span>
                      <p className="font-heading text-lg sm:text-2xl text-background mt-1">
                        {img.label}
                      </p>
                      <div className="flex items-baseline gap-2 mt-1 sm:mt-2">
                        <span className="font-heading text-2xl sm:text-3xl font-light text-background">{img.topics}</span>
                        <span className="font-body text-[10px] sm:text-xs uppercase tracking-widest text-background/60">Topics</span>
                      </div>
                    </>
                  ) : (
                    <p className="font-heading text-sm sm:text-lg text-background [writing-mode:vertical-lr] rotate-180 mb-2">
                      {img.label}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
