import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import StaggerChildren, { StaggerItem } from "./StaggerChildren";

const plans = [
  {
    name: "Explorer",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Start discovering hobbies across Indian cities for free",
    features: [
      "Browse city-based classes",
      "Save workshops and instructors",
      "Community recommendations",
      "1 free trial event every month",
    ],
    cta: "Get Started Free",
    popular: false,
    style: "bg-card border-border/50",
  },
  {
    name: "Creator Plus",
    monthlyPrice: 699,
    yearlyPrice: 6990,
    description: "For hobby learners who want regular classes and faster booking",
    features: [
      "Priority access to weekend batches",
      "Unlimited live and recorded classes",
      "WhatsApp reminders and updates",
      "Multilingual instructor sessions",
      "Learning streaks and progress tracking",
      "Exclusive creator community events",
    ],
    cta: "Start 7-Day Trial",
    popular: true,
    style: "bg-dark text-dark-foreground border-dark-border",
  },
  {
    name: "Instructor Pro",
    monthlyPrice: 1499,
    yearlyPrice: 14990,
    description: "For studios and solo creators who want to teach and sell classes",
    features: [
      "Unlimited class listings",
      "Lead capture for workshops",
      "Student waitlists by city",
      "Pricing insights in INR",
      "Creator profile and social proof",
      "Priority onboarding support",
    ],
    cta: "Start Teaching",
    popular: false,
    style: "bg-card border-border/50",
  },
];

const PricingSection = () => {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="section-warm">
      <div className="container mx-auto px-6 py-20 md:py-28">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto">
            <span className="font-body text-xs tracking-[0.25em] uppercase text-accent font-medium">
              Pricing for India
            </span>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-foreground mt-4">
              Simple INR plans for learners and instructors<span className="text-accent">.</span>
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="flex items-center justify-center gap-4 mt-10">
            <span className={`font-body text-sm transition-colors ${!annual ? "text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                annual ? "bg-accent" : "bg-border"
              }`}
            >
              <div
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-background shadow-md transition-transform duration-300 ${
                  annual ? "translate-x-7" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className={`font-body text-sm transition-colors ${annual ? "text-foreground" : "text-muted-foreground"}`}>
              Annual
              <span className="ml-1.5 text-xs text-accent font-medium">Save 2 months</span>
            </span>
          </div>
        </ScrollReveal>

        <StaggerChildren
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14 items-start"
          staggerDelay={0.12}
        >
          {plans.map((plan, i) => (
            <StaggerItem key={i}>
              <div
                className={`relative rounded-3xl border p-8 md:p-9 ${plan.style} transition-all duration-500 hover:shadow-xl h-full flex flex-col`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-8 bg-accent text-accent-foreground font-body text-xs font-medium px-4 py-1.5 rounded-full">
                    Best Value
                  </span>
                )}

                <h3 className={`font-heading text-2xl ${plan.popular ? "text-dark-foreground" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                <p className={`font-body text-sm mt-2 ${plan.popular ? "text-dark-muted" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>

                <div className="mt-6 mb-6">
                  <span className={`font-heading text-5xl font-light ${plan.popular ? "text-dark-foreground" : "text-foreground"}`}>
                    ₹{annual ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className={`font-body text-sm ml-1 ${plan.popular ? "text-dark-muted" : "text-muted-foreground"}`}>
                    /{annual ? "year" : "month"}
                  </span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check size={16} className="mt-0.5 flex-shrink-0 text-accent" />
                      <span className={`font-body text-sm ${plan.popular ? "text-dark-foreground/80" : "text-foreground/80"}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#cta"
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
