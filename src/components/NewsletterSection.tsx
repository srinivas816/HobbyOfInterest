import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ScrollReveal from "./ScrollReveal";
import { apiFetch, parseJson } from "@/lib/api";

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      const res = await apiFetch("/api/newsletter", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      await parseJson<{ ok: boolean }>(res);
      setSubmitted(true);
      toast.success("You’re subscribed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not subscribe");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />

      <div className="container mx-auto py-20 md:py-28 relative z-10">
        <ScrollReveal scale>
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <Mail size={28} className="text-accent" />
            </div>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-light text-foreground">
              Stay inspired<span className="text-accent">.</span>
            </h2>
            <p className="font-body text-base text-muted-foreground mt-4 max-w-xl mx-auto leading-relaxed">
              Get weekly picks of trending classes, instructor spotlights, creative tips, and exclusive early-access deals.
            </p>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={busy}
                  className="flex-1 px-6 py-4 rounded-full font-body text-sm bg-card border border-border/50 text-foreground placeholder:text-muted-foreground outline-none focus:border-accent/50 transition-colors disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground font-body text-sm px-8 py-4 rounded-full hover:brightness-110 transition-all duration-300 font-medium shadow-lg shadow-accent/20 disabled:opacity-60"
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
                <p className="font-heading text-lg text-foreground">You&apos;re in 🎉</p>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  We&apos;ll send you curated class picks and exclusive deals every week.
                </p>
              </motion.div>
            )}

            <p className="font-body text-xs text-muted-foreground/60 mt-4">Useful updates only. Unsubscribe anytime. No spam, ever.</p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default NewsletterSection;
