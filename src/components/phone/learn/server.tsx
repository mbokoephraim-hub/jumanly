import "server-only";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import { pickMessages } from "@/i18n/client-messages";
import { db } from "@/server/db";
import { formationHome } from "@/server/services/learn-phone";
import { listPublicPlans } from "@/server/services/plans";
import { formationView } from "./data";
import { PhoneFormation } from "./home";

/** The texts the screens of Formation need in the browser. */
export async function LearnTexts({ children }: { children: ReactNode }) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={pickMessages(messages, ["phoneLearn", "phone"])}>
      {children}
    </NextIntlClientProvider>
  );
}

/** The skills the person's offers ask most, for « Compétences demandées dans vos offres ». */
async function askedSkills(userId: string) {
  const rows = await db.jobSkill.findMany({
    where: { job: { status: "published", matchResults: { some: { profile: { userId } } } } },
    select: { skill: { select: { name: true } } },
    take: 200,
  });
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.skill.name, (counts.get(row.skill.name) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name]) => name);
}

/**
 * The Formation tab, kept mounted under the pages (brief § 3): the course to continue, why it
 * counts for the person's offers, the courses for those offers, the interview to prepare, my
 * courses and my attestations, all read at once while the logo shows.
 */
export async function FormationTab({
  user,
}: {
  user: { id: string; name: string; image: string | null };
}) {
  const now = new Date();
  const [home, plans, skills] = await Promise.all([
    formationHome(db, user.id, now),
    listPublicPlans(db),
    askedSkills(user.id),
  ]);
  const view = await formationView(home, user, plans, skills, now);
  return (
    <LearnTexts>
      <PhoneFormation view={view} />
    </LearnTexts>
  );
}
