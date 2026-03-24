import { Link } from "react-router-dom";

const PrivacyPage = () => (
  <main className="container mx-auto py-16 md:py-24 max-w-3xl">
    <Link to="/" className="text-sm text-muted-foreground hover:text-accent underline-offset-2 hover:underline">
      ← Back to home
    </Link>
    <h1 className="font-heading text-3xl md:text-4xl mt-8 text-foreground">Privacy policy</h1>
    <p className="font-body text-sm text-muted-foreground mt-2">Last updated: March 2026 · Demo / placeholder text</p>
    <div className="mt-10 space-y-6 font-body text-sm text-muted-foreground leading-relaxed">
      <p>
        This page describes how <strong className="text-foreground">Hobby of Interest</strong> (“we”) handles information in this demo
        application. Replace this copy with counsel-reviewed language before production.
      </p>
      <h2 className="font-heading text-lg text-foreground pt-2">What we collect</h2>
      <p>
        Accounts may include your name, email, and learning preferences you choose to save. Class activity (such as enrollments and lesson
        progress) is stored to run the product. Newsletter signups store email addresses you submit.
      </p>
      <h2 className="font-heading text-lg text-foreground pt-2">How we use data</h2>
      <p>We use this data to operate classes, recommendations, instructor tools, and (when enabled) optional AI-assisted onboarding.</p>
      <h2 className="font-heading text-lg text-foreground pt-2">Cookies</h2>
      <p>
        The site may use essential cookies or local storage for session tokens in this demo. See also our{" "}
        <Link to="/cookies" className="text-accent underline-offset-2 hover:underline">
          Cookie notice
        </Link>
        .
      </p>
      <h2 className="font-heading text-lg text-foreground pt-2">Contact</h2>
      <p>For privacy questions in production, publish a contact email or form here.</p>
    </div>
  </main>
);

export default PrivacyPage;
