import ScrollReveal from "./ScrollReveal";

const Footer = () => {
  return (
    <footer className="section-dark border-t border-dark-border">
      <div className="container mx-auto px-6 py-12 md:py-16">
        <ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
            <div className="col-span-2 md:col-span-1">
              <span className="font-heading text-xl font-bold text-dark-foreground">
                Hobby of Interest<span className="text-accent">.</span>
              </span>
              <p className="font-body text-xs sm:text-sm text-dark-muted mt-4 leading-relaxed max-w-xs">
                A marketplace for people who want to learn with their hands. Discover, create, and grow.
              </p>
            </div>

            {[
              {
                title: "Platform",
                links: ["Browse Classes", "For Instructors", "Pricing", "How It Works", "FAQ"],
              },
              {
                title: "Company",
                links: ["About", "Blog", "Careers", "Press", "Contact"],
              },
              {
                title: "Legal",
                links: ["Privacy", "Terms", "Cookie Policy", "Accessibility"],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-body text-[10px] sm:text-xs tracking-widest uppercase text-dark-muted mb-4 sm:mb-5">
                  {col.title}
                </h4>
                <ul className="space-y-2.5 sm:space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="font-body text-xs sm:text-sm text-dark-foreground/80 hover:text-accent transition-colors duration-300">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <div className="border-t border-dark-border mt-10 md:mt-12 pt-6 md:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-body text-[10px] sm:text-xs text-dark-muted">
            © 2026 Hobby of Interest. All rights reserved.
          </p>
          <div className="flex gap-5 sm:gap-6">
            {["Twitter", "Instagram", "LinkedIn", "YouTube"].map((s) => (
              <a key={s} href="#" className="font-body text-[10px] sm:text-xs text-dark-muted hover:text-accent transition-colors duration-300">
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
