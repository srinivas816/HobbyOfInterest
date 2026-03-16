import { useMemo, useState } from "react";
import { CalendarDays, Clock3, IndianRupee, MapPin, Sparkles } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const cities = ["Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Pune", "Chennai"];
const interests = ["Pottery", "Bharatanatyam", "Baking", "Photography", "Guitar", "Candle Making"];
const budgets = ["Under ₹1,500", "₹1,500–₹3,000", "₹3,000+"];
const formats = ["Weekend only", "Weekday evenings", "Online", "In-person"];

const recommendations = {
  Pottery: {
    title: "Weekend Pottery Wheel Lab",
    city: "Bengaluru",
    price: "₹2,499",
    format: "Weekend studio batch",
    note: "Best for urban professionals looking for a tactile hobby and stress relief.",
  },
  Bharatanatyam: {
    title: "Classical Movement Foundation",
    city: "Chennai",
    price: "₹1,800",
    format: "Weekday evening cohort",
    note: "Great for learners seeking cultural depth, discipline, and performance confidence.",
  },
  Baking: {
    title: "Home Baker to Pop-up Seller",
    city: "Mumbai",
    price: "₹2,999",
    format: "Hybrid live + kitchen practice",
    note: "Ideal for hobbyists exploring side-income potential through premium baked goods.",
  },
  Photography: {
    title: "Street & Travel Photography Bootcamp",
    city: "Delhi NCR",
    price: "₹2,200",
    format: "Weekend outdoor sessions",
    note: "Designed for creators who want better mobile and mirrorless photography output.",
  },
  Guitar: {
    title: "Bollywood & Acoustic Guitar Starter",
    city: "Pune",
    price: "₹1,499",
    format: "Weekday evening live classes",
    note: "A practical beginner path built around familiar songs and performance milestones.",
  },
  "Candle Making": {
    title: "Scented Candle Studio Basics",
    city: "Hyderabad",
    price: "₹1,650",
    format: "In-person maker workshop",
    note: "Popular with learners interested in gifting, home decor, and small-batch selling.",
  },
};

const LearningPlannerSection = () => {
  const [selectedCity, setSelectedCity] = useState(cities[0]);
  const [selectedInterest, setSelectedInterest] = useState(interests[0]);
  const [selectedBudget, setSelectedBudget] = useState(budgets[1]);
  const [selectedFormat, setSelectedFormat] = useState(formats[0]);

  const recommendation = useMemo(() => recommendations[selectedInterest as keyof typeof recommendations], [selectedInterest]);

  return (
    <section id="planner" className="section-warm border-y border-border/40">
      <div className="container mx-auto px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-10 items-start">
          <ScrollReveal direction="left">
            <div className="rounded-[2rem] border border-border/60 bg-card/80 backdrop-blur-sm p-6 sm:p-8 md:p-10 shadow-[0_20px_60px_-30px_hsl(var(--foreground)/0.18)]">
              <span className="font-body text-xs tracking-[0.25em] uppercase text-accent font-medium">
                Hobby planner for India
              </span>
              <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-foreground mt-4 leading-[1.02]">
                Find the right hobby by city, time, and budget<span className="text-primary">.</span>
              </h2>
              <p className="font-body text-sm sm:text-base text-muted-foreground mt-5 max-w-xl leading-relaxed">
                Urban hobby demand in India is strongest around weekend formats, evening batches, culturally rooted skills, and creator-friendly hobbies that can also become side gigs.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
                <PlannerGroup icon={MapPin} label="City" options={cities} value={selectedCity} onChange={setSelectedCity} />
                <PlannerGroup icon={Sparkles} label="Interest" options={interests} value={selectedInterest} onChange={setSelectedInterest} />
                <PlannerGroup icon={IndianRupee} label="Budget" options={budgets} value={selectedBudget} onChange={setSelectedBudget} />
                <PlannerGroup icon={Clock3} label="Format" options={formats} value={selectedFormat} onChange={setSelectedFormat} />
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.15}>
            <div className="rounded-[2rem] bg-dark text-dark-foreground p-6 sm:p-8 md:p-10 relative overflow-hidden border border-dark-border">
              <div className="absolute -top-16 -right-12 w-48 h-48 rounded-full bg-accent/15 blur-[90px]" />
              <div className="absolute -bottom-12 -left-10 w-40 h-40 rounded-full bg-primary/15 blur-[80px]" />

              <div className="relative z-10">
                <p className="font-body text-xs tracking-[0.25em] uppercase text-accent">Recommended path</p>
                <h3 className="font-heading text-3xl sm:text-4xl font-light mt-4 leading-tight">
                  {recommendation.title}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-7">
                  <InsightCard icon={MapPin} label="Suggested city" value={selectedCity || recommendation.city} />
                  <InsightCard icon={CalendarDays} label="Best schedule" value={selectedFormat} />
                  <InsightCard icon={IndianRupee} label="Expected fee" value={recommendation.price} />
                  <InsightCard icon={Sparkles} label="Why it fits" value={selectedBudget} />
                </div>

                <p className="font-body text-sm text-dark-muted mt-6 leading-relaxed">
                  {recommendation.note}
                </p>

                <div className="mt-7 rounded-2xl border border-dark-border bg-dark-foreground/5 p-5">
                  <p className="font-body text-xs tracking-[0.2em] uppercase text-dark-muted">Market fit analysis</p>
                  <ul className="mt-3 space-y-2.5 font-body text-sm text-dark-foreground/85 leading-relaxed">
                    <li>• Weekend and after-work batches reduce drop-off for metro learners.</li>
                    <li>• Cultural categories and maker hobbies perform well for discovery and gifting.</li>
                    <li>• INR-led pricing and city context improve trust and purchase intent.</li>
                  </ul>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

const PlannerGroup = ({
  icon: Icon,
  label,
  options,
  value,
  onChange,
}: {
  icon: typeof MapPin;
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
        <Icon size={15} className="text-foreground" />
      </div>
      <span className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground">{label}</span>
    </div>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`rounded-full border px-4 py-2.5 font-body text-sm transition-all duration-300 ${
            value === option
              ? "bg-foreground text-background border-foreground"
              : "bg-background text-foreground border-border hover:border-foreground/40"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  </div>
);

const InsightCard = ({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) => (
  <div className="rounded-2xl border border-dark-border bg-dark-foreground/5 p-4">
    <div className="flex items-center gap-2 text-dark-muted">
      <Icon size={14} className="text-accent" />
      <span className="font-body text-[11px] uppercase tracking-[0.18em]">{label}</span>
    </div>
    <p className="font-heading text-lg text-dark-foreground mt-2">{value}</p>
  </div>
);

export default LearningPlannerSection;
