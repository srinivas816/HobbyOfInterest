import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const stats = [
  { value: 35, suffix: "+", label: "Cities Covered" },
  { value: 450, suffix: "+", label: "Live Workshops" },
  { value: 12, suffix: "K+", label: "Learners Exploring" },
  { value: 4.8, suffix: "", label: "Average Rating", isDecimal: true },
];

const AnimatedNumber = ({ value, suffix, isDecimal }: { value: number; suffix: string; isDecimal?: boolean }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(isDecimal ? Math.round(current * 10) / 10 : Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, value, isDecimal]);

  return (
    <span ref={ref} className="font-heading text-4xl md:text-5xl font-light text-foreground">
      {isDecimal ? display.toFixed(1) : display}{suffix}
    </span>
  );
};

const StatsBar = () => {
  return (
    <section className="bg-background border-y border-border/30">
      <div className="container mx-auto px-6 py-14 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <AnimatedNumber value={stat.value} suffix={stat.suffix} isDecimal={stat.isDecimal} />
              <p className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mt-2">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
