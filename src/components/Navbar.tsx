import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Find Passion", href: "#categories" },
  { label: "Categories", href: "#categories" },
  { label: "Skills", href: "#skills" },
  { label: "Customer", href: "#testimonials" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-background/90 backdrop-blur-xl sticky top-0 z-50 border-b border-border/30">
      <div className="container mx-auto flex items-center justify-between h-18 px-6 py-4">
        <a href="#" className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Hobby of Interest<span className="text-accent">.</span>
        </a>

        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-body text-sm tracking-wide text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-5">
          <a href="#" className="font-body text-sm text-foreground hover:text-primary transition-colors">
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
          className="md:hidden text-foreground"
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
            className="md:hidden border-t border-border/20 bg-background px-6 py-4 space-y-3 overflow-hidden"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block font-body text-sm text-foreground py-2"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-border/20 flex flex-col gap-2">
              <a href="#" className="font-body text-sm text-foreground py-2">Login</a>
              <a href="#" className="font-body text-sm bg-foreground text-background px-5 py-2.5 rounded-full text-center">
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
