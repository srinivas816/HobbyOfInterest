import { Navigate, useParams } from "react-router-dom";

/** Unknown `/instructor/class/:slug/*` → class hub */
const InstructorClassCatchAllRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  const s = slug?.trim() ?? "";
  if (!s) return <Navigate to="/instructor/classes" replace />;
  return <Navigate to={`/instructor/class/${encodeURIComponent(s)}`} replace />;
};

export default InstructorClassCatchAllRedirect;
