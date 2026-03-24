import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-muted px-4 py-16">
      <div className="text-center max-w-md w-full">
        <h1 className="font-heading mb-3 text-5xl sm:text-6xl font-light text-foreground">404</h1>
        <p className="mb-6 font-body text-base sm:text-lg text-muted-foreground">That page doesn’t exist or was moved.</p>
        <a
          href="/"
          className="inline-flex rounded-full bg-foreground px-6 py-3 font-body text-sm text-background hover:opacity-90 transition-opacity"
        >
          Return home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
