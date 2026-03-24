import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { formatInrFromPaise } from "../lib/inr.js";
import { pathParam } from "../lib/httpParams.js";

const router = Router();

router.get("/", async (_req, res) => {
  const instructors = await prisma.user.findMany({
    where: { role: "INSTRUCTOR" },
    orderBy: { instructorStudents: "desc" },
    select: {
      id: true,
      name: true,
      specialty: true,
      instructorStudents: true,
      instructorClasses: true,
      coursesTeaching: {
        take: 1,
        orderBy: { studentCount: "desc" },
        select: { imageKey: true, coverImageUrl: true },
      },
    },
  });

  res.json({
    instructors: instructors.map((i) => ({
      id: i.id,
      name: i.name,
      specialty: i.specialty || "Instructor",
      students: i.instructorStudents,
      classes: i.instructorClasses,
      rating: 4.8,
      imageKey: i.coursesTeaching[0]?.imageKey ?? "hero-pottery",
      coverImageUrl: i.coursesTeaching[0]?.coverImageUrl ?? null,
    })),
  });
});

router.get("/:id", async (req, res) => {
  const id = pathParam(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const instructor = await prisma.user.findFirst({
    where: { id, role: "INSTRUCTOR" },
    select: {
      id: true,
      name: true,
      specialty: true,
      instructorStudents: true,
      instructorClasses: true,
      coursesTeaching: {
        where: { published: true },
        orderBy: { studentCount: "desc" },
        select: {
          slug: true,
          title: true,
          imageKey: true,
          coverImageUrl: true,
          rating: true,
          studentCount: true,
          priceCents: true,
          durationLabel: true,
          badge: true,
          format: true,
          locationLabel: true,
        },
      },
    },
  });
  if (!instructor) {
    res.status(404).json({ error: "Instructor not found" });
    return;
  }
  res.json({
    instructor: {
      id: instructor.id,
      name: instructor.name,
      specialty: instructor.specialty || "Instructor",
      students: instructor.instructorStudents,
      classes: instructor.instructorClasses,
      rating: 4.85,
      courses: instructor.coursesTeaching.map((c) => ({
        ...c,
        priceDisplay: formatInrFromPaise(c.priceCents),
      })),
    },
  });
});

export default router;
