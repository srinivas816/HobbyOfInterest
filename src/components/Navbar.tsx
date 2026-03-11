import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Categories", href: "#categories" },
  { label: "Skills", href: "#skills" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const sections = navLinks.map(l => l.href.slice(1));
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
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-500 ${
      scrolled 
        ? "bg-background/95 backdrop-blur-xl shadow-sm border-b border-border/30" 
        : "bg-background/80 backdrop-blur-md"
    }`}>
      <div className="container mx-auto flex items-center justify-between h-18 px-6 py-4">
        <a href="#" className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Hobby of Interest<span className="text-accent">.</span>
        </a>

        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNavClick(link.href)}
              className={`font-body text-sm tracking-wide transition-colors duration-300 ${
                activeSection === link.href.slice(1)
                  ? "text-accent font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-5">
          <a href="#" className="font-body text-sm text-foreground hover:text-accent transition-colors">
            Login
          </a>
          <a
            href="#"
            className="font-body text-sm bg-foreground text-background px-6 py-3 rounded-full hover:opacity-90 transition-all duration-300 font-medium"
          >
            Free Trial
          </a>
        </div>

        <button
          className="lg:hidden text-foreground p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
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
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                className={`block w-full text-left font-body text-sm py-3 transition-colors ${
                  activeSection === link.href.slice(1) ? "text-accent font-medium" : "text-foreground"
                }`}
              >
                {link.label}
              </button>
            ))}
            <div className="pt-3 border-t border-border/20 flex flex-col gap-2">
              <a href="#" className="font-body text-sm text-foreground py-2">Login</a>
              <a href="#" className="font-body text-sm bg-foreground text-background px-5 py-3 rounded-full text-center font-medium">
                Free Trial
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
