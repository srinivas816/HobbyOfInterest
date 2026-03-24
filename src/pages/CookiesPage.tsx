import { Link } from "react-router-dom";

const CookiesPage = () => (
  <main className="container mx-auto py-16 md:py-24 max-w-3xl">
    <Link to="/" className="text-sm text-muted-foreground hover:text-accent underline-offset-2 hover:underline">
      ← Back to home
    </Link>
    <h1 className="font-heading text-3xl md:text-4xl mt-8 text-foreground">Cookie notice</h1>
    <p className="font-body text-sm text-muted-foreground mt-2">Last updated: March 2026 · Demo / placeholder text</p>
    <div className="mt-10 space-y-6 font-body text-sm text-muted-foreground leading-relaxed">
      <p>
        This demo may store an authentication token in <strong className="text-foreground">browser local storage</strong> after you log in,
        so the app can call the API on your behalf. That behaves similarly to a persistent session cookie.
      </p>
      <p>
        We do not run third-party advertising cookies in this template. If you add analytics or ads, update this page and your consent UI
        accordingly.
      </p>
      <p>
        For broader data practices, see the{" "}
        <Link to="/privacy" className="text-accent underline-offset-2 hover:underline">
          Privacy policy
        </Link>
        .
      </p>
    </div>
  </main>
);

export default CookiesPage;
