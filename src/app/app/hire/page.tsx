import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Alert } from "@/components/ui";
import { Icon, type IconName } from "@/components/brand";
import { AppPageHeader } from "@/components/app/page-header";
import { pillClass } from "@/components/career/kit";
import { tag, tagTone } from "@/components/jobs/talent-kit";
import {
  ActionRow,
  barKinds,
  DayTile,
  divider,
  hireCard,
  hireTitle,
  Kpi,
  OrgMark,
  QuotaLine,
  StageBar,
  StageLegend,
} from "@/components/hire/kit";
import { hireShortcuts } from "@/config/navigation";
import { cx } from "@/lib/cx";
import { db } from "@/server/db";
import { can, limit, resolvePlan, usage } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { scorecardsToComplete } from "@/server/services/evaluation";
import {
  activeJobCount,
  hireDashboard,
  hirePermissions,
  RESPONSE_GOAL_DAYS,
  WAITING_DAYS,
} from "@/server/services/hire";
import { upcomingOrgInterviews } from "@/server/services/interviews";
import { seatUsage } from "@/server/services/organization";
import { listPublicPlans, orgPlanFor } from "@/server/services/plans";
import { acceptedContacts } from "@/server/services/talent-search";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.dashboard");
  return { title: t("title"), robots: { index: false } };
}

/** Tints of the day tiles of the agenda, in turn (mockup 04-01). */
const dayTones = ["bg-lime", "bg-neon", "bg-brume"];

/**
 * Hire dashboard (partie 07 § 4, mockup 04-01): what needs an action today, the active jobs with
 * their candidates step by step, the next interviews and the organization's quotas.
 */
export default async function HireDashboardPage({ searchParams }: PageProps<"/app/hire">) {
  const params = await searchParams;
  const { user, space, ctx } = await requireHire("/app/hire");
  const t = await getTranslations("hire.dashboard");
  const all = await getTranslations();
  const nav = await getTranslations("appNav");
  const format = await getFormatter();
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const [data, maxJobs, activeJobs, seats, appointments, quotas, organization, plans, plan] =
    await Promise.all([
      hireDashboard(db, ctx, now),
      limit(db, subject, "jobs.active.max"),
      activeJobCount(db, ctx.organizationId),
      seatUsage(db, ctx.organizationId),
      can(db, subject, "connect.appointments"),
      Promise.all([
        usage(db, subject, "hire.talent_search.monthly"),
        usage(db, subject, "hire.contact_requests.monthly"),
        usage(db, subject, "ai.credits.monthly"),
      ]),
      db.organization.findUniqueOrThrow({
        where: { id: ctx.organizationId },
        select: { verificationStatus: true },
      }),
      listPublicPlans(db),
      resolvePlan(db, subject, now),
    ]);
  const permissions = hirePermissions(ctx.role);
  const [interviews, scorecards, contacts] = await Promise.all([
    appointments ? upcomingOrgInterviews(db, ctx, now) : null,
    permissions.evaluate ? scorecardsToComplete(db, ctx) : 0,
    permissions.manage ? acceptedContacts(db, ctx.organizationId, weekAgo) : 0,
  ]);

  const titles = (jobs: { title: string }[]) =>
    jobs
      .slice(0, 2)
      .map((job) => job.title)
      .join(", ");
  const jobHref = (jobs: { id: string }[]) =>
    jobs.length === 1 ? `/app/hire/offres/${jobs[0]!.id}` : "/app/hire/offres";
  const toDo: {
    key: string;
    icon: IconName;
    tile: string;
    title: string;
    hint?: string;
    href: string;
    count: number;
  }[] = [
    {
      key: "new",
      icon: "jobs" as IconName,
      tile: "bg-lime-clair",
      count: data.unseen,
      title: t("toDo.newApplications", { count: data.unseen }),
      hint: titles(data.unseenJobs),
      href: jobHref(data.unseenJobs),
    },
    {
      key: "waiting",
      icon: "horloge" as IconName,
      tile: "bg-ambre-fond",
      count: data.waiting,
      title: t("toDo.noReply", { count: data.waiting, days: WAITING_DAYS }),
      hint: titles(data.waitingJobs),
      href: jobHref(data.waitingJobs),
    },
    {
      key: "scorecards",
      icon: "doc" as IconName,
      tile: "bg-[#ddf3eb]",
      count: scorecards,
      title: t("toDo.scorecards", { count: scorecards }),
      hint: t("toDo.scorecardsHint"),
      href: "/app/hire/entretiens",
    },
    {
      key: "contacts",
      icon: "connect" as IconName,
      tile: "bg-gris-clair",
      count: contacts,
      title: t("toDo.contactAccepted", { count: contacts }),
      hint: t("toDo.contactHint"),
      href: "/app/messages",
    },
  ].filter((item) => item.count > 0);
  const toDoCount = toDo.reduce((sum, item) => sum + item.count, 0);

  const [searches, contactRequests, aiCredits] = quotas;
  const quotaText = (key: string, max: number) =>
    max < 0
      ? t("quotas.unlimited")
      : max === 0
        ? plan?.values[key] === "contract"
          ? t("quotas.unlimited")
          : t("quotas.notIncluded")
        : undefined;
  const quotaRows: { key: string; icon: IconName; label: string; used: number; max: number }[] = [
    {
      key: "org.seats",
      icon: "profil",
      label: t("quotas.seats"),
      used: seats.members,
      max: seats.max,
    },
    {
      key: "jobs.active.max",
      icon: "jobs",
      label: t("quotas.activeJobs"),
      used: activeJobs,
      max: maxJobs,
    },
    {
      key: "hire.talent_search.monthly",
      icon: "recherche",
      label: t("quotas.search"),
      used: searches.used,
      max: searches.limit,
    },
    {
      key: "hire.contact_requests.monthly",
      icon: "connect",
      label: t("quotas.contacts"),
      used: contactRequests.used,
      max: contactRequests.limit,
    },
    {
      key: "ai.credits.monthly",
      icon: "intelligence",
      label: t("quotas.aiCredits"),
      used: aiCredits.used,
      max: aiCredits.limit,
    },
  ];

  const firstName = user.firstName ?? user.name;
  const facts = [
    t("banner.jobs", { count: activeJobs }),
    t("banner.team", { count: seats.members }),
    organization.verificationStatus === "verified" ? all("common.verifiedCompany") : null,
  ].filter(Boolean);
  const legend = barKinds.map((kind) => ({ kind, label: all(`hire.pipeline.stage.${kind}`) }));
  const fairness = (
    <p className="flex items-center gap-3 rounded-[18px] bg-creme px-[18px] py-3 text-[13px] leading-[18px]">
      <span
        aria-hidden
        className="grid size-[34px] shrink-0 place-items-center rounded-[12px] bg-lime-clair"
      >
        <Icon name="eye" className="size-4" />
      </span>
      {t("fairness")}
    </p>
  );
  const goalMissed = data.responseDays !== null && data.responseDays > RESPONSE_GOAL_DAYS;

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <AppPageHeader
        eyebrow={
          <span className="font-semibold tracking-[0.09em] text-feuille-fonce uppercase">
            {all("talent.dashboard.date", { date: now })}
          </span>
        }
        title={t("greeting", { firstName })}
        subtitle={<span className="max-sm:hidden">{facts.join(" · ")}</span>}
        illustration="/illustrations/jumanly-nadia-montre.svg"
        actions={
          permissions.manage ? (
            <>
              {permissions.manage && (
                <Link href="/app/hire/offres/nouvelle" className={pillClass("lime", "md")}>
                  <Icon name="ajouter" className="size-4" />
                  {t("newCta")}
                </Link>
              )}
              {permissions.manage && (
                <Link
                  href="/app/hire/talents"
                  className={pillClass("outline", "md", "max-sm:hidden")}
                >
                  {all("hire.talents.title")}
                </Link>
              )}
            </>
          ) : undefined
        }
      />

      {params.bienvenue && (
        <Alert tone="success" title={t("eyebrow", { org: space.organization.name })} />
      )}
      {permissions.administer &&
        (organization.verificationStatus === "pending" ? (
          <Alert title={t("verifyBanner.pending")} />
        ) : organization.verificationStatus === "none" ||
          organization.verificationStatus === "rejected" ? (
          <Alert
            title={t("verifyBanner.text")}
            action={
              <Link href="/app/organisation?onglet=verification" className="font-medium underline">
                {t("verifyBanner.cta")}
              </Link>
            }
          />
        ) : null)}

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
        <li className="flex">
          <Kpi
            className="flex-1"
            label={t("kpi.applications.text")}
            value={String(data.applications)}
            number={data.applications}
            icon="equipe"
            disc="bg-lime-clair"
          >
            {data.thisWeek > 0 && (
              <span className={cx(tag, "bg-lime-clair text-up-texte")}>
                {t("kpi.applications.delta", { count: data.thisWeek })}
              </span>
            )}
          </Kpi>
        </li>
        <li className="flex">
          <Kpi
            className="flex-1"
            label={t("kpi.responseTime.text")}
            value={
              data.responseDays === null
                ? t("kpi.none")
                : t("kpi.responseTime.value", { days: data.responseDays })
            }
            icon="horloge"
            disc="bg-[#fbf6c9]"
          >
            <span className={cx(tag, goalMissed ? tagTone.ambre : tagTone.brume)}>
              {t("kpi.responseTime.goal", { days: RESPONSE_GOAL_DAYS })}
            </span>
          </Kpi>
        </li>
        <li className="flex">
          <Kpi
            className="flex-1"
            label={t("kpi.interviews.text")}
            value={interviews ? String(interviews.total) : t("kpi.none")}
            number={interviews?.total}
            icon="calendrier"
            disc="bg-[#ddf3eb]"
          >
            {interviews && (
              <span className={cx(tag, tagTone.brume)}>
                {t("kpi.interviews.week", { count: interviews.thisWeek })}
              </span>
            )}
          </Kpi>
        </li>
        <li className="flex">
          <Kpi
            className="flex-1"
            label={t("kpi.avgCompatibility.text")}
            value={
              data.compatibility.average === null
                ? t("kpi.none")
                : all("ui.percent", { value: data.compatibility.average })
            }
            icon="intelligence"
            ai
          >
            {data.compatibility.top !== null && (
              <span className={cx(tag, tagTone.brume)}>
                {t("kpi.avgCompatibility.top", { score: data.compatibility.top })}
              </span>
            )}
          </Kpi>
        </li>
        <li className="flex max-lg:hidden">
          <Kpi
            className="flex-1"
            label={t("kpi.activeJobs.text")}
            value={
              maxJobs <= 0
                ? String(activeJobs)
                : t("kpi.activeJobs.value", { count: activeJobs, max: maxJobs })
            }
            number={activeJobs}
            icon="jobs"
          >
            {plan && <span className="text-[11px] text-ardoise">{plan.planName}</span>}
          </Kpi>
        </li>
      </ul>

      {/* Desktop: two rows of two cards. Phone: one column, interviews before the jobs. */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-4">
        <section aria-labelledby="todo" className={cx(hireCard, "flex flex-col max-lg:order-1")}>
          <div className="flex items-center justify-between gap-3">
            <h2 id="todo" className={hireTitle}>
              {t("toDo.title")}
            </h2>
            {toDoCount > 0 && <span className={cx(tag, tagTone.sapin)}>{toDoCount}</span>}
          </div>
          {toDo.length === 0 ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-ardoise">
              <Icon name="valider" className="size-4 text-feuille" />
              {t("toDo.empty")}
            </p>
          ) : (
            <ul className="mt-1.5 flex flex-col">
              {toDo.map((item) => (
                <ActionRow
                  key={item.key}
                  href={item.href}
                  icon={item.icon}
                  tile={item.tile}
                  title={item.title}
                  hint={item.hint}
                />
              ))}
            </ul>
          )}
          <div className="mt-4 flex-1 max-lg:hidden" />
          <div className="max-lg:hidden">{fairness}</div>
        </section>

        <section
          aria-labelledby="jobs"
          className={cx(hireCard, "flex flex-col gap-2 max-lg:order-3")}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="jobs" className={hireTitle}>
              {t("jobs.title")}
            </h2>
            <Link
              href="/app/hire/offres"
              className="flex items-center gap-1 text-[12px] font-semibold whitespace-nowrap text-feuille-fonce hover:underline lg:text-[13px]"
            >
              {t("jobs.seeAll")}
              <Icon name="chev-r" className="size-3.5" />
            </Link>
          </div>
          {data.jobs.length === 0 ? (
            <div className="flex flex-col items-start gap-3 py-3">
              <p className="text-sm text-ardoise">{t("jobs.empty.text")}</p>
              {permissions.manage && (
                <Link href="/app/hire/offres/nouvelle" className={pillClass("dark", "sm")}>
                  <Icon name="ajouter" className="size-4" />
                  {t("jobs.empty.cta")}
                </Link>
              )}
            </div>
          ) : (
            <>
              <ul className="flex flex-col">
                {data.jobs.slice(0, 5).map((job) => {
                  const stages = job.stages.filter((stage) =>
                    (barKinds as readonly string[]).includes(stage.kind),
                  ) as { kind: (typeof barKinds)[number]; count: number }[];
                  return (
                    <li
                      key={job.id}
                      className="flex flex-col gap-2 border-gris-clair py-3 not-first:border-t"
                    >
                      <div className="flex items-center gap-3">
                        <OrgMark name={space.organization.name} />
                        <Link
                          href={`/app/hire/offres/${job.id}`}
                          className="min-w-0 flex-1 text-[13.5px] leading-[19px] font-semibold hover:underline"
                        >
                          {t("jobs.row", {
                            jobTitle: job.title,
                            count: job._count.applications,
                          })}
                        </Link>
                        {job.unseen > 0 && (
                          <span className={cx(tag, tagTone.neon)}>
                            {t("jobs.newTag", { count: job.unseen })}
                          </span>
                        )}
                      </div>
                      <StageBar
                        stages={stages}
                        label={t("jobs.bar", {
                          detail: stages
                            .map(
                              (stage) =>
                                `${all(`hire.pipeline.stage.${stage.kind}`)} ${stage.count}`,
                            )
                            .join(", "),
                        })}
                      />
                    </li>
                  );
                })}
              </ul>
              <StageLegend items={legend} />
            </>
          )}
        </section>

        <section
          aria-labelledby="interviews"
          className={cx(hireCard, "flex flex-col max-lg:order-2")}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="interviews" className={hireTitle}>
              {t("interviews.title")}
            </h2>
            <Link
              href="/app/hire/entretiens"
              aria-label={all("hire.interviews.title")}
              className="grid size-8 place-items-center rounded-full hover:bg-creme"
            >
              <Icon name="calendrier" className="size-[18px]" />
            </Link>
          </div>
          {!interviews ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-ardoise">
              <Icon name="lock" className="size-4 shrink-0" />
              {t("interviews.locked", { plan: orgPlanFor(plans, "connect.appointments") })}
            </p>
          ) : interviews.next.length === 0 ? (
            <p className="mt-3 text-sm text-ardoise">{t("interviews.empty")}</p>
          ) : (
            <ul className="mt-1.5 flex flex-col">
              {interviews.next.slice(0, 3).map((interview, index) => {
                const at = interview.startsAt ?? now;
                const mode = all(`hire.interviews.form.type.${interview.mode}`);
                return (
                  <li key={interview.id} className={cx("py-2.5", index > 0 && divider)}>
                    <Link
                      href={`/app/hire/candidats/${interview.application.id}`}
                      className="group flex items-center gap-3"
                    >
                      <DayTile
                        weekday={format.dateTime(at, { weekday: "short" })}
                        day={format.dateTime(at, { day: "numeric" })}
                        tone={dayTones[index] ?? "bg-brume"}
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="text-[13px] leading-[18px] font-semibold group-hover:underline">
                          {t("interviews.row", {
                            time: format.dateTime(at, { hour: "2-digit", minute: "2-digit" }),
                            candidateName: interview.application.profile.user.name,
                            jobTitle: interview.application.job.title,
                          })}
                        </span>
                        <span className="text-[11px] leading-[15px] text-ardoise">
                          {interview.address
                            ? t("interviews.where", { mode, place: interview.address })
                            : t("interviews.with", { mode, memberName: interview.organizer.name })}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="quotas"
          className={cx(hireCard, "flex flex-col gap-3.5 max-lg:order-4")}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              <h2 id="quotas" className={hireTitle}>
                {t("quotas.title")}
              </h2>
              {plan && (
                <p className="text-[12px] text-ardoise lg:text-[13px]">
                  {t("quotas.renewal", { date: plan.periodEnd })}
                </p>
              )}
            </div>
            {plan && <span className={cx(tag, tagTone.sapin)}>{plan.planName}</span>}
          </div>
          {quotaRows.map((row) => (
            <QuotaLine
              key={row.key}
              icon={row.icon}
              label={row.label}
              used={row.used}
              max={row.max}
              value={t("quotas.usage", { used: row.used, quota: row.max })}
              text={quotaText(row.key, row.max)}
            />
          ))}
          {permissions.administer && (
            <div className="mt-1 flex justify-end">
              <Link href="/app/abonnement" className={pillClass("outline", "sm", "max-lg:w-full")}>
                {t("quotas.seePlans")}
              </Link>
            </div>
          )}
        </section>

        <div className="order-5 lg:hidden">{fairness}</div>
      </div>

      <nav aria-label={nav("mobile.more")} className="grid grid-cols-3 gap-2 lg:hidden">
        {hireShortcuts.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="flex flex-col items-center gap-1 rounded-[18px] bg-blanc p-3 text-center text-[13px] font-medium"
          >
            <Icon name={item.icon} className="size-5" />
            {nav(item.key)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
