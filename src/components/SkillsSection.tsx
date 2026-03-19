import { Target, Lightbulb, Zap, Users, BookOpen, Globe, Shield, Award } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import StaggerChildren, { StaggerItem } from "./StaggerChildren";

const features = [
  {
    icon: Globe,
    title: "Online & in-person",
    description: "Join live classes from home or attend studio workshops in 50+ cities. Switch formats anytime.",
  },
  {
    icon: Target,
    title: "Smart discovery",
    description: "Find classes by hobby, budget, schedule, and difficulty level. Our algorithm learns what you like.",
  },
  {
    icon: Zap,
    title: "Flexible scheduling",
    description: "Weekday evenings, weekends, intensives, or self-paced — pick what fits your lifestyle.",
  },
  {
    icon: Users,
    title: "Community cohorts",
    description: "Learn with peers in small batch groups. Get feedback, share progress, and stay accountable.",
  },
  {
    icon: BookOpen,
    title: "Creator tools",
    description: "Instructors get listing management, student analytics, waitlists, and marketing tools built in.",
  },
  {
    icon: Shield,
    title: "Verified instructors",
    description: "Every instructor is vetted for expertise and teaching quality. Read reviews before you book.",
  },
  {
    icon: Lightbulb,
    title: "Progress tracking",
    description: "Earn badges, track streaks, get certificates, and build a portfolio of your creative journey.",
  },
  {
    icon: Award,
    title: "Money-back guarantee",
    description: "Not satisfied after your first session? Get a full refund, no questions asked.",
  },
];

const SkillsSection = () => (
  <section id="features" className="section-dark overflow-hidden">
    <div className="container mx-auto px-6 py-20 md:py-28">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        <div>
          <ScrollReveal direction="left">
            <span className="font-body text-xs tracking-[0.25em] uppercase text-accent font-medium">
              Platform features
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-dark-foreground leading-[1.05] mt-4">
              Everything you need to learn, teach, and grow<span className="text-accent">.</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal direction="left" delay={0.15}>
            <p className="font-body text-sm sm:text-base text-dark-muted mt-6 max-w-md leading-relaxed">
              Whether you're a beginner picking your first hobby or an instructor building a teaching business — the platform adapts to you.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.3}>
            <div className="flex flex-wrap gap-0 mt-10 md:mt-12 w-fit">
              <div className="px-6 sm:px-8 py-5 sm:py-6 border border-dark-border rounded-l-2xl text-center">
                <span className="font-heading text-4xl sm:text-5xl font-light text-accent">50+</span>
                <p className="font-body text-[10px] sm:text-xs tracking-widest uppercase text-dark-muted mt-2">Cities<br />covered</p>
              </div>
              <div className="px-6 sm:px-8 py-5 sm:py-6 border border-dark-border border-l-0 text-center">
                <span className="font-heading text-4xl sm:text-5xl font-light text-accent">Free</span>
                <p className="font-body text-[10px] sm:text-xs tracking-widest uppercase text-dark-muted mt-2">To start<br />exploring</p>
              </div>
              <div className="px-6 sm:px-8 py-5 sm:py-6 border border-dark-border border-l-0 rounded-r-2xl text-center">
                <span className="font-heading text-4xl sm:text-5xl font-light text-accent">2x</span>
                <p className="font-body text-[10px] sm:text-xs tracking-widest uppercase text-dark-muted mt-2">Higher completion<br />vs self-study</p>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 gap-4" staggerDelay={0.08}>
          {features.map((feature, i) => (
            <StaggerItem key={i}>
              <div className="rounded-2xl border border-dark-border p-5 sm:p-6 group hover:border-accent/50 transition-all duration-500 cursor-default bg-dark/50 backdrop-blur-sm h-full">
                <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/25 group-hover:scale-110 transition-all duration-300 mb-4">
                  <feature.icon size={20} className="text-accent" />
                </div>
                <h3 className="font-heading text-lg text-dark-foreground">{feature.title}</h3>
                <p className="font-body text-xs sm:text-sm text-dark-muted mt-2 leading-relaxed">{feature.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </div>
  </section>
);

export default SkillsSection;
