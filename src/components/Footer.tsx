import ScrollReveal from "./ScrollReveal";

const Footer = () => (
  <footer className="section-dark border-t border-dark-border">
    <div className="container mx-auto px-6 py-12 md:py-16">
      <ScrollReveal>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-10">
          <div className="col-span-2 md:col-span-1">
            <span className="font-heading text-xl font-bold text-dark-foreground">
              Hobby of Interest<span className="text-accent">.</span>
            </span>
            <p className="font-body text-xs sm:text-sm text-dark-muted mt-4 leading-relaxed max-w-xs">
              The hobby marketplace for learners and creators. Discover, book, and master creative skills — online or in-person.
            </p>
          </div>

          {[
            {
              title: "Platform",
              links: ["Browse Classes", "Find Instructors", "Smart Planner", "Pricing", "Mobile App"],
            },
            {
              title: "Learn",
              links: ["Online Classes", "In-person Studios", "Weekend Workshops", "Self-paced Courses", "Gift Cards"],
            },
            {
              title: "Teach",
              links: ["Become an Instructor", "Instructor Dashboard", "Marketing Tools", "Analytics", "Help Center"],
            },
            {
              title: "Company",
              links: ["About Us", "Blog", "Careers", "Press", "Contact"],
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
          {["Privacy", "Terms", "Cookies"].map((s) => (
            <a key={s} href="#" className="font-body text-[10px] sm:text-xs text-dark-muted hover:text-accent transition-colors duration-300">
              {s}
            </a>
          ))}
        </div>
        <div className="flex gap-5 sm:gap-6">
          {["Instagram", "YouTube", "Twitter", "LinkedIn"].map((s) => (
            <a key={s} href="#" className="font-body text-[10px] sm:text-xs text-dark-muted hover:text-accent transition-colors duration-300">
              {s}
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
