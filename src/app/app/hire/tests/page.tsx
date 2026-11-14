import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { HireV3Tests, TESTS_TABS, type TestsTab } from "@/components/hire-v3/tests";
import { isHireScope } from "@/lib/product-scope";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { jobScope } from "@/server/services/hire";
import {
  testLibrary,
  testResults,
  testsOverview,
  testsWithResults,
} from "@/server/services/hire-v3-tests";

const PAGE = "/app/hire/tests";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireV3Tests");
  return { title: t("title"), robots: { index: false } };
}

/** « Tests » of the recruiter's web app v3 (`V.tests` of the prototype, screens 29-31). */
export default async function Page({ searchParams }: PageProps<"/app/hire/tests">) {
  if (!isHireScope()) notFound();
  const { ctx } = await requireHire(PAGE);
  const query = await searchParams;
  const tab: TestsTab =
    (Object.keys(TESTS_TABS) as TestsTab[]).find((key) => TESTS_TABS[key] === query.onglet) ??
    "mine";
  const [overview, withResults, jobs] = await Promise.all([
    testsOverview(db, ctx),
    testsWithResults(db, ctx),
    jobScope(db, ctx).then((scope) =>
      db.job.findMany({
        where: { AND: [scope, { status: { in: ["published", "paused", "draft"] } }] },
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: { id: true, title: true },
      }),
    ),
  ]);
  const wanted = typeof query.test === "string" ? query.test : null;
  const selected = withResults.find((x) => x.id === wanted) ?? withResults[0];
  const results = tab === "results" && selected ? await testResults(db, ctx, selected.id) : null;
  return (
    <HireV3Tests
      tab={tab}
      overview={overview}
      results={results}
      withResults={withResults}
      library={testLibrary()}
      jobs={jobs}
      query={query}
    />
  );
}
