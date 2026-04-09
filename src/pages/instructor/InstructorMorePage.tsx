import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { BarChart3, BookOpen, ChevronRight, CreditCard, GraduationCap, Home, UserRound, Wrench } from "lucide-react";

type Row = { to: string; label: string; sub: string; icon: LucideIcon };

const sections: { title: string; rows: Row[] }[] = [
  {
    title: "Advanced tools",
    rows: [
      {
        to: "/instructor/studio",
        label: "Manage content",
        sub: "Lessons, curriculum, publishing — occasional use, not your daily loop.",
        icon: BookOpen,
      },
      {
        to: "/instructor/studio#studio-analytics",
        label: "Analytics",
        sub: "Enrollments & completion",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Get started",
    rows: [
      {
        to: "/instructor/activate",
        label: "New class",
        sub: "Quick setup & invite",
        icon: GraduationCap,
      },
    ],
  },
  {
    title: "Account",
    rows: [
      { to: "/settings", label: "Profile", sub: "Name, phone, security", icon: UserRound },
      { to: "/settings#instructor-plan", label: "Plan & billing", sub: "Upgrade, student limits", icon: CreditCard },
    ],
  },
];

const InstructorMorePage = () => {
  return (
    <div className="container mx-auto max-w-lg px-4 pt-6 pb-4">
      <h1 className="font-heading text-2xl text-foreground">More</h1>
      <p className="text-sm text-muted-foreground font-body mt-1">
        Extras and advanced tools — billing, curriculum, and analytics.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to="/instructor/home"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-medium font-body text-foreground hover:bg-muted/50"
        >
          <Home className="h-3.5 w-3.5 text-accent" aria-hidden />
          Home
        </Link>
        <Link
          to="/instructor/classes"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-medium font-body text-foreground hover:bg-muted/50"
        >
          <GraduationCap className="h-3.5 w-3.5 text-accent" aria-hidden />
          Classes
        </Link>
      </div>

      <div className="mt-6 rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5 flex gap-2 items-start">
        <Wrench className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
        <p className="text-xs text-muted-foreground font-body leading-relaxed">
          <span className="text-foreground/90 font-medium">Advanced tools</span> are for publishing and deep edits. Day-to-day teaching uses Home,
          Classes, and each class workspace.
        </p>
      </div>

      <div className="mt-8 space-y-8">
        {sections.map((sec) => (
          <section key={sec.title}>
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">{sec.title}</h2>
            <ul className="space-y-2">
              {sec.rows.map(({ to, label, sub, icon: Icon }) => (
                <li key={`${sec.title}-${label}`}>
                  <Link
                    to={to}
                    className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 active:scale-[0.99] transition-transform"
                  >
                    <div className="rounded-xl bg-accent/10 p-2.5 shrink-0">
                      <Icon className="h-5 w-5 text-accent" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground font-body">{label}</p>
                      <p className="text-xs text-muted-foreground font-body mt-0.5">{sub}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
};

export default InstructorMorePage;
