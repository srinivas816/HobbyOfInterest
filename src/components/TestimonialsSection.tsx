import { motion } from "framer-motion";
import { Star } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const testimonials = [
  {
    quote: "I found a pottery studio that fit my weekend schedule perfectly. The booking was seamless and the instructor was incredible.",
    name: "Ritika S.",
    role: "Marketing Lead",
    initials: "RS",
    color: "bg-primary/15 text-primary",
    rating: 5,
  },
  {
    quote: "The online baking class was so well-structured. I went from complete beginner to taking festive orders in just 4 weeks.",
    name: "Naina M.",
    role: "Home Baker",
    initials: "NM",
    color: "bg-accent/15 text-accent",
    rating: 5,
  },
  {
    quote: "As an instructor, having listing management, student waitlists, and analytics in one place has been a game changer.",
    name: "Priya K.",
    role: "Workshop Host",
    initials: "PK",
    color: "bg-primary/15 text-primary",
    rating: 5,
  },
  {
    quote: "I was looking for weekday evening classes and the platform made it easy to compare schedules, prices, and reviews.",
    name: "Aditya K.",
    role: "Software Engineer",
    initials: "AK",
    color: "bg-accent/15 text-accent",
    rating: 5,
  },
  {
    quote: "The progress tracking and community cohorts kept me motivated. I completed an 8-week guitar course without dropping off.",
    name: "Megha J.",
    role: "Product Designer",
    initials: "MJ",
    color: "bg-primary/15 text-primary",
    rating: 5,
  },
  {
    quote: "Love how it mixes online and offline seamlessly. I started with an online class and then joined the in-person studio version.",
    name: "Sowmya R.",
    role: "UX Researcher",
    initials: "SR",
    color: "bg-accent/15 text-accent",
    rating: 4,
  },
  {
    quote: "The money-back guarantee gave me confidence to try something new. Ended up loving calligraphy — now I teach it here too!",
    name: "James T.",
    role: "Calligraphy Instructor",
    initials: "JT",
    color: "bg-primary/15 text-primary",
    rating: 5,
  },
  {
    quote: "Best platform for hobby discovery. The smart recommendations actually understand what I'd enjoy based on my past classes.",
    name: "Lisa C.",
    role: "Freelancer",
    initials: "LC",
    color: "bg-accent/15 text-accent",
    rating: 5,
  },
];

const TestimonialsSection = () => (
  <section id="testimonials" className="bg-background overflow-hidden">
    <div className="container mx-auto px-6 py-16 md:py-24">
      <ScrollReveal>
        <div className="text-center">
          <span className="font-body text-xs tracking-[0.25em] uppercase text-accent font-medium">
            Loved by learners & creators
          </span>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-foreground mt-4">
            Real stories from our community<span className="text-accent">.</span>
          </h2>
        </div>
      </ScrollReveal>
    </div>

    <div className="space-y-4 sm:space-y-5 pb-16 md:pb-20">
      <div className="relative">
        <motion.div
          animate={{ x: [0, -1600] }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          className="flex gap-4 sm:gap-5 px-4 sm:px-6"
        >
          {[...testimonials.slice(0, 4), ...testimonials.slice(0, 4), ...testimonials.slice(0, 4)].map((t, i) => (
            <TestimonialCard key={`row1-${i}`} testimonial={t} />
          ))}
        </motion.div>
      </div>

      <div className="relative">
        <motion.div
          animate={{ x: [-1600, 0] }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="flex gap-4 sm:gap-5 px-4 sm:px-6"
        >
          {[...testimonials.slice(4), ...testimonials.slice(4), ...testimonials.slice(4)].map((t, i) => (
            <TestimonialCard key={`row2-${i}`} testimonial={t} />
          ))}
        </motion.div>
      </div>
    </div>
  </section>
);

const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonials[0] }) => (
  <div className="flex-shrink-0 w-[300px] sm:w-[380px] rounded-2xl bg-card p-5 sm:p-7 border border-border/50 hover:border-accent/30 hover:shadow-lg transition-all duration-500 group">
    <div className="flex gap-0.5 mb-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={13} className={i < testimonial.rating ? "text-accent fill-accent" : "text-border"} />
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
