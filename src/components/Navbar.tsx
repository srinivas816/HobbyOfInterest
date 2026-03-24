import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Classes", href: "/courses" },
  { label: "Categories", href: "#categories" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const onboardingNext = user?.role === "INSTRUCTOR" ? "/instructor/studio" : "/learn";
  const onboardingHref = `/onboarding?next=${encodeURIComponent(onboardingNext)}`;
  const needsOnboarding = Boolean(user && !user.onboardingCompletedAt);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      const sections = navLinks.filter((l) => l.href.startsWith("#")).map((l) => l.href.slice(1));
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.getBoundingClientRect().top <= 150) {
          setActiveSection(sections[i]);
          return;
        }
      }
      setActiveSection("");
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith("#")) {
      if (location.pathname !== "/") {
        navigate({ pathname: "/", hash: href.slice(1) });
      } else {
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }
    navigate(href);
  };

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-background/95 backdrop-blur-xl shadow-sm border-b border-border/30" : "bg-background/80 backdrop-blur-md"
      }`}
    >
      <div className="container mx-auto flex min-w-0 items-center justify-between gap-3 h-18 py-4">
        <div className="min-w-0 flex-1 pr-1 lg:flex-initial lg:max-w-none">
          <Link
            to="/"
            className="font-heading block truncate text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground"
          >
            Hobby of Interest<span className="text-accent">.</span>
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => {
            const isHash = link.href.startsWith("#");
            const active = isHash ? activeSection === link.href.slice(1) : location.pathname === link.href;
            return (
              <button
                key={link.label}
                type="button"
                onClick={() => handleNavClick(link.href)}
                className={`font-body text-sm tracking-wide transition-colors duration-300 ${
                  active ? "text-accent font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-4">
          {user ? (
            <>
              {needsOnboarding && (
                <Link
                  to={onboardingHref}
                  className="font-body text-sm font-medium text-accent border border-accent/50 bg-accent/10 px-4 py-2 rounded-full hover:bg-accent/15 transition-colors"
                >
                  Complete setup
                </Link>
              )}
              {user.role === "INSTRUCTOR" && (
                <Link
                  to="/instructor/studio"
                  className="font-body text-sm font-medium text-foreground hover:text-accent transition-colors px-4 py-2 rounded-full border border-accent/40 bg-accent/10 hover:bg-accent/15"
                  title="Manage classes you teach"
                >
                  Teaching studio
                </Link>
              )}
              <Link
                to="/learn"
                className="font-body text-sm text-foreground hover:text-accent transition-colors px-4 py-2"
                title={user.role === "INSTRUCTOR" ? "Classes you’re taking as a learner" : undefined}
              >
                My learning
              </Link>
              <Link to="/wishlist" className="font-body text-sm text-foreground hover:text-accent transition-colors px-4 py-2">
                Wishlist
              </Link>
              <Link to="/settings" className="font-body text-sm text-foreground hover:text-accent transition-colors px-4 py-2">
                Account
              </Link>
              {user.email?.toLowerCase?.() === "admin@demo.com" && (
                <Link to="/admin/moderation" className="font-body text-sm text-foreground hover:text-accent transition-colors px-4 py-2">
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={() => logout()}
                className="font-body text-sm text-muted-foreground hover:text-foreground px-4 py-2"
              >
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" className="font-body text-sm text-foreground hover:text-accent transition-colors px-4 py-2">
              Log in
            </Link>
          )}
          <button
            type="button"
            onClick={() => navigate("/login?mode=register&next=/learn")}
            className="font-body text-sm bg-foreground text-background px-6 py-3 rounded-full hover:opacity-90 transition-all duration-300 font-medium"
          >
            Get Started Free
          </button>
        </div>

        <button type="button" className="lg:hidden shrink-0 text-foreground p-1" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden border-t border-border/20 bg-background px-6 py-4 space-y-1 overflow-hidden"
          >
            {navLinks.map((link) => {
              const isHash = link.href.startsWith("#");
              const active = isHash ? activeSection === link.href.slice(1) : location.pathname === link.href;
              return (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => handleNavClick(link.href)}
                  className={`block w-full text-left font-body text-sm py-3 transition-colors ${
                    active ? "text-accent font-medium" : "text-foreground"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
            <div className="pt-3 border-t border-border/20 flex flex-col gap-2">
              {user ? (
                <>
                  {needsOnboarding && (
                    <Link
                      to={onboardingHref}
                      className="font-body text-sm font-medium text-accent border border-accent/50 bg-accent/10 px-4 py-2 rounded-full text-center"
                      onClick={() => setMobileOpen(false)}
                    >
                      Complete setup
                    </Link>
                  )}
                  {user.role === "INSTRUCTOR" && (
                    <Link
                      to="/instructor/studio"
                      className="font-body text-sm font-medium text-foreground py-2"
                      onClick={() => setMobileOpen(false)}
                    >
                      Teaching studio
                    </Link>
                  )}
                  <Link to="/learn" className="font-body text-sm text-foreground py-2" onClick={() => setMobileOpen(false)}>
                    My learning
                  </Link>
                  <Link to="/wishlist" className="font-body text-sm text-foreground py-2" onClick={() => setMobileOpen(false)}>
                    Wishlist
                  </Link>
                  <Link to="/settings" className="font-body text-sm text-foreground py-2" onClick={() => setMobileOpen(false)}>
                    Account
                  </Link>
                  {user.email?.toLowerCase?.() === "admin@demo.com" && (
                    <Link to="/admin/moderation" className="font-body text-sm text-foreground py-2" onClick={() => setMobileOpen(false)}>
                      Admin
                    </Link>
                  )}
                  <button type="button" className="font-body text-sm text-left text-foreground py-2" onClick={() => { logout(); setMobileOpen(false); }}>
                    Log out
                  </button>
                </>
              ) : (
                <Link to="/login" className="font-body text-sm text-foreground py-2 text-left" onClick={() => setMobileOpen(false)}>
                  Log in
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  navigate("/login?mode=register&next=/learn");
                }}
                className="font-body text-sm bg-foreground text-background px-5 py-3 rounded-full text-center font-medium"
              >
                Get Started Free
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
