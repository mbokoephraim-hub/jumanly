import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Alert, Badge, Button, ButtonLink, EmptyState } from "@/components/ui";
import { cx } from "@/lib/cx";
import { withdrawAction } from "@/server/actions/jobs";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  isClosedStatus,
  listApplications,
  talentStatus,
  type TalentApplicationStatus,
} from "@/server/services/applications";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("talent.jobs.applications");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

const tones: Partial<Record<TalentApplicationStatus, "success" | "warning" | "neutral" | "jobs">> =
  {
    hired: "success",
    offer: "success",
    interview: "jobs",
    test: "jobs",
    shortlisted: "jobs",
    notSelected: "neutral",
    withdrawn: "neutral",
    jobClosed: "neutral",
  };

const stageName = (payload: unknown) =>
  payload && typeof payload === "object" && "to" in payload && typeof payload.to === "string"
    ? payload.to
    : null;

/** « Mes candidatures » (partie 07 § 5): status, history, withdrawal, the CV that was sent. */
export default async function ApplicationsPage({
  searchParams,
}: PageProps<"/app/jobs/candidatures">) {
  const params = await searchParams;
  const user = await requireUser("/app/jobs/candidatures");
  const t = await getTranslations("talent.jobs.applications");
  const now = new Date();
  const applications = (await listApplications(db, user.id)).map((application) => ({
    ...application,
    talentStatus: talentStatus(application, now),
  }));
  const active = applications.filter((item) => !isClosedStatus(item.talentStatus));
  const closed = applications.filter((item) => isClosedStatus(item.talentStatus));
  const tab =
    params.onglet === "terminees"
      ? "terminees"
      : params.onglet === "toutes"
        ? "toutes"
        : "en-cours";
  const shown = tab === "terminees" ? closed : tab === "toutes" ? applications : active;
  const tabs = [
    { id: "en-cours", label: t("tab.active", { count: active.length }) },
    { id: "terminees", label: t("tab.closed", { count: closed.length }) },
    { id: "toutes", label: t("tab.all") },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1">{t("title")}</h1>
        <p className="text-ardoise">{t("subtitle")}</p>
      </header>
      {params.ok === "retiree" && <Alert tone="success" title={t("withdrawn.toast")} />}
      <nav aria-label={t("title")} className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={`/app/jobs/candidatures?onglet=${item.id}`}
            aria-current={tab === item.id ? "page" : undefined}
            className={cx(
              "rounded-pill px-4 py-2 text-[15px] font-medium",
              tab === item.id ? "bg-sapin text-blanc" : "bg-blanc",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {applications.length === 0 ? (
        <EmptyState
          title={t("empty.text")}
          action={<ButtonLink href="/app/jobs">{t("empty.cta")}</ButtonLink>}
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {shown.map((application) => (
            <li key={application.id} className="flex flex-col gap-4 rounded-card bg-blanc p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h2 className="font-semibold text-h3">
                    <Link href={`/app/jobs/${application.job.slug}`} className="underline">
                      {application.job.title}
                    </Link>
                  </h2>
                  <p className="text-sm text-ardoise">
                    {application.job.organization.name}
                    {" · "}
                    {application.job.city}
                  </p>
                  <p className="text-sm text-ardoise">
                    {t("sentOn", { date: application.createdAt })}
                  </p>
                </div>
                <Badge tone={tones[application.talentStatus] ?? "jobs"}>
                  {t(`status.${application.talentStatus}`)}
                </Badge>
              </div>
              {application.talentStatus === "notSelected" && (
                <Alert
                  title={t("notSelected.note")}
                  action={
                    <ButtonLink href="/app/jobs" variant="tertiary" size="sm">
                      {t("notSelected.cta")}
                    </ButtonLink>
                  }
                />
              )}
              {application.talentStatus === "hired" && (
                <Alert
                  tone="success"
                  title={t("hired.note", { firstName: user.firstName ?? user.name })}
                />
              )}
              <details>
                <summary className="cursor-pointer text-sm font-medium">
                  {t("timeline.text")}
                </summary>
                <ol className="mt-3 flex flex-col gap-2 border-l-2 border-brume pl-4 text-sm">
                  {application.events.map((event) => (
                    <li key={event.id}>
                      {t("timeline.event", {
                        date: event.createdAt,
                        event:
                          event.type === "stage_changed"
                            ? t("event.stage_changed", {
                                stage: stageName(event.payload) ?? application.stage.name,
                              })
                            : event.type === "viewed"
                              ? t("status.viewed")
                              : event.type === "withdrawn"
                                ? t("event.withdrawn")
                                : event.type === "decision"
                                  ? t("event.decision")
                                  : t("event.submitted"),
                      })}
                    </li>
                  ))}
                </ol>
                <p className="mt-2 text-ardoise text-caption">{t("status.help")}</p>
              </details>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link href={`/app/jobs/${application.job.slug}`} className="underline">
                  {t("viewJob")}
                </Link>
                {application.cvSnapshot !== null && (
                  <a href={`/app/jobs/candidatures/${application.id}/cv`} className="underline">
                    {t("viewSentCv")}
                  </a>
                )}
                {application.status === "active" && !isClosedStatus(application.talentStatus) && (
                  <details className="w-full">
                    <summary className="cursor-pointer font-medium underline">
                      {t("withdraw.text")}
                    </summary>
                    <form
                      action={withdrawAction}
                      className="mt-3 flex flex-col items-start gap-3 rounded-md bg-creme p-4"
                    >
                      <input type="hidden" name="id" value={application.id} />
                      <p className="font-semibold">{t("withdraw.confirm.title")}</p>
                      <p>{t("withdraw.confirm.body")}</p>
                      <Button type="submit" variant="danger" size="sm">
                        {t("withdraw.confirm.cta")}
                      </Button>
                    </form>
                  </details>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
