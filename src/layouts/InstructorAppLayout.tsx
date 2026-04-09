import { Outlet, Navigate, useLocation, Link } from "react-router-dom";
import { Home, GraduationCap, Users, Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/instructor/home", label: "Home", icon: Home, end: true },
  { to: "/instructor/classes", label: "Classes", icon: GraduationCap, end: false },
  { to: "/instructor/students", label: "Students", icon: Users, end: false },
  { to: "/instructor/more", label: "More", icon: Menu, end: false },
];

/** Shell for `/instructor/home`, classes, students, more, and class workspace — not `/instructor/studio`. */
const InstructorAppLayout = () => {
  const { user, token, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login?next=/instructor/home" replace />;
  }

  if (user.role !== "INSTRUCTOR") {
    return <Navigate to="/learn" replace />;
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="flex-1 pb-20">
        <Outlet />
      </div>
      <nav
        className="fixed bottom-0 inset-x-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
        aria-label="Instructor navigation"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-around gap-1 px-2 pt-2">
          {nav.map(({ to, label, icon: Icon, end }) => {
            const onClass = location.pathname.startsWith("/instructor/class/");
            const active = end
              ? location.pathname === to
              : to === "/instructor/students"
                ? location.pathname === "/instructor/students"
                : location.pathname.startsWith(to) || (to === "/instructor/classes" && onClass);
            return (
              <li key={to} className="flex-1 min-w-0">
                <Link
                  to={to}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 px-1 text-[10px] font-medium font-body transition-colors",
                    active ? "text-accent" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-6 w-6", active && "text-accent")} strokeWidth={active ? 2.25 : 2} aria-hidden />
                  <span className="truncate w-full text-center">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default InstructorAppLayout;
