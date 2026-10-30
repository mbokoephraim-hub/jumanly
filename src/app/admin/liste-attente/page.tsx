import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  AdminPageHeader,
  AdminTabs,
  Tag,
  adminCard,
  adminLabel,
  type TagTone,
} from "@/components/admin/kit";
import { SelectAll } from "@/components/admin/select-all";
import { WaitlistFeedback, WaitlistStatistics } from "@/components/admin/waitlist-test";
import { Alert, Button, ButtonLink } from "@/components/ui";
import { cx } from "@/lib/cx";
import { formatDateTime, formatShortDate } from "@/lib/dates";
import {
  inviteTestersAction,
  sendPendingWaitlistEmailsAction,
  sendTestSurveysAction,
} from "@/server/actions/admin-waitlist";
import { emailDeliveryAvailable } from "@/server/adapters/email";
import { canWriteArea } from "@/server/auth/roles";
import { requireAdminArea } from "@/server/auth/session";
import { db } from "@/server/db";
import { waitlistCounts, waitlistProfiles } from "@/server/services/waitlist";
import {
  defaultTestDays,
  testDurations,
  testStatusOf,
  testStatusWhere,
  testStatuses,
  type TestStatus,
} from "@/server/services/waitlist-test";

const PAGE = 300;
const FORM = "waitlist-test-form";
const tabs = ["inscrits", "statistiques", "retours"] as const;
type Tab = (typeof tabs)[number];

const statusTone: Record<TestStatus, TagTone> = {
  waiting: "outline",
  invited: "neon",
  surveyed: "warning",
  answered: "success",
};

/**
 * Liste d'attente (29/10/2026), then the platform test (30/10/2026): the people who joined from the
 * public site, the statistics of the list, the invitations to test with the hidden sign-up link,
 * and the answers to the end-of-test questionnaire.
 */
export default async function AdminWaitlistPage({
  searchParams,
}: PageProps<"/admin/liste-attente">) {
  const admin = await requireAdminArea("users");
  if (!admin) notFound();
  const query = await searchParams;
  const tab: Tab = tabs.find((value) => value === query.onglet) ?? "inscrits";
  const [t, counts, answers] = await Promise.all([
    getTranslations(),
    waitlistCounts(db),
    db.testFeedback.count(),
  ]);
  const href = (value: Tab) =>
    value === "inscrits" ? "/admin/liste-attente" : `/admin/liste-attente?onglet=${value}`;
  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title={t("admin.waitlist.title")}
        subtitle={t("admin.waitlist.subtitle")}
        stats={[
          { label: t("admin.waitlist.stats.total"), value: counts.total },
          ...waitlistProfiles.map((value) => ({
            label: t(`waitlist.form.profile.${value}.label`),
            value: counts[value],
          })),
        ]}
        action={
          admin.platformRole === "platform_admin" ? (
            <ButtonLink href="/admin/liste-attente.csv" variant="secondary" size="sm">
              {t("admin.waitlist.export")}
            </ButtonLink>
          ) : undefined
        }
      />
      <AdminTabs
        label={t("admin.waitlist.tabs.label")}
        items={tabs.map((value) => ({
          href: href(value),
          label:
            value === "retours"
              ? t("admin.waitlist.tabs.retoursCount", { count: answers })
              : t(`admin.waitlist.tabs.${value}`),
          current: value === tab,
        }))}
      />
      {tab === "statistiques" ? (
        <WaitlistStatistics />
      ) : tab === "retours" ? (
        <WaitlistFeedback />
      ) : (
        <Registrants
          query={query}
          canWrite={canWriteArea(admin.platformRole, "users")}
          pending={await db.waitlistEntry.count({ where: { emailSentAt: null } })}
        />
      )}
    </div>
  );
}

function number(value: string | string[] | undefined) {
  const parsed = typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

/** « Inscrits »: filters, then the list in a form to invite people or send the questionnaire. */
async function Registrants({
  query,
  canWrite,
  pending,
}: {
  query: Record<string, string | string[] | undefined>;
  canWrite: boolean;
  pending: number;
}) {
  const t = await getTranslations();
  const profile = waitlistProfiles.find((value) => value === query.profil);
  const status = testStatuses.find((value) => value === query.etat);
  const entries = await db.waitlistEntry.findMany({
    where: { ...(profile ? { profile } : {}), ...(status ? testStatusWhere(status) : {}) },
    orderBy: { createdAt: "desc" },
    take: PAGE,
    include: { feedback: { select: { id: true } } },
  });
  const accounts = new Set(
    (
      await db.user.findMany({
        where: { email: { in: entries.map((entry) => entry.email), mode: "insensitive" } },
        select: { email: true },
      })
    ).map((user) => user.email.toLowerCase()),
  );
  const mailReady = emailDeliveryAvailable();
  const sent = number(query.envoyes);
  const invites = number(query.invites);
  const surveys = number(query.questionnaires);
  const link = (change: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const next = { profil: profile, etat: status, ...change };
    for (const [key, value] of Object.entries(next)) if (value) params.set(key, value);
    const text = params.toString();
    return text ? `/admin/liste-attente?${text}` : "/admin/liste-attente";
  };
  const back = new URLSearchParams();
  if (profile) back.set("profil", profile);
  if (status) back.set("etat", status);
  const chip = (active: boolean) =>
    cx(
      "flex h-9 items-center rounded-pill px-4 text-[13px] font-semibold ring-1 ring-inset",
      active ? "bg-lime text-[#0f3f37] ring-lime" : "bg-blanc ring-sapin/10 hover:ring-sapin/30",
    );
  return (
    <>
      {sent !== null && <Alert tone="success" title={t("admin.waitlist.sent", { count: sent })} />}
      {invites !== null && (
        <Alert tone="success" title={t("admin.waitlist.test.invited", { count: invites })} />
      )}
      {surveys !== null && (
        <Alert tone="success" title={t("admin.waitlist.test.surveyed", { count: surveys })} />
      )}
      {query.aucun === "1" && (
        <Alert tone="warning" title={t("admin.waitlist.test.noneSelected")} />
      )}
      {!mailReady && <Alert tone="warning" title={t("admin.waitlist.mailOff")} />}
      {mailReady && pending > 0 && canWrite && (
        <form
          action={sendPendingWaitlistEmailsAction}
          className={cx(adminCard, "flex flex-wrap items-center gap-3")}
        >
          <p className="flex-1 text-[14px] leading-5">
            {t("admin.waitlist.pending", { count: pending })}
          </p>
          <Button type="submit" variant="primary" size="sm">
            {t("admin.waitlist.sendPending")}
          </Button>
        </form>
      )}

      <section className={cx(adminCard, "flex flex-col gap-2")}>
        <h2 className="text-[16px] leading-[22px] font-semibold">
          {t("admin.waitlist.test.howTitle")}
        </h2>
        <ol className="grid gap-2 text-[13.5px] leading-5 text-ardoise sm:grid-cols-3">
          {([1, 2, 3] as const).map((step) => (
            <li key={step} className="flex gap-2.5">
              <span
                aria-hidden
                className="grid size-6 shrink-0 place-items-center rounded-full bg-lime text-[12px] font-semibold text-sapin"
              >
                {step}
              </span>
              {t(`admin.waitlist.test.how.${step}`)}
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-col gap-2">
        <nav aria-label={t("admin.waitlist.filter")} className="flex flex-wrap gap-2">
          {([undefined, ...waitlistProfiles] as const).map((value) => (
            <a
              key={value ?? "all"}
              href={link({ profil: value })}
              aria-current={value === profile ? "page" : undefined}
              className={chip(value === profile)}
            >
              {value ? t(`waitlist.form.profile.${value}.label`) : t("admin.waitlist.all")}
            </a>
          ))}
        </nav>
        <nav aria-label={t("admin.waitlist.test.filter")} className="flex flex-wrap gap-2">
          {([undefined, ...testStatuses] as const).map((value) => (
            <a
              key={value ?? "all"}
              href={link({ etat: value })}
              aria-current={value === status ? "page" : undefined}
              className={chip(value === status)}
            >
              {value
                ? t(`admin.waitlist.test.status.${value}`)
                : t("admin.waitlist.test.allStates")}
            </a>
          ))}
        </nav>
      </div>

      <form id={FORM} className="flex flex-col gap-3">
        <input type="hidden" name="retour" value={`?${back}`} />
        {canWrite && mailReady && entries.length > 0 && (
          <div className={cx(adminCard, "flex flex-wrap items-center gap-3")}>
            <SelectAll
              form={FORM}
              name="ids"
              label={t("admin.waitlist.test.selectAll")}
              countLabel={t("admin.waitlist.test.selectedCount")}
            />
            <span className="flex-1" />
            <label className="flex items-center gap-2 text-[13px] font-semibold">
              {t("admin.waitlist.test.duration")}
              <select
                name="jours"
                defaultValue={defaultTestDays}
                className="h-9 rounded-pill bg-blanc px-3 text-[13px] ring-1 ring-sapin/15 ring-inset"
              >
                {testDurations.map((days) => (
                  <option key={days} value={days}>
                    {t("admin.waitlist.test.days", { count: days })}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" formAction={inviteTestersAction} variant="primary" size="sm">
              {t("admin.waitlist.test.invite")}
            </Button>
            <Button type="submit" formAction={sendTestSurveysAction} variant="secondary" size="sm">
              {t("admin.waitlist.test.sendSurvey")}
            </Button>
          </div>
        )}
        <section className={cx(adminCard, "overflow-x-auto p-0 lg:p-0")}>
          {entries.length === 0 ? (
            <p className="p-6 text-[14px] text-ardoise">{t("admin.waitlist.empty")}</p>
          ) : (
            <table className="w-full min-w-[980px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-brume">
                  <th scope="col" className="w-10 px-4 py-3">
                    <span className="sr-only">{t("admin.waitlist.test.select")}</span>
                  </th>
                  {(["name", "email", "profile", "place", "date", "test", "mail"] as const).map(
                    (key) => (
                      <th
                        key={key}
                        scope="col"
                        className={cx(adminLabel, "px-4 py-3 font-semibold")}
                      >
                        {t(`admin.waitlist.col.${key}`)}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const state = testStatusOf(entry);
                  const name = [entry.firstName, entry.lastName].filter(Boolean).join(" ");
                  return (
                    <tr key={entry.id} className="border-b border-brume last:border-0">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          name="ids"
                          value={entry.id}
                          aria-label={t("admin.waitlist.test.selectOne", { name })}
                          className="size-[18px] accent-[#a6f26b]"
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {name}
                        {entry.organization && (
                          <span className="block text-[12px] font-normal text-ardoise">
                            {entry.organization}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <a href={`mailto:${entry.email}`} className="hover:underline">
                          {entry.email}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <Tag tone={entry.profile === "talent" ? "success" : "neon"}>
                          {t(`waitlist.form.profile.${entry.profile}.label`)}
                        </Tag>
                      </td>
                      <td className="px-4 py-3 text-ardoise">
                        {[entry.city, entry.country].filter(Boolean).join(", ")}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-ardoise">
                        {formatDateTime(entry.createdAt)} · {entry.locale.toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex flex-col items-start gap-1">
                          <Tag tone={statusTone[state]}>
                            {t(`admin.waitlist.test.status.${state}`)}
                          </Tag>
                          {accounts.has(entry.email) && (
                            <Tag tone="menthe">{t("admin.waitlist.test.account")}</Tag>
                          )}
                          {state === "invited" && entry.testEndsAt && (
                            <span className="text-[12px] whitespace-nowrap text-ardoise">
                              {t("admin.waitlist.test.until", {
                                date: formatShortDate(entry.testEndsAt),
                              })}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {entry.emailSentAt ? (
                          <Tag tone="success">{t("admin.waitlist.mailSent")}</Tag>
                        ) : (
                          <Tag tone="outline">{t("admin.waitlist.mailPending")}</Tag>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </form>
      {entries.length === PAGE && (
        <p className="text-[12.5px] text-ardoise">{t("admin.waitlist.more", { count: PAGE })}</p>
      )}
    </>
  );
}
