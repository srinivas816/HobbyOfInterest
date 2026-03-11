import { Target, Lightbulb, Zap } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import StaggerChildren, { StaggerItem } from "./StaggerChildren";

const skills = [
  {
    icon: Target,
    title: "Leadership",
    description: "Fully committed to helping you master your chosen craft with structured mentorship.",
  },
  {
    icon: Lightbulb,
    title: "Creativity",
    description: "Unlock your artistic potential through hands-on practice with expert guidance.",
  },
  {
    icon: Zap,
    title: "Flexibility",
    description: "Learn at your own pace — online, in-person, or hybrid. The choice is yours.",
  },
];

const SkillsSection = () => {
  return (
    <section id="skills" className="section-dark overflow-hidden">
      <div className="container mx-auto px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div>
            <ScrollReveal direction="left">
              <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-dark-foreground leading-[1.05]">
                Get the skills you need for a hobby that fulfills<span className="text-accent">.</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="left" delay={0.15}>
              <p className="font-body text-base text-dark-muted mt-6 max-w-md leading-relaxed">
                The modern world demands digital output. Your hands crave analog input. Our classes bridge that gap with structured instruction from real practitioners.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.3}>
              <div className="flex gap-0 mt-12 w-fit">
                <div className="px-8 py-6 border border-dark-border rounded-l-2xl text-center">
                  <span className="font-heading text-5xl font-light text-accent">10</span>
                  <p className="font-body text-xs tracking-widest uppercase text-dark-muted mt-2">Years<br />experience</p>
                </div>
                <div className="px-8 py-6 border border-dark-border border-l-0 rounded-r-2xl text-center">
                  <span className="font-heading text-5xl font-light text-accent">250</span>
                  <p className="font-body text-xs tracking-widest uppercase text-dark-muted mt-2">Types of<br />courses</p>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right: Skills list */}
          <StaggerChildren className="space-y-5" staggerDelay={0.15}>
            {skills.map((skill, i) => (
              <StaggerItem key={i}>
                <div className="rounded-2xl border border-dark-border p-7 flex gap-6 items-start group hover:border-accent/50 transition-all duration-500 cursor-default bg-dark/50 backdrop-blur-sm">
                  <div className="w-14 h-14 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/25 group-hover:scale-110 transition-all duration-300">
                    <skill.icon size={24} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl text-dark-foreground">{skill.title}</h3>
                    <p className="font-body text-sm text-dark-muted mt-2 leading-relaxed">
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
