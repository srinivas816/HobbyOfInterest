import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const testimonials = [
  {
    quote: "The pottery class changed my evenings. Instead of screens, I now have clay under my nails and a shelf of bowls I made.",
    name: "Sarah Mitchell",
    role: "Software Engineer",
    initials: "SM",
    color: "bg-primary/15 text-primary",
    rating: 5,
  },
  {
    quote: "I found a woodworking studio 10 minutes from my apartment. Six months later, I built my own dining table.",
    name: "Marcus Chen",
    role: "Product Manager",
    initials: "MC",
    color: "bg-accent/15 text-accent",
    rating: 5,
  },
  {
    quote: "The platform made it effortless to list my baking workshops. I went from 3 students to 30 in two months.",
    name: "Priya Sharma",
    role: "Artisan Baker",
    initials: "PS",
    color: "bg-primary/15 text-primary",
    rating: 5,
  },
  {
    quote: "I really appreciate the quality of instruction. Every class I've taken has been thoughtful and well-paced.",
    name: "James Cooper",
    role: "Architect",
    initials: "JC",
    color: "bg-accent/15 text-accent",
    rating: 5,
  },
  {
    quote: "A new hobby brought vivid impressions. Today I attended my first pottery exhibition and it felt incredible.",
    name: "Emma Wilson",
    role: "Designer",
    initials: "EW",
    color: "bg-primary/15 text-primary",
    rating: 5,
  },
  {
    quote: "The watercolor course shows all stages of creating beautiful paintings. Excellent practice and feedback.",
    name: "Chris Anderson",
    role: "Teacher",
    initials: "CA",
    color: "bg-accent/15 text-accent",
    rating: 4,
  },
  {
    quote: "For several months I've been learning guitar on this platform. The structured lessons are exactly what I needed.",
    name: "Elizabeth Stone",
    role: "Developer",
    initials: "ES",
    color: "bg-primary/15 text-primary",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="bg-background overflow-hidden">
      <div className="container mx-auto px-6 py-16 md:py-24">
        <ScrollReveal>
          <div className="text-center">
            <span className="font-body text-xs tracking-[0.25em] uppercase text-accent font-medium">
              Testimonials
            </span>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-foreground mt-4">
              What our customers say<span className="text-accent">.</span>
            </h2>
          </div>
        </ScrollReveal>
      </div>

      {/* Horizontal scrolling testimonial rows */}
      <div className="space-y-4 sm:space-y-5 pb-16 md:pb-20">
        {/* Row 1 - scrolls left */}
        <div className="relative">
          <motion.div
            animate={{ x: [0, -1400] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="flex gap-4 sm:gap-5 px-4 sm:px-6"
          >
            {[...testimonials, ...testimonials].map((t, i) => (
              <TestimonialCard key={`row1-${i}`} testimonial={t} />
            ))}
          </motion.div>
        </div>

        {/* Row 2 - scrolls right */}
        <div className="relative">
          <motion.div
            animate={{ x: [-1400, 0] }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
            className="flex gap-4 sm:gap-5 px-4 sm:px-6"
          >
            {[...testimonials.slice(3), ...testimonials, ...testimonials.slice(0, 3)].map((t, i) => (
              <TestimonialCard key={`row2-${i}`} testimonial={t} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonials[0] }) => (
  <div className="flex-shrink-0 w-[300px] sm:w-[380px] rounded-2xl bg-card p-5 sm:p-7 border border-border/50 hover:border-accent/30 hover:shadow-lg transition-all duration-500 group">
    {/* Star rating */}
    <div className="flex gap-0.5 mb-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`text-sm ${i < testimonial.rating ? "text-amber-400" : "text-border"}`}>★</span>
      ))}
    </div>
    <p className="font-body text-xs sm:text-sm text-foreground leading-relaxed">
      "{testimonial.quote}"
    </p>
    <div className="mt-4 sm:mt-5 flex items-center gap-3">
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full ${testimonial.color} flex items-center justify-center font-heading text-xs sm:text-sm font-semibold`}>
        {testimonial.initials}
      </div>
      <div>
        <p className="font-body text-xs sm:text-sm font-medium text-foreground">{testimonial.name}</p>
        <p className="font-body text-[10px] sm:text-xs text-muted-foreground">{testimonial.role}</p>
      </div>
    </div>
  </div>
);

export default TestimonialsSection;
