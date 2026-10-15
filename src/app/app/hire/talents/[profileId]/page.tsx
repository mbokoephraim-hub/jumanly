import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Alert, Badge, Button, ButtonLink, Select, TextArea, TextField } from "@/components/ui";
import { addToPoolAction, contactRequestAction } from "@/server/actions/hire-advanced";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { hirePermissions } from "@/server/services/hire";
import {
  CONTACT_COOLDOWN_DAYS,
  CONTACT_MESSAGE_MIN,
  listPools,
  poolsEnabled,
  searchQuotas,
  viewTalentProfile,
} from "@/server/services/talent-search";
import { AppPageHeader } from "@/components/app/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.talents");
  return { title: t("result.view"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

/**
 * A profile found in the talent pool. A summary until the talent applies or accepts a contact
 * request; an anonymous talent's name stays hidden until then. Every opening is logged.
 */
export default async function TalentProfilePage({
  params,
  searchParams,
}: PageProps<"/app/hire/talents/[profileId]">) {
  const [{ profileId }, query] = await Promise.all([params, searchParams]);
  const { ctx } = await requireHire(`/app/hire/talents/${profileId}`, "readApplications");
  const t = await getTranslations();
  const format = await getFormatter();
  const view = await viewTalentProfile(db, ctx, profileId);
  if (view.status === "notFound") notFound();
  if (view.status === "blocked") {
    return (
      <div className="flex flex-col gap-6">
        <Link href="/app/hire/talents" className="text-sm underline">
          {t("hire.talents.profile.back")}
        </Link>
        <Alert tone="warning" title={t("hire.talents.blocked")} />
      </div>
    );
  }
  const { profile } = view;
  const manage = hirePermissions(ctx.role).manage;
  const [quotas, pools, canPool, jobs] = await Promise.all([
    searchQuotas(db, ctx.organizationId),
    listPools(db, ctx),
    poolsEnabled(db, ctx.organizationId),
    db.job.findMany({
      where: { organizationId: ctx.organizationId, status: "published" },
      orderBy: { publishedAt: "desc" },
      take: 50,
      select: { id: true, title: true },
    }),
  ]);
  const remaining =
    quotas.contacts.limit < 0
      ? "∞"
      : String(Math.max(0, quotas.contacts.limit - quotas.contacts.used));
  const title = view.anonymous
    ? t("hire.talents.result.anonymous", { headline: profile.headline ?? "" })
    : profile.user.name;
  const erreur = one(query.erreur);
  const errorText: Record<string, string> = {
    invalid: t("hire.contact.error.invalid", { min: CONTACT_MESSAGE_MIN }),
    pending: t("hire.contact.error.pending"),
    connected: t("hire.contact.error.connected"),
    locked: t("hire.contact.error.locked"),
    notFound: t("hire.contact.error.notFound"),
    blocked: t("hire.contact.blocked"),
    cooldown: t("hire.contact.declined.note", { days: CONTACT_COOLDOWN_DAYS }),
    quota: t("hire.talents.quota.reached.contact", { date: quotas.contacts.resetsAt }),
    forbidden: t("hire.pools.error.forbidden"),
  };
  const contactStatus = view.contact?.status;
  const canRequest =
    manage && !view.full && contactStatus !== "pending" && contactStatus !== "accepted";
  const back = `/app/hire/talents/${profile.id}`;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/app/hire/talents" className="text-sm underline">
        {t("hire.talents.profile.back")}
      </Link>
      <AppPageHeader
        title={title}
        subtitle={
          <>
            {!view.anonymous && profile.headline && <p className="text-lg">{profile.headline}</p>}
            <p>{[profile.user.city, profile.user.country].filter(Boolean).join(", ")}</p>
          </>
        }
      />
      {query.ok === "contact" && <Alert tone="success" title={t("hire.contact.sent")} />}
      {query.ok === "vivier" && <Alert tone="success" title={t("hire.pools.addedDone")} />}
      {erreur && errorText[erreur] && <Alert tone="error" title={errorText[erreur]} />}
      <p className="text-sm text-ardoise">
        {view.full
          ? view.applied
            ? t("hire.talents.profile.applied")
            : t("hire.talents.profile.full")
          : view.anonymous
            ? t("hire.talents.profile.anonymousNote")
            : t("hire.talents.profile.limited")}
      </p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          {profile.summary && (
            <section className="rounded-card bg-blanc p-6">
              <p className="whitespace-pre-line">{profile.summary}</p>
            </section>
          )}
          <section
            aria-labelledby="t-skills"
            className="flex flex-col gap-3 rounded-card bg-blanc p-6"
          >
            <h2 id="t-skills" className="text-h2">
              {t("hire.talents.profile.skills")}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {profile.skills.map((item) => (
                <li key={item.skill.name}>
                  <Badge tone={item.verified ? "success" : "jobs"}>
                    {item.verified
                      ? [item.skill.name, t("hire.talents.profile.verified")].join(" · ")
                      : item.skill.name}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
          <section
            aria-labelledby="t-exp"
            className="flex flex-col gap-3 rounded-card bg-blanc p-6"
          >
            <h2 id="t-exp" className="text-h2">
              {t("hire.talents.profile.experience")}
            </h2>
            <ul className="flex flex-col gap-3">
              {profile.experiences.map((experience) => (
                <li key={experience.id} className="flex flex-col gap-1">
                  <p className="font-semibold">
                    {[experience.title, experience.company].filter(Boolean).join(" · ")}
                  </p>
                  <p className="text-sm text-ardoise">
                    {[
                      format.dateTime(experience.startDate, { month: "short", year: "numeric" }),
                      experience.endDate
                        ? format.dateTime(experience.endDate, { month: "short", year: "numeric" })
                        : "…",
                    ].join(" – ")}
                  </p>
                  {experience.description && (
                    <p className="text-sm whitespace-pre-line">{experience.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
          <section
            aria-labelledby="t-edu"
            className="flex flex-col gap-3 rounded-card bg-blanc p-6"
          >
            <h2 id="t-edu" className="text-h2">
              {t("hire.talents.profile.education")}
            </h2>
            <ul className="flex flex-col gap-2">
              {profile.educations.map((education) => (
                <li key={education.id}>
                  <p className="font-semibold">
                    {view.full
                      ? [education.degree, education.school].join(" · ")
                      : t(`talent.profile.education.level.${education.level}`)}
                  </p>
                  {education.endYear && (
                    <p className="text-sm text-ardoise">{String(education.endYear)}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section
            id="contact"
            aria-labelledby="t-contact"
            className="flex flex-col gap-3 rounded-card bg-blanc p-6"
          >
            <h2 id="t-contact" className="text-h2">
              {t("hire.contact.title")}
            </h2>
            {contactStatus && (
              <p>
                <Badge tone={contactStatus === "accepted" ? "success" : "neutral"}>
                  {t(
                    `hire.contact.status.${contactStatus as "pending" | "accepted" | "declined" | "expired"}`,
                  )}
                </Badge>
              </p>
            )}
            {view.contact?.conversationId && (
              <ButtonLink
                href={`/app/messages/${view.contact.conversationId}`}
                variant="secondary"
                size="sm"
                className="self-start"
              >
                {t("hire.talents.profile.openConversation")}
              </ButtonLink>
            )}
            {canRequest && (
              <form action={contactRequestAction} className="flex flex-col gap-4">
                <input type="hidden" name="profile" value={profile.id} />
                <p className="text-sm text-ardoise">{t("hire.contact.subtitle")}</p>
                <Select
                  id="contact-job"
                  name="job"
                  label={t("hire.contact.job.text")}
                  placeholder={t("hire.contact.job.none")}
                  defaultValue={one(query.offre)}
                  options={jobs.map((job) => ({ value: job.id, label: job.title }))}
                />
                <TextArea
                  id="contact-message"
                  name="message"
                  required
                  minLength={CONTACT_MESSAGE_MIN}
                  maxLength={2000}
                  rows={6}
                  label={t("hire.contact.message.text")}
                  placeholder={t("hire.contact.message.placeholder")}
                  hint={t("hire.contact.message.min", { min: CONTACT_MESSAGE_MIN })}
                />
                <p className="text-sm">{t("hire.contact.cost", { remaining })}</p>
                <p className="text-sm font-medium">{t("hire.contact.noPayment")}</p>
                <Button type="submit" className="self-start">
                  {t("hire.contact.send")}
                </Button>
              </form>
            )}
          </section>

          {manage && canPool && (
            <section
              aria-labelledby="t-pool"
              className="flex flex-col gap-3 rounded-card bg-blanc p-6"
            >
              <h2 id="t-pool" className="text-h2">
                {t("hire.talents.result.addToPool")}
              </h2>
              {pools.length === 0 ? (
                <p className="text-sm text-ardoise">{t("hire.application.pool.none")}</p>
              ) : (
                <form action={addToPoolAction} className="flex flex-col gap-3">
                  <input type="hidden" name="profile" value={profile.id} />
                  <input type="hidden" name="back" value={back} />
                  <Select
                    id="talent-pool"
                    name="pool"
                    required
                    label={t("hire.pools.choose")}
                    options={pools.map((pool) => ({ value: pool.id, label: pool.name }))}
                  />
                  <TextField
                    id="talent-pool-note"
                    name="note"
                    maxLength={300}
                    label={t("hire.pools.note")}
                  />
                  <Button type="submit" variant="tertiary" size="sm" className="self-start">
                    {t("hire.pools.add")}
                  </Button>
                </form>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
