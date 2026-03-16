import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section className="bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />

      <div className="container mx-auto px-6 py-20 md:py-28 relative z-10">
        <ScrollReveal scale>
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <Mail size={28} className="text-accent" />
            </div>

            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-light text-foreground">
              Get local hobby drops<span className="text-accent">.</span>
            </h2>
            <p className="font-body text-base text-muted-foreground mt-4 max-w-xl mx-auto leading-relaxed">
              Receive city-wise workshop picks, festive class roundups, creator stories, and practical hobby ideas curated for Indian learners.
            </p>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 px-6 py-4 rounded-full font-body text-sm bg-card border border-border/50 text-foreground placeholder:text-muted-foreground outline-none focus:border-accent/50 transition-colors"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground font-body text-sm px-8 py-4 rounded-full hover:brightness-110 transition-all duration-300 font-medium shadow-lg shadow-accent/20"
                >
                  Subscribe <ArrowRight size={15} />
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 rounded-2xl bg-accent/10 border border-accent/20 max-w-md mx-auto"
              >
                <p className="font-heading text-lg text-foreground">You’re in 🎉</p>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  We’ll send you curated workshops and new city launches soon.
                </p>
              </motion.div>
            )}

            <p className="font-body text-xs text-muted-foreground/60 mt-4">
              Useful updates only. Unsubscribe anytime.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default NewsletterSection;
