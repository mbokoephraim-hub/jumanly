import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { getCourseSearch, getJobSearch } from "@/server/queries/public";

const querySchema = z.string().trim().min(2).max(100);
/** Three under the phone's search bar; up to six in the `Ctrl K` window of the web frame (`n`). */
const sizeSchema = z.coerce.number().int().min(1).max(6).catch(3);

export type SearchPreviewItem = { kind: "job" | "course"; title: string; href: string };

/**
 * The few results under the search bar of a phone (docs/ux-mobile-talent V7 § B1, screen 18):
 * offers and courses that match the words, alternated, three at most. Published content only; the
 * full list is on /app/recherche.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const parsed = querySchema.safeParse(params.get("q") ?? "");
  const MAX = sizeSchema.parse(params.get("n") ?? 3);
  if (!parsed.success) return NextResponse.json({ items: [] });
  if (!(await getCurrentUser())) return NextResponse.json({ items: [] }, { status: 401 });
  const [jobs, courses] = await Promise.all([
    getJobSearch({ q: parsed.data }),
    getCourseSearch({ q: parsed.data }),
  ]);
  const jobItems: SearchPreviewItem[] = jobs.jobs.slice(0, MAX).map((job) => ({
    kind: "job",
    title: job.title,
    href: `/app/jobs/${job.slug}`,
  }));
  const courseItems: SearchPreviewItem[] = courses.courses.slice(0, MAX).map((course) => ({
    kind: "course",
    title: course.title,
    href: `/app/learn/${course.slug}`,
  }));
  const items: SearchPreviewItem[] = [];
  for (let index = 0; items.length < MAX && index < MAX; index += 1) {
    if (jobItems[index]) items.push(jobItems[index]);
    if (items.length < MAX && courseItems[index]) items.push(courseItems[index]);
  }
  return NextResponse.json({ items }, { headers: { "Cache-Control": "private, no-store" } });
}
