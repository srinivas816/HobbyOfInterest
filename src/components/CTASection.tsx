import { ArrowRight } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const CTASection = () => {
  return (
    <section id="cta" className="bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-20">
        <ScrollReveal scale>
          <div className="rounded-2xl sm:rounded-3xl bg-dark p-8 sm:p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-60 sm:w-80 h-60 sm:h-80 bg-accent/15 rounded-full blur-[100px] -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-primary/15 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[150px] sm:h-[200px] bg-accent/5 rounded-full blur-[60px] rotate-12" />

            <div className="relative z-10">
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-dark-foreground leading-tight">
                Ready to make this the go-to hobby platform for India<span className="text-accent">?</span>
              </h2>
              <p className="font-body text-sm sm:text-base text-dark-muted mt-4 sm:mt-5 max-w-2xl mx-auto leading-relaxed">
                The strongest next move is combining local discovery, INR pricing, cultural categories, and creator growth tools — so the product feels useful on day one for both learners and instructors.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-8 sm:mt-10">
                <a
                  href="#planner"
                  className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground font-body text-sm px-7 sm:px-8 py-3.5 sm:py-4 rounded-full hover:brightness-110 hover:gap-3 transition-all duration-300 font-medium shadow-lg shadow-accent/25"
                >
                  Explore Market Fit <ArrowRight size={16} />
                </a>
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 border border-dark-border font-body text-sm text-dark-foreground px-7 sm:px-8 py-3.5 sm:py-4 rounded-full hover:bg-dark-foreground/10 transition-all duration-300"
                >
                  View India Pricing
                </a>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default CTASection;
