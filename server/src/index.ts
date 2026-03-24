import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import coursesRoutes from "./routes/courses.js";
import recommendationsRoutes from "./routes/recommendations.js";
import enrollmentsRoutes from "./routes/enrollments.js";
import newsletterRoutes from "./routes/newsletter.js";
import instructorsRoutes from "./routes/instructors.js";
import meRoutes from "./routes/me.js";
import favoritesRoutes from "./routes/favorites.js";
import progressRoutes from "./routes/progress.js";
import checkoutRoutes from "./routes/checkout.js";
import instructorStudioRoutes from "./routes/instructorStudio.js";
import adminRoutes from "./routes/admin.js";
import uploadsRoutes from "./routes/uploads.js";
import onboardingRoutes from "./routes/onboarding.js";
import courseEngagementRoutes from "./routes/courseEngagement.js";

const app = express();
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
const PORT = Number(process.env.PORT) || 3001;

function parseCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN?.trim();
  const fallback = "http://localhost:8080,http://127.0.0.1:8080";
  const source = raw && raw.length > 0 ? raw : fallback;
  return source
    .split(",")
    .map((s) =>
      s
        .trim()
        .replace(/^["']+|["']+$/g, "")
        .replace(/\/+$/, ""),
    )
    .filter(Boolean);
}

const corsOrigins = parseCorsOrigins();

// Bearer JWT is sent in Authorization — not cookies — so credentials:false is fine and avoids stricter CORS behavior.
app.use(
  cors({
    origin: corsOrigins,
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

console.log(`CORS allow list (${corsOrigins.length}): ${corsOrigins.join(" | ")}`);
const onlyLoopback =
  corsOrigins.length > 0 &&
  corsOrigins.every((o) => o.startsWith("http://localhost") || o.startsWith("http://127.0.0.1"));
if (process.env.NODE_ENV === "production" && onlyLoopback) {
  console.warn(
    "WARNING: CORS_ORIGIN is missing or only lists localhost — Netlify/Vercel will be blocked. On Render, set CORS_ORIGIN=https://YOUR-SITE.netlify.app (comma-separate multiple origins).",
  );
}
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "Hobby of Interest API",
    health: "/api/health",
    hint: "This URL is the backend. Open your Netlify/Vercel site for the app.",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/enrollments", enrollmentsRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/instructors", instructorsRoutes);
app.use("/api/me", meRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/instructor-studio", instructorStudioRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/course-engagement", courseEngagementRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Render (and most PaaS) require listening on all interfaces — not only loopback —
// or the health check / port scan never sees an open port and deploy times out.
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API listening on 0.0.0.0:${PORT}`);
});
