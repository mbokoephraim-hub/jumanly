import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Icon, type IconName } from "@/components/brand/icon";
import { Pressable } from "@/components/ui";
import { cx } from "@/lib/cx";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { getPartnerSpace } from "@/server/partner-context";
import { isClosedStatus, listApplications, talentStatus } from "@/server/services/applications";
import { unreadCount } from "@/server/services/connect";
import { openDrafts } from "@/server/services/application-draft";
import { followUpActions } from "@/server/services/follow-up";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("talent.suivi");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

function Row({
  href,
  icon,
  tone,
  title,
  line,
}: {
  href: string;
  icon: IconName;
  tone: string;
  title: string;
  line: string;
}) {
  return (
    <Pressable href={href}>
      <span
        aria-hidden
        className={cx("grid size-11 shrink-0 place-items-center rounded-[13px]", tone)}
      >
        <Icon name={icon} className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[14.5px] leading-snug font-semibold">{title}</span>
        <span className="truncate text-[12.5px] text-ardoise">{line}</span>
      </span>
    </Pressable>
  );
}

/**
 * Suivi (docs/ux-mobile-talent, prompt 2): the fourth destination of the bottom bar. What waits for
 * the talent first (the same count as the badge), then the applications, the messages and the
 * saved offers. Prompt 5 gives it its full content (timeline, interviews, drafts).
 */
export default async function SuiviPage() {
  const user = await requireUser("/app/suivi");
  if (await getActiveSpace(user.id)) redirect("/app/hire");
  if (await getPartnerSpace(user.id)) redirect("/app/partenaire");
  const t = await getTranslations("talent.suivi");
  const now = new Date();
  const [actions, applications, unread, saved, drafts] = await Promise.all([
    followUpActions(db, user.id, now),
    listApplications(db, user.id),
    unreadCount(db, { userId: user.id }),
    db.savedJob.count({ where: { userId: user.id } }),
    openDrafts(db, user.id, now),
  ]);
  const active = applications.filter(
    (application) => !isClosedStatus(talentStatus(application, now)),
  ).length;
  const todo = [
    { count: actions.interviews, icon: "calendrier", key: "interviews" },
    { count: actions.documents, icon: "doc", key: "documents" },
    { count: actions.messages, icon: "message", key: "messages" },
  ] as const;

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 pb-6">
      {/* On a phone the top bar already shows « Suivi ». */}
      <h1 className="text-[28px] font-semibold tracking-[-0.02em] max-md:sr-only">{t("title")}</h1>

      <section aria-labelledby="suivi-todo" className="flex flex-col gap-2.5">
        <h2 id="suivi-todo" className="text-[17px] font-semibold">
          {t("todo.title")}
        </h2>
        {actions.total === 0 ? (
          <p className="rounded-[20px] bg-blanc p-4 text-[14px] text-ardoise shadow-douce">
            {t("todo.empty")}
          </p>
        ) : (
          todo
            .filter((item) => item.count > 0)
            .map((item) => (
              <Row
                key={item.key}
                href="/app/messages"
                icon={item.icon}
                tone="bg-lime"
                title={t(`todo.${item.key}`, { count: item.count })}
                line={t("todo.line")}
              />
            ))
        )}
      </section>

      {drafts.length > 0 && (
        <section aria-labelledby="suivi-brouillons" className="flex flex-col gap-2.5">
          <h2 id="suivi-brouillons" className="text-[17px] font-semibold">
            {t("drafts.title")}
          </h2>
          {drafts.map((draft) => (
            <Row
              key={draft.job.slug}
              href={`/app/jobs/${draft.job.slug}?postuler=1`}
              icon="jobs"
              tone="bg-creme"
              title={draft.job.title}
              line={t("drafts.line", {
                company: draft.job.organization.name,
                date: draft.updatedAt,
              })}
            />
          ))}
        </section>
      )}

      <section aria-labelledby="suivi-liens" className="flex flex-col gap-2.5">
        <h2 id="suivi-liens" className="text-[17px] font-semibold">
          {t("links.title")}
        </h2>
        <Row
          href="/app/jobs/candidatures"
          icon="send"
          tone="bg-menthe-claire"
          title={t("links.applications")}
          line={t("links.applicationsLine", { count: active })}
        />
        <Row
          href="/app/messages"
          icon="message"
          tone="bg-lime-clair"
          title={t("links.messages")}
          line={unread > 0 ? t("todo.messages", { count: unread }) : t("links.messagesLine")}
        />
        <Row
          href="/app/jobs/enregistrees"
          icon="favori"
          tone="bg-creme"
          title={t("links.saved")}
          line={t("links.savedLine", { count: saved })}
        />
      </section>
    </div>
  );
}
