import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="section-divider">
      <div className="container mx-auto px-6 py-16 md:py-24">
        <div className="border-architectural p-10 md:p-16 text-center">
          <h2 className="font-heading text-3xl md:text-5xl font-light text-foreground leading-tight">
            Ready to find your next hobby<span className="text-primary">?</span>
          </h2>
          <p className="font-body text-base text-muted-foreground mt-4 max-w-lg mx-auto leading-relaxed">
            Whether you want to learn something new or share your craft with others — Hobby of Interest is the place to start.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-body text-sm px-8 py-4 hover:opacity-90 transition-opacity"
            >
              Browse Classes <ArrowRight size={16} />
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 border-architectural font-body text-sm text-foreground px-8 py-4 hover:bg-secondary transition-colors"
            >
              List Your Class
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
