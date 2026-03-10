import { Palette, Hammer, Flame } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import StaggerChildren, { StaggerItem } from "./StaggerChildren";

const skills = [
  {
    icon: Palette,
    title: "Creativity",
    description: "Unlock your artistic potential through hands-on practice with expert guidance.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Hammer,
    title: "Craftsmanship",
    description: "Learn the patience and precision that transforms raw materials into art.",
    color: "bg-accent text-foreground",
  },
  {
    icon: Flame,
    title: "Passion",
    description: "Discover what lights you up — and build a practice around it.",
    color: "bg-primary/10 text-primary",
  },
];

const SkillsSection = () => {
  return (
    <section id="skills" className="section-divider bg-secondary/30">
      <div className="container mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div>
            <ScrollReveal direction="left">
              <h2 className="font-heading text-3xl md:text-5xl font-light text-foreground leading-tight">
                Get the skills you need for a hobby that fulfills<span className="text-primary">.</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="left" delay={0.15}>
              <p className="font-body text-base text-muted-foreground mt-6 max-w-md leading-relaxed">
                Modern life demands digital output. Your hands crave analog input. Our classes bridge that gap with structured instruction from real practitioners.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.3}>
              <div className="flex gap-0 mt-10 rounded-xl overflow-hidden w-fit bg-card shadow-sm border border-border/40">
                <div className="px-8 py-6 border-r border-border/40 text-center">
                  <span className="font-heading text-4xl font-light text-primary">10</span>
                  <p className="font-body text-xs tracking-widest uppercase text-muted-foreground mt-1">Years<br />experience</p>
                </div>
                <div className="px-8 py-6 text-center">
                  <span className="font-heading text-4xl font-light text-primary">250</span>
                  <p className="font-body text-xs tracking-widest uppercase text-muted-foreground mt-1">Types of<br />courses</p>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right: Skills list */}
          <StaggerChildren className="space-y-4" staggerDelay={0.15}>
            {skills.map((skill, i) => (
              <StaggerItem key={i}>
                <div className="rounded-xl bg-card p-6 flex gap-5 items-start group hover:shadow-md transition-all duration-300 cursor-default border border-border/30">
                  <div className={`w-12 h-12 rounded-lg ${skill.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <skill.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl text-foreground">{skill.title}</h3>
                    <p className="font-body text-sm text-muted-foreground mt-1 leading-relaxed">
                      {skill.description}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
