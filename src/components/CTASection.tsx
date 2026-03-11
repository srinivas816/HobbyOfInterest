import { ArrowRight } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const CTASection = () => {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-6 py-16 md:py-24">
        <ScrollReveal scale>
          <div className="rounded-3xl bg-dark p-12 md:p-20 text-center relative overflow-hidden">
            {/* Decorative gradients */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-accent/15 rounded-full blur-[100px] -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/15 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-accent/5 rounded-full blur-[60px] rotate-12" />

            <div className="relative z-10">
              <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-dark-foreground leading-tight">
                Ready to find your<br />next hobby<span className="text-accent">?</span>
              </h2>
              <p className="font-body text-base text-dark-muted mt-5 max-w-lg mx-auto leading-relaxed">
                Whether you want to learn something new or share your craft with others — Hobby of Interest is the place to start.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                <a
                  href="#"
                  className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground font-body text-sm px-8 py-4 rounded-full hover:brightness-110 hover:gap-3 transition-all duration-300 font-medium shadow-lg shadow-accent/25"
                >
                  Browse Classes <ArrowRight size={16} />
                </a>
                <a
                  href="#"
                  className="inline-flex items-center justify-center gap-2 border border-dark-border font-body text-sm text-dark-foreground px-8 py-4 rounded-full hover:bg-dark-foreground/10 transition-all duration-300"
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
