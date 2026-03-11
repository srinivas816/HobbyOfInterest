import { Target, Lightbulb, Zap, Users, BookOpen, Globe } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import StaggerChildren, { StaggerItem } from "./StaggerChildren";

const skills = [
  {
    icon: Target,
    title: "Expert Mentorship",
    description: "Learn from real practitioners who've mastered their craft over years of dedicated practice.",
  },
  {
    icon: Lightbulb,
    title: "Creative Freedom",
    description: "Unlock your artistic potential through hands-on projects with personalized guidance.",
  },
  {
    icon: Zap,
    title: "Flexible Learning",
    description: "Learn at your own pace — online, in-person, or hybrid. Fit classes around your life.",
  },
  {
    icon: Users,
    title: "Community",
    description: "Join a supportive network of fellow learners who share your passion for creating.",
  },
  {
    icon: BookOpen,
    title: "Structured Curriculum",
    description: "Follow clear learning paths from beginner to advanced with measurable progress.",
  },
  {
    icon: Globe,
    title: "Global Access",
    description: "Connect with instructors and students from around the world, anytime.",
  },
];

const SkillsSection = () => {
  return (
    <section id="skills" className="section-dark overflow-hidden">
      <div className="container mx-auto px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left */}
          <div>
            <ScrollReveal direction="left">
              <span className="font-body text-xs tracking-[0.25em] uppercase text-accent font-medium">
                Why choose us
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-dark-foreground leading-[1.05] mt-4">
                Get the skills you need for a hobby that fulfills<span className="text-accent">.</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="left" delay={0.15}>
              <p className="font-body text-sm sm:text-base text-dark-muted mt-6 max-w-md leading-relaxed">
                The modern world demands digital output. Your hands crave analog input. Our classes bridge that gap with structured instruction from real practitioners.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.3}>
              <div className="flex flex-wrap gap-0 mt-10 md:mt-12 w-fit">
                <div className="px-6 sm:px-8 py-5 sm:py-6 border border-dark-border rounded-l-2xl text-center">
                  <span className="font-heading text-4xl sm:text-5xl font-light text-accent">10</span>
                  <p className="font-body text-[10px] sm:text-xs tracking-widest uppercase text-dark-muted mt-2">Years<br />experience</p>
                </div>
                <div className="px-6 sm:px-8 py-5 sm:py-6 border border-dark-border border-l-0 text-center">
                  <span className="font-heading text-4xl sm:text-5xl font-light text-accent">250</span>
                  <p className="font-body text-[10px] sm:text-xs tracking-widest uppercase text-dark-muted mt-2">Types of<br />courses</p>
                </div>
                <div className="px-6 sm:px-8 py-5 sm:py-6 border border-dark-border border-l-0 rounded-r-2xl text-center">
                  <span className="font-heading text-4xl sm:text-5xl font-light text-accent">98%</span>
                  <p className="font-body text-[10px] sm:text-xs tracking-widest uppercase text-dark-muted mt-2">Student<br />satisfaction</p>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right: Skills grid */}
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
