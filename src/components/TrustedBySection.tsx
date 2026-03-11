import { motion } from "framer-motion";

const partners = [
  "Skillshare", "MasterClass", "Udemy", "Coursera", "CreativeLive", "Domestika"
];

const TrustedBySection = () => {
  return (
    <section className="bg-background border-b border-border/30">
      <div className="container mx-auto px-6 py-10 md:py-14">
        <p className="font-body text-xs tracking-[0.25em] uppercase text-muted-foreground text-center mb-8">
          Trusted by leading platforms & instructors
        </p>
        <div className="overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
          <motion.div
            animate={{ x: [0, -800] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-16 whitespace-nowrap"
          >
            {[...partners, ...partners, ...partners].map((name, i) => (
              <span
                key={`partner-${i}`}
                className="font-heading text-xl md:text-2xl font-semibold text-foreground/20 hover:text-foreground/50 transition-colors duration-300 select-none"
              >
                {name}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBySection;
