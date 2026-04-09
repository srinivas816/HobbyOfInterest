import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { mvpInstructorFocus } from "@/lib/productFocus";
import ScrollReveal from "./ScrollReveal";
import heroPottery from "@/assets/hero-pottery.jpg";
import heroPainting from "@/assets/hero-painting.jpg";
import heroFloristry from "@/assets/hero-floristry.jpg";

const heroImages = [
  { src: heroPottery, label: "Pottery", category: "Studio Classes", topics: "120+", rating: "4.9" },
  { src: heroPainting, label: "Painting", category: "Art & Craft", topics: "48" },
  { src: heroFloristry, label: "Floristry", category: "Weekend Hobby", topics: "35" },
];

const trendingSearches = [
  "Pottery near me",
  "Online baking class",
  "Weekend photography",
  "Guitar for beginners",
  "Dance classes online",
];

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const mvp = mvpInstructorFocus();

  const goSearch = () => {
    const q = searchQuery.trim();
    navigate(q ? `/courses?q=${encodeURIComponent(q)}` : "/courses");
  };

  return (
    <section className="hero-gradient overflow-hidden">
      <div className="container mx-auto pt-12 pb-16 md:pt-20 md:pb-28 lg:pt-24 lg:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <ScrollReveal direction="up" delay={0}>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-2 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                </span>
                <span className="font-body text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  10,000+ learners worldwide
                </span>
              </div>
              <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-[5.4rem] font-light leading-[0.92] tracking-tight text-foreground mt-6">
                {mvp && !user ? (
                  <>
                    Run your hobby class — invites, attendance, fees<span className="text-accent">.</span>
                  </>
                ) : (
                  <>
                    Learn any hobby, anywhere — online or in&#8209;person<span className="text-accent">.</span>
                  </>
                )}
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.15}>
              <p className="font-body text-base sm:text-lg text-muted-foreground mt-6 max-w-xl leading-relaxed">
                {mvp && !user ? (
                  <>
                    One place for tutors: create a batch, share a join link or WhatsApp it to parents, mark who showed up, and track monthly
                    fees. Students join with your invite — no marketplace hunt required.
                  </>
                ) : (
                  <>
                    Discover weekend workshops, evening batches, live online classes, and self-paced courses across pottery, art, baking, music,
                    dance, photography, and more.
                  </>
                )}
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.25}>
              {mvp && !user ? (
                <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
                  <Link
                    to={`/login?next=${encodeURIComponent("/instructor/home")}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background px-6 py-3.5 text-sm font-medium hover:opacity-90 transition-opacity text-center"
                  >
                    <Sparkles size={16} />
                    Create your class — start free
                  </Link>
                  <Link
                    to="/login?next=/learn"
                    className="inline-flex items-center justify-center rounded-full border border-border/70 px-6 py-3.5 text-sm text-foreground hover:bg-muted/40 transition-colors text-center"
                  >
                    I’m a student — log in
                  </Link>
                </div>
              ) : (
                <div className="mt-8 flex overflow-hidden rounded-2xl shadow-xl bg-background border border-border/40">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && goSearch()}
                    placeholder="Search pottery classes, online baking, guitar lessons..."
                    className="flex-1 min-w-0 px-4 sm:px-6 py-4 sm:py-5 font-body text-sm bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  <button
                    type="button"
                    onClick={goSearch}
                    className="bg-accent text-accent-foreground px-6 sm:px-8 py-4 sm:py-5 font-heading text-base sm:text-lg font-semibold hover:brightness-110 transition-all duration-300 flex-shrink-0"
                  >
                    Explore
                  </button>
                </div>
              )}
              {user?.role === "INSTRUCTOR" ? (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link
                    to="/instructor/home"
                    className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <Sparkles size={16} />
                    Teaching home
                  </Link>
                  <Link
                    to="/instructor/activate"
                    className="inline-flex items-center gap-2 rounded-full border border-border/70 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
                  >
                    New class
                  </Link>
                  <span className="font-body text-xs text-muted-foreground max-w-xs">
                    {mvp
                      ? "Invites and roster live under each class. Curriculum and publishing: More → Manage content."
                      : "Daily teaching uses Home and Classes. Heavy editing lives under More → Manage content."}
                  </span>
                </div>
              ) : null}
              {!mvp ? (
                <div className="flex flex-wrap gap-2 mt-4">
                  {trendingSearches.map((item) => (
                    <button
                      key={item}
                      onClick={() => setSearchQuery(item)}
                      className="rounded-full border border-border bg-background/70 px-3 py-2 font-body text-xs text-muted-foreground transition-colors hover:text-foreground hover:border-foreground/40"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : null}
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.35}>
              <div className={`grid grid-cols-3 gap-3 mt-8 max-w-xl${mvp && !user ? " hidden lg:grid" : ""}`}>
                {[
                  ["500+", "Classes available"],
                  ["50+ Cities", "& fully online"],
                  ["4.8 ★", "Avg instructor rating"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-border/60 bg-background/60 p-4 backdrop-blur-sm">
                    <p className="font-heading text-xl sm:text-2xl text-foreground">{value}</p>
                    <p className="font-body text-[11px] sm:text-xs text-muted-foreground mt-1 leading-relaxed">{label}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

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
                      <div className="flex items-center gap-3 mt-1 sm:mt-2">
                        <span className="font-heading text-2xl sm:text-3xl font-light text-background">{img.topics}</span>
                        <span className="font-body text-[10px] sm:text-xs uppercase tracking-widest text-background/60">Live classes</span>
                      </div>
                      {img.rating && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <Star size={12} className="text-accent fill-accent" />
                          <span className="font-body text-xs text-background/80">{img.rating} avg rating</span>
                        </div>
                      )}
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
