import type { To } from "react-router-dom";
import { NavLink, useLocation } from "react-router-dom";
import { BookOpen, Compass, Home, LayoutDashboard, LogIn, Settings, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { mvpInstructorFocus } from "@/lib/productFocus";
import { cn } from "@/lib/utils";

type NavItem = {
  to: To;
  label: string;
  icon: typeof Home;
  end?: boolean;
  isActive?: (pathname: string, hash: string, search: string) => boolean;
};

const guestItems: NavItem[] = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/courses", label: "Explore", icon: Compass },
  {
    to: "/login?next=/instructor/studio",
    label: "Teach",
    icon: LayoutDashboard,
    isActive: (pathname, _h, search) => {
      if (pathname !== "/login") return false;
      const next = new URLSearchParams(search).get("next") ?? "";
      return next.includes("instructor");
    },
  },
  {
    to: "/login",
    label: "Account",
    icon: LogIn,
    isActive: (pathname, _h, search) => {
      if (pathname !== "/login") return false;
      const next = new URLSearchParams(search).get("next") ?? "";
      return !next.includes("instructor");
    },
  },
];

const learnerItems: NavItem[] = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/courses", label: "Explore", icon: Compass },
  { to: "/learn", label: "My classes", icon: BookOpen },
  { to: "/settings", label: "Profile", icon: Settings },
];

const instructorItems: NavItem[] = [
  {
    to: { pathname: "/instructor/studio", hash: "studio-analytics", search: "" },
    label: "Home",
    icon: LayoutDashboard,
    isActive: (pathname, hash, search) =>
      pathname === "/instructor/studio" &&
      (!hash || hash === "studio-analytics") &&
      !new URLSearchParams(search).get("tool"),
  },
  {
    to: { pathname: "/instructor/studio", hash: "studio-classes", search: "" },
    label: "Classes",
    icon: BookOpen,
    isActive: (pathname, hash, search) =>
      pathname === "/instructor/studio" && hash === "studio-classes" && !new URLSearchParams(search).get("tool"),
  },
  {
    to: { pathname: "/instructor/studio", hash: "studio-teaching-tools", search: "?tool=roster" },
    label: "Students",
    icon: Users,
    isActive: (pathname, _h, search) =>
      pathname === "/instructor/studio" && new URLSearchParams(search).get("tool") === "roster",
  },
  { to: "/settings", label: "Profile", icon: Settings },
];

function pathFromTo(to: To): string {
  if (typeof to === "string") return to.split(/[?#]/)[0] ?? to;
  return to.pathname ?? "";
}

function activeForItem(item: NavItem, pathname: string, hash: string, search: string): boolean {
  if (item.isActive) return item.isActive(pathname, hash, search);
  const path = pathFromTo(item.to);
  if (item.end) return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}

/**
 * Mobile-first bottom navigation: different tabs for guest / learner / instructor.
 * Hidden from `md` breakpoint up — desktop uses the top navbar.
 */
const MobileBottomNav = () => {
  const { user } = useAuth();
  const { pathname, hash, search } = useLocation();
  const h = hash.replace(/^#/, "");
  const mvp = mvpInstructorFocus();

  const learnerItemsEffective = mvp ? learnerItems.filter((i) => pathFromTo(i.to) !== "/courses") : learnerItems;

  const items: NavItem[] = !user ? guestItems : user.role === "INSTRUCTOR" ? instructorItems : learnerItemsEffective;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl pb-[max(0.35rem,env(safe-area-inset-bottom))]"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around gap-0.5 px-1 pt-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeForItem(item, pathname, h, search);
          return (
            <li key={item.label} className="min-w-0 flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={cn(
                  "flex min-h-[3rem] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 font-body text-[10px] font-medium leading-tight transition-colors",
                  active ? "text-accent" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 2} aria-hidden />
                <span className="truncate max-w-full">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
