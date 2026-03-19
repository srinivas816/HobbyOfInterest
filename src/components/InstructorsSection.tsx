import ScrollReveal from "./ScrollReveal";
import StaggerChildren, { StaggerItem } from "./StaggerChildren";
import heroPottery from "@/assets/hero-pottery.jpg";
import heroPainting from "@/assets/hero-painting.jpg";
import heroFloristry from "@/assets/hero-floristry.jpg";
import categoryMusic from "@/assets/category-music.jpg";

const instructors = [
  { name: "Ananya R.", specialty: "Pottery & Ceramics", image: heroPottery, students: 1240, rating: 4.9, classes: 24 },
  { name: "Chef Rhea M.", specialty: "Baking & Pastry", image: heroFloristry, students: 2100, rating: 4.8, classes: 18 },
  { name: "Arjun D.", specialty: "Guitar & Music", image: categoryMusic, students: 890, rating: 4.9, classes: 32 },
  { name: "Devika S.", specialty: "Painting & Mixed Media", image: heroPainting, students: 650, rating: 4.7, classes: 15 },
];

const InstructorsSection = () => (
  <section className="bg-background">
    <div className="container mx-auto px-6 py-20 md:py-28">
      <ScrollReveal>
        <div className="text-center max-w-2xl mx-auto">
          <span className="font-body text-xs tracking-[0.25em] uppercase text-accent font-medium">
            Meet our instructors
          </span>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-foreground mt-4">
            Learn from passionate experts<span className="text-accent">.</span>
          </h2>
          <p className="font-body text-sm sm:text-base text-muted-foreground mt-4">
            Every instructor is vetted for expertise, teaching quality, and student satisfaction.
          </p>
        </div>
      </ScrollReveal>

      <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14" staggerDelay={0.1}>
        {instructors.map((inst, i) => (
          <StaggerItem key={i}>
            <div className="group cursor-pointer">
              <div className="aspect-[3/4] overflow-hidden rounded-2xl relative">
                <img src={inst.image} alt={inst.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="font-heading text-xl text-background">{inst.name}</p>
                  <p className="font-body text-xs text-background/70 mt-1">{inst.specialty}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="font-body text-xs text-background/80">★ {inst.rating}</span>
                    <span className="font-body text-xs text-background/60">{inst.students.toLocaleString()} students</span>
                    <span className="font-body text-xs text-background/60">{inst.classes} classes</span>
                  </div>
                </div>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerChildren>

      <ScrollReveal delay={0.2}>
        <div className="text-center mt-12">
          <button className="inline-flex items-center gap-2 font-body text-sm text-foreground border border-border px-8 py-3.5 rounded-full hover:border-foreground hover:bg-foreground hover:text-background transition-all duration-300">
            View All Instructors
          </button>
        </div>
      </ScrollReveal>
    </div>
  </section>
);

export default InstructorsSection;
