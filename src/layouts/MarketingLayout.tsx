import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useAuth } from "@/context/AuthContext";

const HIDE_MOBILE_BOTTOM_NAV_PATHS = new Set(["/choose-role", "/instructor/activate"]);

/** Logged-in instructor: daily loop + class workspace (excludes `/instructor/studio` and `/instructor/activate`). */
function isInstructorTeachingShell(pathname: string, role: string | undefined): boolean {
  if (role !== "INSTRUCTOR") return false;
  return (
    pathname === "/instructor/home" ||
    pathname.startsWith("/instructor/classes") ||
    pathname.startsWith("/instructor/students") ||
    pathname.startsWith("/instructor/more") ||
    pathname.startsWith("/instructor/class/")
  );
}

const MarketingLayout = () => {
  const { pathname, hash } = useLocation();
  const { user } = useAuth();
  const teachingShell = isInstructorTeachingShell(pathname, user?.role);
  const hideMobileBottomNav = HIDE_MOBILE_BOTTOM_NAV_PATHS.has(pathname) || teachingShell;
  const minimalHomeFooter = pathname === "/";

  useEffect(() => {
    if (pathname !== "/" || !hash) return;
    const id = hash.replace("#", "");
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => window.clearTimeout(t);
  }, [pathname, hash]);

  return (
    <div className="min-h-screen min-w-0 bg-background scroll-smooth overflow-x-hidden">
      {!teachingShell ? <Navbar /> : null}
      <div
        className={
          hideMobileBottomNav
            ? "min-w-0 pb-[max(1rem,env(safe-area-inset-bottom,0px))] md:pb-0"
            : "min-w-0 pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] md:pb-0"
        }
      >
        <Outlet />
      </div>
      {teachingShell ? null : minimalHomeFooter ? (
        <footer className="border-t border-border/40 bg-background py-6">
          <p className="text-center font-body text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Hobby of Interest
          </p>
        </footer>
      ) : (
        <Footer />
      )}
      {!teachingShell ? <BackToTop /> : null}
      {!hideMobileBottomNav ? <MobileBottomNav /> : null}
    </div>
  );
};

export default MarketingLayout;
