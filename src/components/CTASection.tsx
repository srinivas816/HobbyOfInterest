import { ArrowRight } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const CTASection = () => {
  return (
    <section className="section-divider">
      <div className="container mx-auto px-6 py-16 md:py-24">
        <ScrollReveal scale>
          <div className="rounded-2xl bg-foreground p-10 md:p-16 text-center relative overflow-hidden">
            {/* Decorative accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <h2 className="font-heading text-3xl md:text-5xl font-light text-background leading-tight">
                Ready to find your next hobby<span className="text-primary">?</span>
              </h2>
              <p className="font-body text-base text-background/70 mt-4 max-w-lg mx-auto leading-relaxed">
                Whether you want to learn something new or share your craft with others — Hobby of Interest is the place to start.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <a
                  href="#"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-body text-sm px-8 py-4 rounded-full hover:opacity-90 hover:gap-3 transition-all duration-300"
                >
                  Browse Classes <ArrowRight size={16} />
                </a>
                <a
                  href="#"
                  className="inline-flex items-center justify-center gap-2 border border-background/30 font-body text-sm text-background px-8 py-4 rounded-full hover:bg-background/10 transition-colors"
                >
                  List Your Class
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
