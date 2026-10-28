import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { MyTasksScreen } from "@/components/entreprise/my-tasks";
import { pickMessages } from "@/i18n/client-messages";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { myTasks } from "@/server/services/org-team";

const PAGE = "/app/hire/taches";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("myTasks");
  return { title: t("title"), robots: { index: false } };
}

/** « Mes tâches » (étape 3, A2): the tasks the administrator entrusted to this member. */
export default async function MyTasksPage() {
  const { space, ctx } = await requireHire(PAGE);
  const [tasks, messages] = await Promise.all([myTasks(db, ctx), getMessages()]);
  return (
    <NextIntlClientProvider messages={pickMessages(messages, ["myTasks", "orgTeam"])}>
      <MyTasksScreen
        org={space.organization.name}
        tasks={tasks.map((task) => ({
          id: task.id,
          kind: task.kind,
          status: task.status,
          due: task.dueAt.toISOString(),
          late: task.late,
          applicationId: task.applicationId,
          candidate: task.candidate,
        }))}
      />
    </NextIntlClientProvider>
  );
}
