import { Play } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "./ScrollReveal";
import heroPottery from "@/assets/hero-pottery.jpg";

const VideoSection = () => {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="section-dark border-t border-dark-border">
      <div className="container mx-auto px-6 py-16 md:py-24">
        <ScrollReveal>
          <div className="text-center mb-10 md:mb-14">
            <span className="font-body text-xs tracking-[0.25em] uppercase text-accent font-medium">
              See it in action
            </span>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-light text-dark-foreground mt-4">
              Watch our instructors teach<span className="text-accent">.</span>
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div
            className="relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-video max-w-5xl mx-auto group cursor-pointer shadow-2xl"
            onClick={() => setPlaying(!playing)}
          >
            <AnimatePresence mode="wait">
              {!playing ? (
                <motion.div
                  key="thumbnail"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative w-full h-full"
                >
                  <img
                    src={heroPottery}
                    alt="Watch our instructors in action"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-foreground/30 group-hover:bg-foreground/40 transition-colors duration-500" />
                  
                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-accent flex items-center justify-center shadow-xl"
                    >
                      <Play size={32} className="text-accent-foreground ml-1" fill="currentColor" />
                    </motion.div>
                  </div>

                  {/* Bottom text */}
                  <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10">
                    <p className="font-heading text-2xl md:text-3xl text-background">
                      See our instructors in action
                    </p>
                    <p className="font-body text-sm text-background/70 mt-2">
                      Watch a sample lesson from our top-rated classes
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="video"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full h-full bg-foreground flex items-center justify-center"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                      <Play size={24} className="text-accent ml-0.5" fill="currentColor" />
                    </div>
                    <p className="font-heading text-xl text-dark-foreground">Video player</p>
                    <p className="font-body text-sm text-dark-muted mt-2">
                      Click anywhere to go back
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default VideoSection;
