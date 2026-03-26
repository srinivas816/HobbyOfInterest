import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { BarChart3, BookOpen, ChevronRight, CreditCard, GraduationCap, UserRound } from "lucide-react";

const sections: {
  title: string;
  rows: { to: string; label: string; sub: string; icon: LucideIcon }[];
}[] = [
  {
    title: "Manage",
    rows: [
      {
        to: "/instructor/studio",
        label: "Curriculum & content",
        sub: "Lessons, sections, publish",
        icon: BookOpen,
      },
      {
        to: "/instructor/studio?setup=1#studio-create-class",
        label: "Classes setup",
        sub: "Create class, invite links",
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
  {
    title: "Insights",
    rows: [
      { to: "/instructor/studio#studio-analytics", label: "Analytics", sub: "Enrollments & completion", icon: BarChart3 },
    ],
  },
];

const InstructorMorePage = () => {
  return (
    <div className="container mx-auto max-w-lg px-4 pt-6 pb-4">
      <h1 className="font-heading text-2xl text-foreground">More</h1>
      <p className="text-sm text-muted-foreground font-body mt-1">Deeper tools — grouped so nothing feels like a junk drawer.</p>

      <div className="mt-8 space-y-8">
        {sections.map((sec) => (
          <section key={sec.title}>
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">{sec.title}</h2>
            <ul className="space-y-2">
              {sec.rows.map(({ to, label, sub, icon: Icon }) => (
                <li key={to}>
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
