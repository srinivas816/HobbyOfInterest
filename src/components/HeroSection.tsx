import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";
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
          <ScrollReveal direction="up" delay={0}>
            <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-light leading-[0.95] tracking-tight text-foreground">
              Explore.<br />
              Create.<br />
              Grow<span className="text-primary">.</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.15}>
            <p className="font-body text-base text-muted-foreground mt-6 max-w-md leading-relaxed">
              Discover local and online hobby classes taught by passionate artisans. From pottery to painting — find your next obsession.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.3}>
            <div className="mt-8 flex border-architectural overflow-hidden rounded-lg shadow-lg">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find your passion"
                className="flex-1 px-5 py-4 font-body text-sm bg-background text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button className="bg-primary text-primary-foreground px-6 py-4 font-body text-sm font-medium hover:opacity-90 transition-all duration-300 flex items-center gap-2 hover:gap-3">
                Go <ArrowRight size={16} />
              </button>
            </div>
          </ScrollReveal>
        </div>

        {/* Right: Hero Image Cards */}
        <div className="flex gap-4 h-[400px] md:h-[500px]">
          {heroImages.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.7,
                delay: 0.2 + i * 0.15,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className={`relative overflow-hidden rounded-2xl group cursor-pointer transition-all duration-500 ${
                i === 0 ? "flex-[2]" : "flex-1"
              }`}
            >
              <img
                src={img.src}
                alt={img.label}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                <span className="font-body text-xs tracking-widest uppercase text-background/70">
                  {img.category}
                </span>
                <p className="font-heading text-lg text-background mt-0.5">
                  {img.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <ScrollReveal direction="up" delay={0.4}>
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-0 rounded-xl overflow-hidden bg-card shadow-sm border border-border/40">
          {[
            { number: "100+", label: "Hobby Classes" },
            { number: "50+", label: "Expert Instructors" },
            { number: "12", label: "Categories" },
            { number: "5k+", label: "Happy Learners" },
          ].map((stat, i) => (
            <div
              key={i}
              className={`p-6 text-center ${i < 3 ? "border-r border-border/40" : ""}`}
            >
              <span className="font-heading text-3xl md:text-4xl font-light text-primary">
                {stat.number}
              </span>
              <p className="font-body text-xs tracking-widest uppercase text-muted-foreground mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
};

export default HeroSection;
