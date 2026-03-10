import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Find Hobby", href: "#categories" },
  { label: "Categories", href: "#categories" },
  { label: "Skills", href: "#skills" },
  { label: "Testimonials", href: "#testimonials" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="border-b border-foreground/10 bg-background sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-6">
        <a href="#" className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Hobby of Interest<span className="text-primary">.</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-body text-sm tracking-wide text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <a href="#" className="font-body text-sm text-foreground hover:text-primary transition-colors">
            Login
          </a>
          <a
            href="#"
            className="font-body text-sm bg-primary text-primary-foreground px-5 py-2.5 hover:opacity-90 transition-opacity"
          >
            Get Started
          </a>
        </div>

        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-foreground/10 bg-background px-6 py-4 space-y-3">
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
          <div className="pt-3 border-t border-foreground/10 flex flex-col gap-2">
            <a href="#" className="font-body text-sm text-foreground py-2">Login</a>
            <a href="#" className="font-body text-sm bg-primary text-primary-foreground px-5 py-2.5 text-center">
              Get Started
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
