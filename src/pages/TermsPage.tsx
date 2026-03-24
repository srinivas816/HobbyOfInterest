import { Link } from "react-router-dom";

const TermsPage = () => (
  <main className="container mx-auto py-16 md:py-24 max-w-3xl">
    <Link to="/" className="text-sm text-muted-foreground hover:text-accent underline-offset-2 hover:underline">
      ← Back to home
    </Link>
    <h1 className="font-heading text-3xl md:text-4xl mt-8 text-foreground">Terms of use</h1>
    <p className="font-body text-sm text-muted-foreground mt-2">Last updated: March 2026 · Demo / placeholder text</p>
    <div className="mt-10 space-y-6 font-body text-sm text-muted-foreground leading-relaxed">
      <p>
        These terms govern use of the <strong className="text-foreground">Hobby of Interest</strong> demo. They are not legal advice;
        replace with jurisdiction-specific terms before launch.
      </p>
      <h2 className="font-heading text-lg text-foreground pt-2">The service</h2>
      <p>
        We provide a marketplace-style experience to browse classes, enroll (demo), track lesson progress, and (for instructors) manage
        curriculum. Features labelled as scaffold or demo may change or be incomplete.
      </p>
      <h2 className="font-heading text-lg text-foreground pt-2">Accounts & conduct</h2>
      <p>You agree not to misuse the platform, harass others, or attempt unauthorized access to systems or data.</p>
      <h2 className="font-heading text-lg text-foreground pt-2">Content</h2>
      <p>Instructors are responsible for class content they publish. Learners use content at their own risk subject to your final policies.</p>
      <h2 className="font-heading text-lg text-foreground pt-2">Disclaimers</h2>
      <p>The service is provided “as is” in demo form without warranties. Limitation of liability clauses belong in your production terms.</p>
    </div>
  </main>
);

export default TermsPage;
