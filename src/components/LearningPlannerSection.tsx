import { useMemo, useState } from "react";
import { CalendarDays, Clock3, DollarSign, MapPin, Sparkles, Monitor } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const locations = ["Any Location", "New York", "London", "Online", "San Francisco", "Toronto", "Sydney"];
const interests = ["Pottery", "Dance", "Baking", "Photography", "Guitar", "Candle Making"];
const budgets = ["Under $30", "$30–$60", "$60+"];
const formats = ["Weekend only", "Weekday evenings", "Online live", "Self-paced"];

const recommendations: Record<string, { title: string; price: string; format: string; note: string }> = {
  Pottery: {
    title: "Weekend Pottery Wheel Lab",
    price: "$49",
    format: "Weekend studio batch",
    note: "Best for professionals looking for a tactile, screen-free hobby with stress-relieving benefits.",
  },
  Dance: {
    title: "Contemporary Movement Foundation",
    price: "$35",
    format: "Weekday evening cohort",
    note: "Great for learners seeking fitness, expression, and community through structured dance programs.",
  },
  Baking: {
    title: "Artisan Baking Essentials",
    price: "$55",
    format: "Hybrid live + kitchen practice",
    note: "Ideal for hobbyists exploring side-income potential through premium baked goods and pop-ups.",
  },
  Photography: {
    title: "Street & Travel Photography Bootcamp",
    price: "$42",
    format: "Weekend outdoor sessions",
    note: "Designed for creators who want better mobile and mirrorless photography output.",
  },
  Guitar: {
    title: "Acoustic Guitar Starter",
    price: "$29",
    format: "Weekday evening live classes",
    note: "A practical beginner path built around familiar songs and performance milestones.",
  },
  "Candle Making": {
    title: "Scented Candle Studio Basics",
    price: "$35",
    format: "In-person maker workshop",
    note: "Popular with learners interested in gifting, home decor, and small-batch selling.",
  },
};

const LearningPlannerSection = () => {
  const [selectedLocation, setSelectedLocation] = useState(locations[0]);
  const [selectedInterest, setSelectedInterest] = useState(interests[0]);
  const [selectedBudget, setSelectedBudget] = useState(budgets[1]);
  const [selectedFormat, setSelectedFormat] = useState(formats[0]);

  const recommendation = useMemo(() => recommendations[selectedInterest], [selectedInterest]);

  return (
    <section id="planner" className="section-warm border-y border-border/40">
      <div className="container mx-auto px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-10 items-start">
          <ScrollReveal direction="left">
            <div className="rounded-[2rem] border border-border/60 bg-card/80 backdrop-blur-sm p-6 sm:p-8 md:p-10 shadow-[0_20px_60px_-30px_hsl(var(--foreground)/0.18)]">
              <span className="font-body text-xs tracking-[0.25em] uppercase text-accent font-medium">
                Smart class finder
              </span>
              <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-foreground mt-4 leading-[1.02]">
                Find the perfect class for your schedule and budget<span className="text-primary">.</span>
              </h2>
              <p className="font-body text-sm sm:text-base text-muted-foreground mt-5 max-w-xl leading-relaxed">
                Tell us what you're looking for and we'll recommend the best classes — online or in-person — that match your preferences.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
                <PlannerGroup icon={MapPin} label="Location" options={locations} value={selectedLocation} onChange={setSelectedLocation} />
                <PlannerGroup icon={Sparkles} label="Interest" options={interests} value={selectedInterest} onChange={setSelectedInterest} />
                <PlannerGroup icon={DollarSign} label="Budget" options={budgets} value={selectedBudget} onChange={setSelectedBudget} />
                <PlannerGroup icon={Clock3} label="Format" options={formats} value={selectedFormat} onChange={setSelectedFormat} />
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.15}>
            <div className="rounded-[2rem] bg-dark text-dark-foreground p-6 sm:p-8 md:p-10 relative overflow-hidden border border-dark-border">
              <div className="absolute -top-16 -right-12 w-48 h-48 rounded-full bg-accent/15 blur-[90px]" />
              <div className="absolute -bottom-12 -left-10 w-40 h-40 rounded-full bg-primary/15 blur-[80px]" />

              <div className="relative z-10">
                <p className="font-body text-xs tracking-[0.25em] uppercase text-accent">Recommended for you</p>
                <h3 className="font-heading text-3xl sm:text-4xl font-light mt-4 leading-tight">
                  {recommendation.title}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-7">
                  <InsightCard icon={MapPin} label="Location" value={selectedLocation === "Any Location" ? "Online + Local" : selectedLocation} />
                  <InsightCard icon={CalendarDays} label="Schedule" value={selectedFormat} />
                  <InsightCard icon={DollarSign} label="Price" value={recommendation.price} />
                  <InsightCard icon={Monitor} label="Format" value={selectedFormat.includes("Online") || selectedFormat.includes("Self") ? "Online" : "In-person"} />
                </div>

                <p className="font-body text-sm text-dark-muted mt-6 leading-relaxed">
                  {recommendation.note}
                </p>

                <button className="mt-6 inline-flex items-center gap-2 bg-accent text-accent-foreground font-body text-sm px-6 py-3.5 rounded-full hover:brightness-110 transition-all duration-300 font-medium">
                  Book This Class
                </button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

const PlannerGroup = ({
  icon: Icon, label, options, value, onChange,
}: {
  icon: typeof MapPin; label: string; options: string[]; value: string; onChange: (v: string) => void;
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
