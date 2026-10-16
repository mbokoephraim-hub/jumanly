/**
 * Test helper run with tsx (Playwright cannot load the Prisma client), Learn v2 étape 3: creates an
 * obviously fictional, free, published course with one video lesson, whose video address the test
 * serves itself. `tsx tests/e2e/make-video-course.ts <slug> <videoUrl>` prints the lesson id;
 * `tsx tests/e2e/make-video-course.ts <slug> --delete` removes the course and what hangs on it.
 */
import { createSeedClient } from "../../prisma/seed/client";

const [slug, video] = process.argv.slice(2);
const db = createSeedClient();

async function main() {
  if (video === "--delete") {
    await db.enrollment.deleteMany({ where: { course: { slug } } });
    await db.course.deleteMany({ where: { slug } });
    return;
  }
  const course = await db.course.create({
    data: {
      slug: slug!,
      title: `Formation vidéo fictive ${slug!.slice(-6)}`,
      summary: "Formation fictive créée par un test automatique.",
      description: "Formation fictive créée par un test automatique.",
      audience: "Test",
      category: "Test",
      level: "beginner",
      status: "published",
      // Far in the past: the public catalog lists newest first, so tests that open its first
      // course never land on this one while it is being deleted.
      publishedAt: new Date("2000-01-01T00:00:00Z"),
      requiredLevel: "free",
      durationMinutes: 1,
      modules: {
        create: {
          order: 1,
          title: "Module fictif",
          lessons: {
            create: [
              {
                order: 1,
                title: "Leçon vidéo fictive",
                kind: "video",
                videoId: video,
                durationSec: 60,
              },
              { order: 2, title: "Leçon texte fictive", kind: "text", durationSec: 60 },
            ],
          },
        },
      },
    },
    include: { modules: { include: { lessons: { orderBy: { order: "asc" } } } } },
  });
  process.stdout.write(course.modules[0]!.lessons[0]!.id);
}

main().finally(() => db.$disconnect());
