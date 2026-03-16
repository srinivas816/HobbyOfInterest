import { Target, Lightbulb, Zap, Users, BookOpen, Globe } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import StaggerChildren, { StaggerItem } from "./StaggerChildren";

const skills = [
  {
    icon: Target,
    title: "City-first discovery",
    description: "Surface hobbies by metro, neighborhood relevance, and commute-friendly schedules instead of generic global browsing.",
  },
  {
    icon: Lightbulb,
    title: "Cultural relevance",
    description: "Blend modern hobbies with Indian creative traditions like folk art, dance, home baking, and festive decor making.",
  },
  {
    icon: Zap,
    title: "After-work formats",
    description: "Design for weekday evenings, weekends, and short intensives that fit how Indian learners actually make time.",
  },
  {
    icon: Users,
    title: "Community-led retention",
    description: "Group batches, referrals, and social proof matter more in local hobby decisions and repeat enrollment.",
  },
  {
    icon: BookOpen,
    title: "Side-income potential",
    description: "Many maker skills can evolve into pop-ups, workshops, gifting businesses, and creator-led teaching paths.",
  },
  {
    icon: Globe,
    title: "Multilingual reach",
    description: "English-first with multilingual support improves adoption for both learners and instructors across regions.",
  },
];

const SkillsSection = () => {
  return (
    <section id="skills" className="section-dark overflow-hidden">
      <div className="container mx-auto px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div>
            <ScrollReveal direction="left">
              <span className="font-body text-xs tracking-[0.25em] uppercase text-accent font-medium">
                India market analysis
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-dark-foreground leading-[1.05] mt-4">
                What makes a hobby marketplace work better in India<span className="text-accent">.</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="left" delay={0.15}>
              <p className="font-body text-sm sm:text-base text-dark-muted mt-6 max-w-md leading-relaxed">
                The strongest opportunity is not just hobby inspiration — it is structured discovery for urban learners who want trusted, nearby, affordable, and repeat-friendly experiences.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.3}>
              <div className="flex flex-wrap gap-0 mt-10 md:mt-12 w-fit">
                <div className="px-6 sm:px-8 py-5 sm:py-6 border border-dark-border rounded-l-2xl text-center">
                  <span className="font-heading text-4xl sm:text-5xl font-light text-accent">6</span>
                  <p className="font-body text-[10px] sm:text-xs tracking-widest uppercase text-dark-muted mt-2">Priority<br />metros</p>
                </div>
                <div className="px-6 sm:px-8 py-5 sm:py-6 border border-dark-border border-l-0 text-center">
                  <span className="font-heading text-4xl sm:text-5xl font-light text-accent">₹699</span>
                  <p className="font-body text-[10px] sm:text-xs tracking-widest uppercase text-dark-muted mt-2">Entry paid<br />membership</p>
                </div>
                <div className="px-6 sm:px-8 py-5 sm:py-6 border border-dark-border border-l-0 rounded-r-2xl text-center">
                  <span className="font-heading text-4xl sm:text-5xl font-light text-accent">2x</span>
                  <p className="font-body text-[10px] sm:text-xs tracking-widest uppercase text-dark-muted mt-2">Higher intent with<br />city-led discovery</p>
                </div>
              </div>
            </ScrollReveal>
          </div>

          <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 gap-4" staggerDelay={0.1}>
            {skills.map((skill, i) => (
              <StaggerItem key={i}>
                <div className="rounded-2xl border border-dark-border p-5 sm:p-6 group hover:border-accent/50 transition-all duration-500 cursor-default bg-dark/50 backdrop-blur-sm h-full">
                  <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/25 group-hover:scale-110 transition-all duration-300 mb-4">
                    <skill.icon size={20} className="text-accent" />
                  </div>
                  <h3 className="font-heading text-lg text-dark-foreground">{skill.title}</h3>
                  <p className="font-body text-xs sm:text-sm text-dark-muted mt-2 leading-relaxed">
                    {skill.description}
                  </p>
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
