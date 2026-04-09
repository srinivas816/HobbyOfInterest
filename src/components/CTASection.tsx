import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import ScrollReveal from "./ScrollReveal";

const CTASection = () => (
  <section id="cta" className="bg-background">
    <div className="container mx-auto py-12 md:py-20">
      <ScrollReveal scale>
        <div className="rounded-2xl sm:rounded-3xl bg-dark p-8 sm:p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-60 sm:w-80 h-60 sm:h-80 bg-accent/15 rounded-full blur-[100px] -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-primary/15 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3" />

          <div className="relative z-10">
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-dark-foreground leading-tight">
              Ready to start your creative journey<span className="text-accent">?</span>
            </h2>
            <p className="font-body text-sm sm:text-base text-dark-muted mt-4 sm:mt-5 max-w-2xl mx-auto leading-relaxed">
              Join thousands of learners discovering new hobbies, building skills, and connecting with passionate instructors — online and in-person.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-8 sm:mt-10">
              <Link
                to="/login?next=/learn"
                className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground font-body text-sm px-7 sm:px-8 py-3.5 sm:py-4 rounded-full hover:brightness-110 hover:gap-3 transition-all duration-300 font-medium shadow-lg shadow-accent/25"
              >
                Get Started Free <ArrowRight size={16} />
              </Link>
              <Link
                to="/login?next=/instructor/home"
                className="inline-flex items-center justify-center gap-2 border border-dark-border font-body text-sm text-dark-foreground px-7 sm:px-8 py-3.5 sm:py-4 rounded-full hover:bg-dark-foreground/10 transition-all duration-300"
              >
                Become a Tutor
              </Link>
              <a href="#pricing" className="inline-flex items-center justify-center gap-2 border border-dark-border font-body text-sm text-dark-foreground px-7 sm:px-8 py-3.5 sm:py-4 rounded-full hover:bg-dark-foreground/10 transition-all duration-300">
                View Pricing
              </a>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  </section>
);

export default CTASection;
