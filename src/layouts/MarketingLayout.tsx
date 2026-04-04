import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import MobileBottomNav from "@/components/MobileBottomNav";

const HIDE_MOBILE_BOTTOM_NAV_PATHS = new Set(["/choose-role", "/instructor/activate"]);

const MarketingLayout = () => {
  const { pathname, hash } = useLocation();
  const hideMobileBottomNav = HIDE_MOBILE_BOTTOM_NAV_PATHS.has(pathname);

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
      <Navbar />
      <div
        className={
          hideMobileBottomNav
            ? "min-w-0 pb-[max(1rem,env(safe-area-inset-bottom,0px))] md:pb-0"
            : "min-w-0 pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] md:pb-0"
        }
      >
        <Outlet />
      </div>
      <Footer />
      <BackToTop />
      {!hideMobileBottomNav ? <MobileBottomNav /> : null}
    </div>
  );
};

export default MarketingLayout;
