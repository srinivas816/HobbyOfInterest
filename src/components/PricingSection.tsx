import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import StaggerChildren, { StaggerItem } from "./StaggerChildren";

const plans = [
  {
    name: "Explorer",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Start discovering hobbies and attend free trial sessions",
    features: [
      "Browse all classes & instructors",
      "Save favorites and wishlists",
      "Community recommendations",
      "1 free trial class per month",
      "Basic progress tracking",
    ],
    cta: "Get Started Free",
    popular: false,
    style: "bg-card border-border/50",
  },
  {
    name: "Creator Plus",
    monthlyPrice: 799,
    yearlyPrice: 6499,
    description: "For hobby learners who want unlimited access and premium features",
    features: [
      "Unlimited live & recorded classes (when billing ships)",
      "Priority booking for popular sessions (roadmap)",
      "Learning streaks & certificates (roadmap)",
      "Community cohort access (roadmap)",
      "Instructor messaging (roadmap)",
      "Exclusive workshops & events (roadmap)",
      "Lesson progress & Continue learning (live today)",
    ],
    cta: "Start 7-Day Free Trial",
    popular: true,
    style: "bg-dark text-dark-foreground border-dark-border",
  },
  {
    name: "Instructor Pro",
    monthlyPrice: 1999,
    yearlyPrice: 16499,
    description: "For creators and studios who want to teach and grow their business",
    features: [
      "Unlimited class listings",
      "Student management dashboard",
      "Waitlist & lead capture tools",
      "Revenue analytics & insights",
      "Verified instructor badge",
      "Marketing & promotion tools",
      "Priority support",
    ],
    cta: "Start Teaching",
    popular: false,
    style: "bg-card border-border/50",
  },
];

const formatRupees = (n: number) =>
  n === 0 ? "0" : `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const PricingSection = () => {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="section-warm">
      <div className="container mx-auto py-20 md:py-28">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto">
            <span className="font-body text-xs tracking-[0.25em] uppercase text-accent font-medium">Simple pricing</span>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-foreground mt-4">
              Plans that grow with your creative journey<span className="text-accent">.</span>
            </h2>
            <p className="font-body text-sm text-muted-foreground mt-4">Prices in INR. Start free. Upgrade when you&apos;re ready. Cancel anytime.</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="flex items-center justify-center gap-4 mt-10">
            <span className={`font-body text-sm transition-colors ${!annual ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
            <button
              type="button"
              onClick={() => setAnnual(!annual)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${annual ? "bg-accent" : "bg-border"}`}
            >
              <div
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-background shadow-md transition-transform duration-300 ${
                  annual ? "translate-x-7" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className={`font-body text-sm transition-colors ${annual ? "text-foreground" : "text-muted-foreground"}`}>
              Annual
              <span className="ml-1.5 text-xs text-accent font-medium">Save ~30%</span>
            </span>
          </div>
        </ScrollReveal>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14 items-start" staggerDelay={0.12}>
          {plans.map((plan, i) => (
            <StaggerItem key={i}>
              <div className={`relative rounded-3xl border p-8 md:p-9 ${plan.style} transition-all duration-500 hover:shadow-xl h-full flex flex-col`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-8 bg-accent text-accent-foreground font-body text-xs font-medium px-4 py-1.5 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className={`font-heading text-2xl ${plan.popular ? "text-dark-foreground" : "text-foreground"}`}>{plan.name}</h3>
                <p className={`font-body text-sm mt-2 ${plan.popular ? "text-dark-muted" : "text-muted-foreground"}`}>{plan.description}</p>
                <div className="mt-6 mb-6">
                  <span className={`font-heading text-5xl font-light ${plan.popular ? "text-dark-foreground" : "text-foreground"}`}>
                    {formatRupees(annual ? plan.yearlyPrice : plan.monthlyPrice)}
                  </span>
                  <span className={`font-body text-sm ml-1 ${plan.popular ? "text-dark-muted" : "text-muted-foreground"}`}>
                    /{annual ? "year" : "month"}
                  </span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check size={16} className="mt-0.5 flex-shrink-0 text-accent" />
                      <span className={`font-body text-sm ${plan.popular ? "text-dark-foreground/80" : "text-foreground/80"}`}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.name === "Instructor Pro" ? "/login?next=/instructor/home" : "/login?next=/learn"}
                  className={`inline-flex items-center justify-center gap-2 font-body text-sm px-6 py-4 rounded-full transition-all duration-300 font-medium w-full ${
                    plan.popular
                      ? "bg-accent text-accent-foreground hover:brightness-110 shadow-lg shadow-accent/25"
                      : "bg-foreground text-background hover:opacity-90"
                  }`}
                >
                  {plan.cta} <ArrowRight size={15} />
                </a>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
};

export default PricingSection;
