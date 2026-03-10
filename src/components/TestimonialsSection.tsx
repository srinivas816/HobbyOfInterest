const testimonials = [
  {
    quote: "The pottery class changed my evenings. Instead of screens, I now have clay under my nails and a shelf of bowls I made.",
    name: "Sarah Mitchell",
    role: "Software Engineer",
  },
  {
    quote: "I found a woodworking studio 10 minutes from my apartment. Six months later, I built my own dining table.",
    name: "Marcus Chen",
    role: "Product Manager",
  },
  {
    quote: "The platform made it effortless to list my baking workshops. I went from 3 students to 30 in two months.",
    name: "Priya Sharma",
    role: "Artisan Baker",
  },
  {
    quote: "I really appreciate the quality of instruction. Every class I've taken has been thoughtful and well-paced.",
    name: "James Cooper",
    role: "Architect",
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="section-divider">
      <div className="container mx-auto px-6 py-16 md:py-24">
        <h2 className="font-heading text-3xl md:text-5xl font-light text-foreground text-center">
          What our community says<span className="text-primary">.</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 mt-12">
          {testimonials.map((t, i) => (
            <div key={i} className="border-architectural p-8 md:p-10">
              <p className="font-body text-base text-foreground leading-relaxed italic">
                "{t.quote}"
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary flex items-center justify-center font-heading text-sm text-foreground">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="font-body text-sm font-medium text-foreground">{t.name}</p>
                  <p className="font-body text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
