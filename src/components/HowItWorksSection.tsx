import { Search, CalendarCheck, Sparkles } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import StaggerChildren, { StaggerItem } from "./StaggerChildren";

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Discover locally",
    description: "Browse classes by city, hobby type, fee range, and timing — from weekend pottery in Bengaluru to dance batches in Chennai.",
    color: "bg-primary/10 text-primary",
    borderColor: "border-primary/20 hover:border-primary/40",
  },
  {
    icon: CalendarCheck,
    step: "02",
    title: "Book your format",
    description: "Choose what fits Indian routines best: weekday evenings, weekend workshops, in-person studio sessions, or live online classes.",
    color: "bg-accent/10 text-accent",
    borderColor: "border-accent/20 hover:border-accent/40",
  },
  {
    icon: Sparkles,
    step: "03",
    title: "Build a habit",
    description: "Learn with community support, repeat-friendly schedules, and creator-led guidance that can stay a hobby or become a side income.",
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
              How it works in India
            </span>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-foreground mt-4">
              A simple flow built for metro schedules and local discovery<span className="text-accent">.</span>
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
