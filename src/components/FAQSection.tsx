import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const faqs = [
  {
    question: "How do online classes work?",
    answer: "Online classes are conducted via live video sessions with real-time instructor interaction. You'll get a link before each class, can ask questions, get feedback, and access recordings for 30 days after. Some classes also include self-paced materials.",
  },
  {
    question: "Can I switch between online and in-person formats?",
    answer: "Yes! Many instructors offer both formats. You can start with an online class to try things out and then switch to in-person sessions, or vice versa. Your progress carries over between formats.",
  },
  {
    question: "What if I'm a complete beginner?",
    answer: "Most of our classes are beginner-friendly and clearly labeled by difficulty level. Instructors are experienced at teaching newcomers and classes include all materials and supplies needed to get started.",
  },
  {
    question: "How does the money-back guarantee work?",
    answer: "If you're not satisfied after your first session of any class, we'll refund you in full — no questions asked. Just contact us within 48 hours of your first class.",
  },
  {
    question: "Can I become an instructor on the platform?",
    answer: "Absolutely! If you have expertise in a hobby or creative skill, you can apply to teach. We'll review your application, help you set up your listing, and provide tools to manage classes, students, and payments.",
  },
  {
    question: "Do you offer group or corporate bookings?",
    answer: "Yes, we offer team-building workshops and group bookings for companies, events, and private parties. Contact us for custom packages with dedicated instructors and flexible scheduling.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit/debit cards, UPI, net banking, digital wallets, and international payments. Subscriptions can be managed and cancelled anytime from your account dashboard.",
  },
  {
    question: "How do I cancel or reschedule a class?",
    answer: "You can cancel or reschedule up to 24 hours before a class for a full credit. Last-minute cancellations within 24 hours may be subject to the instructor's cancellation policy.",
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-background">
      <div className="container mx-auto py-20 md:py-28">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto">
            <span className="font-body text-xs tracking-[0.25em] uppercase text-accent font-medium">
              Frequently asked
            </span>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-foreground mt-4">
              Got questions? We've got answers<span className="text-accent">.</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="max-w-3xl mx-auto mt-14 space-y-3">
          {faqs.map((faq, i) => (
            <ScrollReveal key={i} delay={i * 0.05}>
              <div className="rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:border-border">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left"
                >
                  <span className="font-heading text-base sm:text-lg text-foreground pr-4">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: openIndex === i ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown size={20} className="text-muted-foreground" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                        <p className="font-body text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
