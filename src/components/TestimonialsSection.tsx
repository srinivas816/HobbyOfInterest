import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const testimonials = [
  {
    quote: "I found a pottery studio in Indiranagar that fit my weekend schedule perfectly. It felt premium, but still affordable enough to commit.",
    name: "Ritika Sharma",
    role: "Marketing Lead, Bengaluru",
    initials: "RS",
    color: "bg-primary/15 text-primary",
    rating: 5,
  },
  {
    quote: "The baking workshop format was ideal for Mumbai. Short, focused, and practical enough that I started taking festive orders from home.",
    name: "Naina Shah",
    role: "Home Baker, Mumbai",
    initials: "NS",
    color: "bg-accent/15 text-accent",
    rating: 5,
  },
  {
    quote: "As an instructor, the city-first positioning makes much more sense. Students care about location, timing, and trust before anything else.",
    name: "Priya Menon",
    role: "Workshop Host, Chennai",
    initials: "PM",
    color: "bg-primary/15 text-primary",
    rating: 5,
  },
  {
    quote: "I was looking for something offline after work in Gurgaon, and the platform made it easy to compare batches, fees, and commute-friendly options.",
    name: "Aditya Khanna",
    role: "Consultant, Delhi NCR",
    initials: "AK",
    color: "bg-accent/15 text-accent",
    rating: 5,
  },
  {
    quote: "The planner helped me pick a hobby based on my budget instead of just aspiration. That made the decision feel realistic and exciting.",
    name: "Megha Joshi",
    role: "Product Designer, Pune",
    initials: "MJ",
    color: "bg-primary/15 text-primary",
    rating: 5,
  },
  {
    quote: "I love that it mixes modern creator hobbies with Indian art forms. It feels much more relevant than generic course marketplaces.",
    name: "Sowmya Reddy",
    role: "UX Researcher, Hyderabad",
    initials: "SR",
    color: "bg-accent/15 text-accent",
    rating: 4,
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="bg-background overflow-hidden">
      <div className="container mx-auto px-6 py-16 md:py-24">
        <ScrollReveal>
          <div className="text-center">
            <span className="font-body text-xs tracking-[0.25em] uppercase text-accent font-medium">
              Learner and creator feedback
            </span>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-foreground mt-4">
              Why this positioning works for Indian hobby seekers<span className="text-accent">.</span>
            </h2>
          </div>
        </ScrollReveal>
      </div>

      <div className="space-y-4 sm:space-y-5 pb-16 md:pb-20">
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
    <div className="flex gap-0.5 mb-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`text-sm ${i < testimonial.rating ? "text-accent" : "text-border"}`}>★</span>
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
