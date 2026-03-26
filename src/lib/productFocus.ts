/**
 * When true (via VITE_MVP_INSTRUCTOR_FOCUS), the UI prioritizes:
 * create class → invite students → attendance/fees, and de-emphasizes marketplace-style flows.
 */
export function mvpInstructorFocus(): boolean {
  const v = import.meta.env.VITE_MVP_INSTRUCTOR_FOCUS;
  return v === "1" || v === "true";
}
