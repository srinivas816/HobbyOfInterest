import { Search, CalendarCheck, Sparkles } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import StaggerChildren, { StaggerItem } from "./StaggerChildren";

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Discover",
    description: "Browse hundreds of classes across crafts, arts, music, culinary, and wellness. Filter by location, schedule, or skill level.",
    color: "bg-primary/10 text-primary",
    borderColor: "border-primary/20 hover:border-primary/40",
  },
  {
    icon: CalendarCheck,
    step: "02",
    title: "Enroll",
    description: "Book your spot instantly. Choose between in-person workshops, live online sessions, or self-paced video courses.",
    color: "bg-accent/10 text-accent",
    borderColor: "border-accent/20 hover:border-accent/40",
  },
  {
    icon: Sparkles,
    step: "03",
    title: "Create",
    description: "Learn from expert instructors, build real projects, and join a community of passionate makers and creators.",
    color: "bg-primary/10 text-primary",
    borderColor: "border-primary/20 hover:border-primary/40",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="bg-background">
      <div className="container mx-auto px-6 py-20 md:py-28">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto">
            <span className="font-body text-xs tracking-[0.25em] uppercase text-accent font-medium">
              How it works
            </span>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-foreground mt-4">
              Three steps to your new hobby<span className="text-accent">.</span>
            </h2>
          </div>
        </ScrollReveal>

        <StaggerChildren
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-16"
          staggerDelay={0.15}
        >
          {steps.map((step, i) => (
            <StaggerItem key={i}>
              <div className={`relative rounded-3xl border ${step.borderColor} p-8 md:p-10 transition-all duration-500 group bg-card h-full`}>
                {/* Step number */}
                <span className="font-heading text-7xl font-light text-foreground/[0.06] absolute top-6 right-8 select-none">
                  {step.step}
                </span>

                <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon size={24} />
                </div>

                <h3 className="font-heading text-2xl text-foreground">{step.title}</h3>
                <p className="font-body text-sm text-muted-foreground mt-3 leading-relaxed">
                  {step.description}
                </p>

                {/* Connecting line for desktop */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 md:-right-5 w-8 md:w-10 h-[1px] bg-border z-10" />
                )}
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
};

export default HowItWorksSection;
