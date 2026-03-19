import { Search, CalendarCheck, Sparkles, Monitor } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import StaggerChildren, { StaggerItem } from "./StaggerChildren";

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Discover classes",
    description: "Browse by hobby, location, format, or schedule. Find in-person studios near you or join live online sessions from anywhere.",
    color: "bg-primary/10 text-primary",
    borderColor: "border-primary/20 hover:border-primary/40",
  },
  {
    icon: CalendarCheck,
    step: "02",
    title: "Book your spot",
    description: "Choose what fits your lifestyle — weekday evenings, weekend workshops, intensive bootcamps, or flexible self-paced courses.",
    color: "bg-accent/10 text-accent",
    borderColor: "border-accent/20 hover:border-accent/40",
  },
  {
    icon: Monitor,
    step: "03",
    title: "Learn live or on-demand",
    description: "Attend live classes with real-time instructor interaction, or access recorded sessions anytime on any device.",
    color: "bg-primary/10 text-primary",
    borderColor: "border-primary/20 hover:border-primary/40",
  },
  {
    icon: Sparkles,
    step: "04",
    title: "Track & grow",
    description: "Earn certificates, build a creator portfolio, track learning streaks, and even start teaching your own classes.",
    color: "bg-accent/10 text-accent",
    borderColor: "border-accent/20 hover:border-accent/40",
  },
];

const HowItWorksSection = () => (
  <section id="how-it-works" className="bg-background">
    <div className="container mx-auto px-6 py-20 md:py-28">
      <ScrollReveal>
        <div className="text-center max-w-2xl mx-auto">
          <span className="font-body text-xs tracking-[0.25em] uppercase text-accent font-medium">
            How it works
          </span>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-foreground mt-4">
            From discovery to mastery in four simple steps<span className="text-accent">.</span>
          </h2>
        </div>
      </ScrollReveal>

      <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mt-16" staggerDelay={0.12}>
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
              <p className="font-body text-sm text-muted-foreground mt-3 leading-relaxed">{step.description}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 lg:-right-5 w-8 lg:w-10 h-[1px] bg-border z-10" />
              )}
            </div>
          </StaggerItem>
        ))}
      </StaggerChildren>
    </div>
  </section>
);

export default HowItWorksSection;
