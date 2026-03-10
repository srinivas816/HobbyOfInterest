import { Palette, Hammer, Flame } from "lucide-react";

const skills = [
  {
    icon: Palette,
    title: "Creativity",
    description: "Unlock your artistic potential through hands-on practice with expert guidance.",
  },
  {
    icon: Hammer,
    title: "Craftsmanship",
    description: "Learn the patience and precision that transforms raw materials into art.",
  },
  {
    icon: Flame,
    title: "Passion",
    description: "Discover what lights you up — and build a practice around it.",
  },
];

const SkillsSection = () => {
  return (
    <section id="skills" className="section-divider">
      <div className="container mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div>
            <h2 className="font-heading text-3xl md:text-5xl font-light text-foreground leading-tight">
              Get the skills you need for a hobby that fulfills<span className="text-primary">.</span>
            </h2>
            <p className="font-body text-base text-muted-foreground mt-6 max-w-md leading-relaxed">
              Modern life demands digital output. Your hands crave analog input. Our classes bridge that gap with structured instruction from real practitioners.
            </p>

            <div className="flex gap-0 mt-10 border-architectural w-fit">
              <div className="px-8 py-6 border-r border-foreground/20 text-center">
                <span className="font-heading text-4xl font-light text-foreground">10</span>
                <p className="font-body text-xs tracking-widest uppercase text-muted-foreground mt-1">Years<br />experience</p>
              </div>
              <div className="px-8 py-6 text-center">
                <span className="font-heading text-4xl font-light text-foreground">250</span>
                <p className="font-body text-xs tracking-widest uppercase text-muted-foreground mt-1">Types of<br />courses</p>
              </div>
            </div>
          </div>

          {/* Right: Skills list */}
          <div className="space-y-0">
            {skills.map((skill, i) => (
              <div
                key={i}
                className="border-architectural p-6 flex gap-5 items-start group hover:bg-secondary/50 transition-colors cursor-default"
              >
                <div className="w-12 h-12 border-architectural flex items-center justify-center flex-shrink-0 group-hover:bg-foreground group-hover:text-background transition-colors">
                  <skill.icon size={20} />
                </div>
                <div>
                  <h3 className="font-heading text-xl text-foreground">{skill.title}</h3>
                  <p className="font-body text-sm text-muted-foreground mt-1 leading-relaxed">
                    {skill.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
