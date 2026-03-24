import { PrismaClient, Role, PlanTier, CourseFormat } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo12345", 10);

  const ananya = await prisma.user.upsert({
    where: { email: "ananya@hobbyofinterest.test" },
    update: {},
    create: {
      email: "ananya@hobbyofinterest.test",
      passwordHash,
      name: "Ananya R.",
      role: Role.INSTRUCTOR,
      planTier: PlanTier.INSTRUCTOR_PRO,
      specialty: "Pottery & Ceramics",
      instructorStudents: 1240,
      instructorClasses: 24,
    },
  });

  const rhea = await prisma.user.upsert({
    where: { email: "rhea@hobbyofinterest.test" },
    update: {},
    create: {
      email: "rhea@hobbyofinterest.test",
      passwordHash,
      name: "Chef Rhea M.",
      role: Role.INSTRUCTOR,
      planTier: PlanTier.INSTRUCTOR_PRO,
      specialty: "Baking & Pastry",
      instructorStudents: 2100,
      instructorClasses: 18,
    },
  });

  const karthik = await prisma.user.upsert({
    where: { email: "karthik@hobbyofinterest.test" },
    update: {},
    create: {
      email: "karthik@hobbyofinterest.test",
      passwordHash,
      name: "Karthik I.",
      role: Role.INSTRUCTOR,
      planTier: PlanTier.INSTRUCTOR_PRO,
      specialty: "Woodworking",
      instructorStudents: 890,
      instructorClasses: 12,
    },
  });

  const neha = await prisma.user.upsert({
    where: { email: "neha@hobbyofinterest.test" },
    update: {},
    create: {
      email: "neha@hobbyofinterest.test",
      passwordHash,
      name: "Neha J.",
      role: Role.INSTRUCTOR,
      planTier: PlanTier.INSTRUCTOR_PRO,
      specialty: "Watercolor & Mixed Media",
      instructorStudents: 650,
      instructorClasses: 15,
    },
  });

  const sana = await prisma.user.upsert({
    where: { email: "sana@hobbyofinterest.test" },
    update: {},
    create: {
      email: "sana@hobbyofinterest.test",
      passwordHash,
      name: "Sana M.",
      role: Role.INSTRUCTOR,
      planTier: PlanTier.INSTRUCTOR_PRO,
      specialty: "Sewing & Fashion",
      instructorStudents: 420,
      instructorClasses: 10,
    },
  });

  const arjun = await prisma.user.upsert({
    where: { email: "arjun@hobbyofinterest.test" },
    update: {},
    create: {
      email: "arjun@hobbyofinterest.test",
      passwordHash,
      name: "Arjun D.",
      role: Role.INSTRUCTOR,
      planTier: PlanTier.INSTRUCTOR_PRO,
      specialty: "Guitar & Music",
      instructorStudents: 890,
      instructorClasses: 32,
    },
  });

  const devika = await prisma.user.upsert({
    where: { email: "devika@hobbyofinterest.test" },
    update: {},
    create: {
      email: "devika@hobbyofinterest.test",
      passwordHash,
      name: "Devika S.",
      role: Role.INSTRUCTOR,
      planTier: PlanTier.INSTRUCTOR_PRO,
      specialty: "Painting & Mixed Media",
      instructorStudents: 650,
      instructorClasses: 15,
    },
  });

  const ira = await prisma.user.upsert({
    where: { email: "ira@hobbyofinterest.test" },
    update: {},
    create: {
      email: "ira@hobbyofinterest.test",
      passwordHash,
      name: "Ira K.",
      role: Role.INSTRUCTOR,
      planTier: PlanTier.INSTRUCTOR_PRO,
      specialty: "Floristry & Wellness",
      instructorStudents: 198,
      instructorClasses: 8,
    },
  });

  await prisma.user.upsert({
    where: { email: "learner@demo.com" },
    update: {},
    create: {
      email: "learner@demo.com",
      passwordHash,
      name: "Demo Learner",
      role: Role.LEARNER,
      planTier: PlanTier.EXPLORER,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      passwordHash,
      name: "Demo Admin",
      role: Role.INSTRUCTOR,
      planTier: PlanTier.INSTRUCTOR_PRO,
      specialty: "Administration",
      instructorStudents: 0,
      instructorClasses: 0,
    },
  });

  const courses = [
    {
      slug: "weekend-pottery-wheel-basics",
      title: "Weekend Pottery Wheel Basics",
      description:
        "Hands-on wheel throwing for beginners. Learn centering, pulling walls, and trimming across a focused weekend studio batch. All clay and tools included.",
      category: "DIY & Maker",
      format: CourseFormat.IN_PERSON,
      locationLabel: "In-person",
      city: "Mumbai",
      durationLabel: "Sat–Sun",
      priceCents: 399_900,
      outcomes:
        "Center clay on the wheel confidently\nPull even walls and shape simple forms\nTrim and finish pieces for firing\nUnderstand studio safety and tool care",
      imageKey: "hero-pottery",
      rating: 4.9,
      studentCount: 234,
      badge: "Bestseller",
      plannerTag: "Pottery",
      instructorId: ananya.id,
    },
    {
      slug: "artisan-bread-pastry-lab",
      title: "Artisan Bread & Pastry Lab",
      description:
        "From sourdough starters to laminated dough — master foundational baking techniques in four live online sessions with weekly practice assignments.",
      category: "Food & Baking",
      format: CourseFormat.ONLINE,
      locationLabel: "Online",
      city: null,
      durationLabel: "4 sessions",
      priceCents: 329_900,
      outcomes:
        "Build and maintain a healthy sourdough starter\nLaminate dough for croissants and puff pastry\nBake consistent loaves with proper crumb structure\nTroubleshoot common fermentation issues",
      imageKey: "category-baking",
      rating: 4.8,
      studentCount: 512,
      badge: "Popular",
      plannerTag: "Baking",
      instructorId: rhea.id,
    },
    {
      slug: "woodcraft-home-decor",
      title: "Woodcraft for Home Decor",
      description:
        "Build shelves, frames, and small furniture pieces using safe power tools and hand finishing. Perfect for weekend makers.",
      category: "DIY & Maker",
      format: CourseFormat.IN_PERSON,
      locationLabel: "In-person",
      city: "Bengaluru",
      durationLabel: "6 sessions",
      priceCents: 489_900,
      outcomes:
        "Measure, cut, and join wood accurately\nUse drills and sanders safely\nApply finishes for a professional look\nComplete a small shelf or frame project",
      imageKey: "category-woodworking",
      rating: 4.7,
      studentCount: 187,
      badge: null,
      plannerTag: null,
      instructorId: karthik.id,
    },
    {
      slug: "watercolor-mixed-media",
      title: "Watercolor & Mixed Media",
      description:
        "Color theory, washes, and expressive mixed-media layers. Live demos plus async feedback on your pieces.",
      category: "Art & Craft",
      format: CourseFormat.ONLINE,
      locationLabel: "Online",
      city: null,
      durationLabel: "5 weeks",
      priceCents: 289_900,
      outcomes:
        "Mix clean, vibrant watercolor hues\nControl wet-on-wet and dry-brush techniques\nLayer mixed media without mud\nCritique and refine your own studies",
      imageKey: "category-watercolor",
      rating: 4.9,
      studentCount: 421,
      badge: "Top Rated",
      plannerTag: null,
      instructorId: neha.id,
    },
    {
      slug: "sewing-small-labels",
      title: "Sewing for Small Labels",
      description:
        "Pattern reading, machine basics, and small-batch production tips for hobby brands and side projects.",
      category: "DIY & Maker",
      format: CourseFormat.IN_PERSON,
      locationLabel: "In-person",
      city: "Delhi NCR",
      durationLabel: "Weekend batch",
      priceCents: 449_900,
      outcomes:
        "Thread, tension, and stitch basics on a home machine\nRead and adjust simple commercial patterns\nSew clean seams, hems, and closures\nPlan a tiny batch for labels or gifts",
      imageKey: "category-sewing",
      rating: 4.6,
      studentCount: 156,
      badge: null,
      plannerTag: null,
      instructorId: sana.id,
    },
    {
      slug: "acoustic-guitar-starter",
      title: "Acoustic Guitar Starter",
      description:
        "Chords, rhythm, and your first performance-ready songs. Evening cohorts with structured practice tracks.",
      category: "Music",
      format: CourseFormat.ONLINE,
      locationLabel: "Online",
      city: null,
      durationLabel: "8 weeks",
      priceCents: 239_900,
      outcomes:
        "Play open chords and smooth changes\nKeep steady strumming and simple fingerpicking\nUnderstand tuning and basic rhythm notation\nPerform two short songs confidently",
      imageKey: "category-music",
      rating: 4.8,
      studentCount: 890,
      badge: "Bestseller",
      plannerTag: "Guitar",
      instructorId: arjun.id,
    },
    {
      slug: "canvas-painting-essentials",
      title: "Canvas Painting Essentials",
      description:
        "Acrylic fundamentals, composition, and color mixing in a supportive studio environment across three weekends.",
      category: "Art & Craft",
      format: CourseFormat.IN_PERSON,
      locationLabel: "In-person",
      city: "Hyderabad",
      durationLabel: "3 weekends",
      priceCents: 349_900,
      outcomes:
        "Sketch compositions with correct proportions\nMix acrylics for hue, value, and temperature\nLayer paint without muddiness\nFinish a canvas piece from reference",
      imageKey: "hero-painting",
      rating: 4.7,
      studentCount: 312,
      badge: null,
      plannerTag: null,
      instructorId: devika.id,
    },
    {
      slug: "mindful-floral-arrangement",
      title: "Mindful Floral Arrangement",
      description:
        "Two immersive workshops on seasonal arrangements, care, and creative styling — mindful practice included.",
      category: "Wellness",
      format: CourseFormat.IN_PERSON,
      locationLabel: "In-person",
      city: "Pune",
      durationLabel: "2 workshops",
      priceCents: 289_900,
      outcomes:
        "Condition stems and extend vase life\nBuild balanced bouquets in two styles\nUse colour and texture intentionally\nPractice a short grounding ritual while arranging",
      imageKey: "hero-floristry",
      rating: 4.9,
      studentCount: 198,
      badge: "New",
      plannerTag: "Candle Making",
      instructorId: ira.id,
    },
    {
      slug: "contemporary-movement-foundation",
      title: "Contemporary Movement Foundation",
      description:
        "Build strength, expression, and confidence in a weekday evening cohort. No prior dance experience required.",
      category: "Wellness",
      format: CourseFormat.ONLINE,
      locationLabel: "Online",
      city: null,
      durationLabel: "Weekday evening cohort",
      priceCents: 289_900,
      outcomes:
        "Warm up safely for mobility and strength\nLearn foundational contemporary sequences\nImprovise within guided prompts\nReflect on posture and breath while moving",
      imageKey: "hero-floristry",
      rating: 4.8,
      studentCount: 412,
      badge: "Popular",
      plannerTag: "Dance",
      instructorId: ira.id,
    },
    {
      slug: "street-travel-photography-bootcamp",
      title: "Street & Travel Photography Bootcamp",
      description:
        "Weekend outdoor sessions covering light, framing, and editing workflows for mobile and mirrorless cameras.",
      category: "Art & Craft",
      format: CourseFormat.IN_PERSON,
      locationLabel: "In-person",
      city: "Chennai",
      durationLabel: "Weekend outdoor sessions",
      priceCents: 349_900,
      outcomes:
        "Expose for tricky outdoor light\nCompose fast in busy environments\nEdit a cohesive small set in mobile or Lightroom\nDiscuss ethics and consent in street work",
      imageKey: "category-watercolor",
      rating: 4.9,
      studentCount: 305,
      badge: "Top Rated",
      plannerTag: "Photography",
      instructorId: neha.id,
    },
    {
      slug: "scented-candle-studio-basics",
      title: "Scented Candle Studio Basics",
      description:
        "Wax types, wicking, fragrance blending, and safe pouring in a small in-person maker workshop.",
      category: "DIY & Maker",
      format: CourseFormat.IN_PERSON,
      locationLabel: "In-person",
      city: "Kolkata",
      durationLabel: "In-person maker workshop",
      priceCents: 289_900,
      outcomes:
        "Choose wax and wick for container candles\nBlend fragrance within safe load limits\nPour and finish candles without frosting issues\nLabel and cure batches for gifting",
      imageKey: "category-baking",
      rating: 4.7,
      studentCount: 178,
      badge: "New",
      plannerTag: "Candle Making",
      instructorId: rhea.id,
    },
  ];

  for (const c of courses) {
    await prisma.course.upsert({
      where: { slug: c.slug },
      update: {
        title: c.title,
        description: c.description,
        category: c.category,
        format: c.format,
        locationLabel: c.locationLabel,
        city: c.city,
        durationLabel: c.durationLabel,
        priceCents: c.priceCents,
        outcomes: c.outcomes,
        imageKey: c.imageKey,
        rating: c.rating,
        studentCount: c.studentCount,
        badge: c.badge,
        plannerTag: c.plannerTag,
        instructorId: c.instructorId,
      },
      create: c,
    });
  }

  const sectionTemplates: Array<{
    title: string;
    sortOrder: number;
    lessons: Array<{ title: string; durationMin: number; preview?: boolean; sortOrder: number }>;
  }> = [
    {
      title: "Getting Started",
      sortOrder: 1,
      lessons: [
        { title: "Welcome and setup", durationMin: 8, preview: true, sortOrder: 1 },
        { title: "Tools and materials", durationMin: 12, preview: true, sortOrder: 2 },
      ],
    },
    {
      title: "Core Practice",
      sortOrder: 2,
      lessons: [
        { title: "Foundational techniques", durationMin: 18, sortOrder: 1 },
        { title: "Guided project", durationMin: 24, sortOrder: 2 },
      ],
    },
    {
      title: "Polish and Next Steps",
      sortOrder: 3,
      lessons: [
        { title: "Common mistakes and fixes", durationMin: 14, sortOrder: 1 },
        { title: "Portfolio tips and roadmap", durationMin: 10, sortOrder: 2 },
      ],
    },
  ];

  const dbCourses = await prisma.course.findMany({ select: { id: true, slug: true } });
  for (const c of dbCourses) {
    await prisma.lessonProgress.deleteMany({ where: { lesson: { section: { courseId: c.id } } } });
    await prisma.lesson.deleteMany({ where: { section: { courseId: c.id } } });
    await prisma.courseSection.deleteMany({ where: { courseId: c.id } });

    for (const sectionTemplate of sectionTemplates) {
      const section = await prisma.courseSection.create({
        data: {
          courseId: c.id,
          title: sectionTemplate.title,
          sortOrder: sectionTemplate.sortOrder,
        },
      });
      for (const lessonTemplate of sectionTemplate.lessons) {
        await prisma.lesson.create({
          data: {
            sectionId: section.id,
            title: lessonTemplate.title,
            durationMin: lessonTemplate.durationMin,
            preview: Boolean(lessonTemplate.preview),
            sortOrder: lessonTemplate.sortOrder,
          },
        });
      }
    }
  }

  const learner = await prisma.user.findUnique({ where: { email: "learner@demo.com" } });
  if (learner) {
    const allCourses = await prisma.course.findMany({ select: { id: true, slug: true, title: true } });
    const comments = [
      "Loved the structure and hands-on guidance. Perfect for beginners.",
      "Clear explanations and practical assignments. Worth it.",
      "Good pace and supportive instructor feedback.",
      "Excellent value and very actionable sessions.",
    ];
    for (let i = 0; i < allCourses.length; i++) {
      const c = allCourses[i];
      await prisma.review.upsert({
        where: { userId_courseId: { userId: learner.id, courseId: c.id } },
        update: {
          rating: 4 + (i % 2),
          comment: comments[i % comments.length],
          reported: false,
          hidden: false,
        },
        create: {
          userId: learner.id,
          courseId: c.id,
          rating: 4 + (i % 2),
          comment: comments[i % comments.length],
          reported: false,
          hidden: false,
        },
      });
    }
  }

  const seededEmails = [
    "ananya@hobbyofinterest.test",
    "rhea@hobbyofinterest.test",
    "karthik@hobbyofinterest.test",
    "neha@hobbyofinterest.test",
    "sana@hobbyofinterest.test",
    "arjun@hobbyofinterest.test",
    "devika@hobbyofinterest.test",
    "ira@hobbyofinterest.test",
    "learner@demo.com",
    "admin@demo.com",
  ];
  await prisma.user.updateMany({
    where: { email: { in: seededEmails } },
    data: { onboardingCompletedAt: new Date() },
  });

  await prisma.user.update({
    where: { email: "learner@demo.com" },
    data: {
      onboardingProfile: {
        learner: {
          interests: ["art_craft", "food_baking", "wellness"],
          primaryGoal: "creative_outlet",
          weeklyHours: "2_5",
          formatPreference: "mixed",
          level: "beginner",
        },
      },
    },
  });

  console.log("Seed complete. Demo login: learner@demo.com / demo12345");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
