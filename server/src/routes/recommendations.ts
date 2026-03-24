import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { CourseFormat } from "@prisma/client";
import { formatInrFromPaise } from "../lib/inr.js";

const router = Router();

const bodySchema = z.object({
  interest: z.string(),
  location: z.string().optional(),
  budget: z.string().optional(),
  format: z.string().optional(),
});

/** Max price in paise (priceCents field) */
function budgetMaxPaise(budget: string | undefined): number | null {
  if (!budget) return null;
  if (budget.startsWith("Under")) return 250_000;
  if (budget.includes("2,500") && budget.includes("5,000") && budget.includes("–")) return 500_000;
  if ((budget.includes("5,000") || budget.includes("5000")) && budget.includes("+")) return 9_999_999_99;
  return null;
}

function formatPreference(f: string | undefined): "ONLINE" | "IN_PERSON" | null {
  if (!f) return null;
  if (f.includes("Online") || f.includes("Self-paced")) return CourseFormat.ONLINE;
  if (f.includes("evening") || f.includes("Weekend")) return null;
  return null;
}

router.post("/", async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { interest, budget, format } = parsed.data;
  const maxPrice = budgetMaxPaise(budget);
  const fmtPref = formatPreference(format);

  const all = await prisma.course.findMany({
    where: { published: true },
    include: { instructor: { select: { id: true, name: true } } },
    orderBy: [{ rating: "desc" }, { studentCount: "desc" }],
  });

  const interestLower = interest.toLowerCase();
  let candidates = all.filter(
    (c) =>
      (c.plannerTag && c.plannerTag.toLowerCase() === interestLower) ||
      c.title.toLowerCase().includes(interestLower) ||
      c.category.toLowerCase().includes(interestLower) ||
      (c.plannerTag && c.plannerTag.toLowerCase().includes(interestLower)),
  );

  if (candidates.length === 0) {
    candidates = [...all];
  }

  if (maxPrice !== null) {
    const within = candidates.filter((c) => c.priceCents <= maxPrice);
    if (within.length) candidates = within;
  }

  if (fmtPref) {
    const matchFmt = candidates.filter((c) => c.format === fmtPref);
    if (matchFmt.length) candidates = matchFmt;
  }

  const best = candidates[0];
  if (!best) {
    res.status(404).json({ error: "No matching class" });
    return;
  }

  const note =
    best.description.length > 220 ? `${best.description.slice(0, 217)}…` : best.description;

  res.json({
    recommendation: {
      course: {
        id: best.id,
        slug: best.slug,
        title: best.title,
        priceDisplay: formatInrFromPaise(best.priceCents),
        priceCents: best.priceCents,
        format: best.format,
        locationLabel: best.locationLabel,
        city: best.city,
        durationLabel: best.durationLabel,
        imageKey: best.imageKey,
        coverImageUrl: best.coverImageUrl,
        rating: best.rating,
        instructorName: best.instructor.name,
      },
      note,
      matchedFilters: { interest, budget, format },
    },
  });
});

export default router;
