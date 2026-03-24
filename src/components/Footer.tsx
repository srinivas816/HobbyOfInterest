import { Link } from "react-router-dom";
import ScrollReveal from "./ScrollReveal";

const footerLink = "font-body text-xs sm:text-sm text-dark-foreground/80 hover:text-accent transition-colors duration-300";

const Footer = () => (
  <footer className="section-dark border-t border-dark-border">
    <div className="container mx-auto py-12 md:py-16">
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

          <div>
            <h4 className="font-body text-[10px] sm:text-xs tracking-widest uppercase text-dark-muted mb-4 sm:mb-5">Platform</h4>
            <ul className="space-y-2.5 sm:space-y-3">
              <li>
                <Link to="/courses" className={footerLink}>
                  Browse classes
                </Link>
              </li>
              <li>
                <Link to="/instructors" className={footerLink}>
                  Find instructors
                </Link>
              </li>
              <li>
                <Link to="/#planner" className={footerLink}>
                  Smart planner
                </Link>
              </li>
              <li>
                <Link to="/#pricing" className={footerLink}>
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/#app-download" className={footerLink}>
                  Mobile app
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-body text-[10px] sm:text-xs tracking-widest uppercase text-dark-muted mb-4 sm:mb-5">Learn</h4>
            <ul className="space-y-2.5 sm:space-y-3">
              <li>
                <Link to="/courses" className={footerLink}>
                  Online classes
                </Link>
              </li>
              <li>
                <Link to="/courses" className={footerLink}>
                  Catalog & formats
                </Link>
              </li>
              <li>
                <Link to="/learn" className={footerLink}>
                  My learning
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className={footerLink}>
                  Wishlist
                </Link>
              </li>
              <li>
                <span className={`${footerLink} opacity-60 cursor-default`}>Gift cards (coming soon)</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-body text-[10px] sm:text-xs tracking-widest uppercase text-dark-muted mb-4 sm:mb-5">Teach</h4>
            <ul className="space-y-2.5 sm:space-y-3">
              <li>
                <Link to="/login?mode=register&role=instructor" className={footerLink}>
                  Become an instructor
                </Link>
              </li>
              <li>
                <Link to="/instructor/studio" className={footerLink}>
                  Instructor Studio
                </Link>
              </li>
              <li>
                <Link to="/instructor/studio#studio-analytics" className={footerLink}>
                  Class analytics
                </Link>
              </li>
              <li>
                <span className={`${footerLink} opacity-60 cursor-default`}>Marketing tools (roadmap)</span>
              </li>
              <li>
                <Link to="/#faq" className={footerLink}>
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-body text-[10px] sm:text-xs tracking-widest uppercase text-dark-muted mb-4 sm:mb-5">Legal</h4>
            <ul className="space-y-2.5 sm:space-y-3">
              <li>
                <Link to="/privacy" className={footerLink}>
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className={footerLink}>
                  Terms
                </Link>
              </li>
              <li>
                <Link to="/cookies" className={footerLink}>
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </ScrollReveal>

      <div className="border-t border-dark-border mt-10 md:mt-12 pt-6 md:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="font-body text-[10px] sm:text-xs text-dark-muted">
          © 2026 Hobby of Interest. All rights reserved.
        </p>
        <div className="flex gap-5 sm:gap-6">
          <Link to="/privacy" className="font-body text-[10px] sm:text-xs text-dark-muted hover:text-accent transition-colors duration-300">
            Privacy
          </Link>
          <Link to="/terms" className="font-body text-[10px] sm:text-xs text-dark-muted hover:text-accent transition-colors duration-300">
            Terms
          </Link>
          <Link to="/cookies" className="font-body text-[10px] sm:text-xs text-dark-muted hover:text-accent transition-colors duration-300">
            Cookies
          </Link>
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
