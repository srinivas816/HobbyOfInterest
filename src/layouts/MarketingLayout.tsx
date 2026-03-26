import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import MobileBottomNav from "@/components/MobileBottomNav";

const MarketingLayout = () => {
  const { pathname, hash } = useLocation();

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
      <div className="min-w-0 pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <Outlet />
      </div>
      <Footer />
      <BackToTop />
      <MobileBottomNav />
    </div>
  );
};

export default MarketingLayout;
