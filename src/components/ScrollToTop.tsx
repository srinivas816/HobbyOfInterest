import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets the window scroll position on route changes. React Router does not do this by default,
 * which caused stuck or misleading scroll positions (e.g. mid-page after navigating from a long page).
 * Hash targets are handled by layout/page effects that run after this flush.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
