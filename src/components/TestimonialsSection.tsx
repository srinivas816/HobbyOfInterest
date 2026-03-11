import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const testimonials = [
  {
    quote: "The pottery class changed my evenings. Instead of screens, I now have clay under my nails and a shelf of bowls I made.",
    name: "Sarah Mitchell",
    role: "Software Engineer",
    initials: "SM",
    color: "bg-primary/15 text-primary",
  },
  {
    quote: "I found a woodworking studio 10 minutes from my apartment. Six months later, I built my own dining table.",
    name: "Marcus Chen",
    role: "Product Manager",
    initials: "MC",
    color: "bg-accent/15 text-accent",
  },
  {
    quote: "The platform made it effortless to list my baking workshops. I went from 3 students to 30 in two months.",
    name: "Priya Sharma",
    role: "Artisan Baker",
    initials: "PS",
    color: "bg-primary/15 text-primary",
  },
  {
    quote: "I really appreciate the quality of instruction. Every class I've taken has been thoughtful and well-paced.",
    name: "James Cooper",
    role: "Architect",
    initials: "JC",
    color: "bg-accent/15 text-accent",
  },
  {
    quote: "A new hobby brought vivid impressions. Today I attended my first pottery exhibition and it felt incredible.",
    name: "Emma Wilson",
    role: "Designer",
    initials: "EW",
    color: "bg-primary/15 text-primary",
  },
  {
    quote: "The watercolor course shows all stages of creating beautiful paintings. Excellent practice and feedback.",
    name: "Chris Anderson",
    role: "Teacher",
    initials: "CA",
    color: "bg-accent/15 text-accent",
  },
  {
    quote: "For several months I've been learning guitar on this platform. The structured lessons are exactly what I needed.",
    name: "Elizabeth Stone",
    role: "Developer",
    initials: "ES",
    color: "bg-primary/15 text-primary",
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="bg-background overflow-hidden">
      <div className="container mx-auto px-6 py-20 md:py-28">
        <ScrollReveal>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-foreground text-center">
            What our customers say<span className="text-accent">.</span>
          </h2>
        </ScrollReveal>
      </div>

      {/* Horizontal scrolling testimonial rows */}
      <div className="space-y-5 pb-20">
        {/* Row 1 - scrolls left */}
        <div className="relative">
          <motion.div
            animate={{ x: [0, -1400] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="flex gap-5 px-6"
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
            className="flex gap-5 px-6"
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
  <div className="flex-shrink-0 w-[380px] rounded-2xl bg-card p-7 border border-border/50 hover:border-accent/30 hover:shadow-lg transition-all duration-500 group">
    <p className="font-body text-sm text-foreground leading-relaxed">
      "{testimonial.quote}"
    </p>
    <div className="mt-5 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-full ${testimonial.color} flex items-center justify-center font-heading text-sm font-semibold`}>
        {testimonial.initials}
      </div>
      <div>
        <p className="font-body text-sm font-medium text-foreground">{testimonial.name}</p>
        <p className="font-body text-xs text-muted-foreground">{testimonial.role}</p>
      </div>
    </div>
  </div>
);

export default TestimonialsSection;
