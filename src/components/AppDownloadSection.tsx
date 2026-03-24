import { Smartphone, ArrowRight } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const AppDownloadSection = () => (
  <section id="app-download" className="section-dark border-t border-dark-border">
    <div className="container mx-auto py-20 md:py-28">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <ScrollReveal direction="left">
          <span className="font-body text-xs tracking-[0.25em] uppercase text-accent font-medium">
            Coming soon
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light text-dark-foreground leading-[1.05] mt-4">
            Learn on the go with our mobile app<span className="text-accent">.</span>
          </h2>
          <p className="font-body text-sm sm:text-base text-dark-muted mt-5 max-w-md leading-relaxed">
            Book classes, join live sessions, track your progress, and message instructors — all from your phone. Available soon on iOS and Android.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground font-body text-sm px-7 py-3.5 rounded-full hover:brightness-110 transition-all duration-300 font-medium">
              Join the Waitlist <ArrowRight size={15} />
            </button>
            <button className="inline-flex items-center justify-center gap-2 border border-dark-border text-dark-foreground font-body text-sm px-7 py-3.5 rounded-full hover:bg-dark-foreground/10 transition-all duration-300">
              Get Notified
            </button>
          </div>

          <div className="flex items-center gap-6 mt-8">
            {["Offline access", "Push notifications", "Quick booking"].map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span className="font-body text-xs text-dark-muted">{feature}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal direction="right">
          <div className="flex justify-center">
            <div className="relative w-[260px] h-[520px] rounded-[3rem] bg-dark-foreground/5 border-2 border-dark-border overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-dark rounded-b-2xl" />
              <div className="flex items-center justify-center h-full">
                <div className="text-center px-6">
                  <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
                    <Smartphone size={28} className="text-accent" />
                  </div>
                  <p className="font-heading text-lg text-dark-foreground">Hobby of Interest</p>
                  <p className="font-body text-xs text-dark-muted mt-2">Your creative journey, in your pocket</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  </section>
);

export default AppDownloadSection;
