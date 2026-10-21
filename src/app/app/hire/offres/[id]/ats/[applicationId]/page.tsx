import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { OfferHead, OfferTabs } from "@/components/recruiter/ats-web";
import { CandidateAvatar, ScoreRing } from "@/components/recruiter/candidates";
import { OfferSheets } from "@/components/recruiter/offers";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { cx } from "@/lib/cx";
import { formatDayMonth } from "@/lib/dates";
import {
  analyzeForOfferAction,
  shortlistAction,
  unshortlistAction,
} from "@/server/actions/hire-ats";
import { db } from "@/server/db";
import { level } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { applicationMatches } from "@/server/matching/service";
import { analysisReadiness, type AnalysisPoint } from "@/server/services/cv-analysis";
import { HireError, hirePermissions, recordView } from "@/server/services/hire";
import { profileForOffer } from "@/server/services/hire-ats";
import { listOffers } from "@/server/services/hire-offers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireAts.profile");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/**
 * « Profil pour cette offre » (planche v4.1 ATS4): Orbi's synthesis of the file read against the
 * offer, each criterion of the offer with what the file shows, and the questions to ask in
 * interview. Opening it is a consultation of the file, logged like the file itself (golden rule n° 5).
 */
export default async function AtsProfilePage({
  params,
  searchParams,
}: PageProps<"/app/hire/offres/[id]/ats/[applicationId]">) {
  const [{ id, applicationId }, query] = await Promise.all([params, searchParams]);
  const { ctx } = await requireHire(`/app/hire/offres/${id}/ats`, "readApplications");
  const t = await getTranslations("hireAts.profile");
  const tc = await getTranslations("hireCandidates");
  const tw = await getTranslations("hireWeb.ats.profile");
  const ti = await getTranslations("hireInterviews.prep");
  const now = new Date();
  const data = await profileForOffer(db, ctx, id, applicationId).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  await recordView(db, ctx, applicationId, now);
  const { application, analysis, lines, questions } = data;
  const permissions = hirePermissions(ctx.role);
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [matchingLevel, readiness] = await Promise.all([
    level(db, subject, "hire.matching.level"),
    analysisReadiness(db, ctx),
  ]);
  const match =
    matchingLevel === "none"
      ? null
      : (await applicationMatches(db, [application], now)).get(application.id);
  const score = match && match !== "disabled" ? match.score : null;
  const base = `/app/hire/offres/${id}/ats`;
  const person = application.profile.user;
  const line = (item: AnalysisPoint) =>
    "text" in item ? item.text : tc(`analysis.point.${item.key}`, item.values as never);
  const orbiError = one(query.orbi);
  const shortlisted = application.shortlistedAt !== null;
  const job = application.job;
  // The job is already the organisation's (getOrgApplication): its counts for the web tabs.
  const [applications, kept, offers] = await Promise.all([
    db.application.count({ where: { jobId: job.id } }),
    db.application.count({
      where: { jobId: job.id, status: "active", shortlistedAt: { not: null } },
    }),
    listOffers(db, ctx, now),
  ]);
  const figures = offers.find((item) => item.id === job.id)?.figures ?? {
    applications,
    unseen: 0,
    views: 0,
    interviews: 0,
  };
  const firstName = person.name.split(/\s+/)[0] ?? person.name;
  const shortlistForm = (className: string) =>
    shortlisted ? (
      <form action={unshortlistAction} className="contents">
        <input type="hidden" name="job" value={id} />
        <input type="hidden" name="application" value={application.id} />
        <button type="submit" className={cx("t-bt t-sec t-press", className)}>
          {t("remove")}
        </button>
      </form>
    ) : (
      <form action={shortlistAction} className="contents">
        <input type="hidden" name="job" value={id} />
        <input type="hidden" name="ids" value={application.id} />
        <input type="hidden" name="back" value={`${base}/${application.id}`} />
        <button type="submit" className={cx("t-bt t-a t-press", className)}>
          <TalentIcon name="valider" size="s" />
          {t("keep")}
        </button>
      </form>
    );
  const canKeep = permissions.manage && application.status === "active";

  return (
    <div className="t-flux t-r6 t-large t-rw-a4 t-rw-pf">
      {one(query.ok) === "retenue" && <ToastOnLoad message={t("ok.shortlisted")} />}
      {one(query.ok) === "analyse" && <ToastOnLoad message={t("ok.analysed")} />}
      <FlowHead back={base} backLabel={t("back")} title={t("title")} />
      <OfferHead job={job} />
      <OfferTabs jobId={job.id} current="ats" applications={applications} shortlisted={kept} />
      <div className="t-rw-aw t-rw-aw-r">
        <div className="t-rw-ac">
          <div className="t-verre t-r6-mini">
            <CandidateAvatar id={application.id} name={person.name} />
            <div className="t-t">
              <b>{person.name}</b>
              <span>
                {[t("received", { date: formatDayMonth(application.createdAt) }), person.city]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
            {score !== null && (
              <ScoreRing
                score={score}
                text={`${score} %`}
                label={tc("row.scoreAria", { score })}
                size="s"
              />
            )}
          </div>

          <section className="t-r6-pqo" aria-labelledby="ats-syn-t">
            <div className="t-h">
              <OrbiMark size={30} />
              <div className="t-t">
                <b id="ats-syn-t">{t("synthesis")}</b>
                <span>{t("synthesisSub")}</span>
              </div>
            </div>
            {analysis ? (
              <ul>
                {analysis.strengths.map((item, index) => (
                  <li key={`s${index}`}>
                    <i aria-hidden className="t-v">
                      <TalentIcon name="valider" size="xs" />
                    </i>
                    <span>
                      <span className="sr-only">{t("strength")} </span>
                      {line(item)}
                    </span>
                  </li>
                ))}
                {analysis.toVerify.map((item, index) => (
                  <li key={`v${index}`}>
                    <i aria-hidden className="t-a">
                      <TalentIcon name="aide" size="xs" />
                    </i>
                    <span>
                      <span className="sr-only">{t("toVerify")} </span>
                      {line(item)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : readiness === "ready" ? (
              <form action={analyzeForOfferAction} className="t-flux t-serre">
                <p>{t("notYet")}</p>
                <input type="hidden" name="job" value={id} />
                <input type="hidden" name="application" value={application.id} />
                <button type="submit" className="t-bt t-p t-s t-press">
                  <TalentIcon name="orbi" size="xs" />
                  {t("run")}
                </button>
              </form>
            ) : (
              <p>{t(`lock.${readiness}`)}</p>
            )}
            {orbiError && (
              <Notice tone="err">
                {t(`lock.${orbiError === "unavailable" ? "unavailable" : "quota"}`)}
              </Notice>
            )}
          </section>

          <table className="t-verre t-r6-cmp">
            <caption className="sr-only">{t("table.caption")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("table.criterion")}</th>
                <th scope="col">{t("table.shows")}</th>
                <th scope="col">
                  <span className="sr-only">{t("table.state")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((item, index) => (
                <tr key={index}>
                  <th scope="row">{item.key === "skill" ? item.label : t(`table.${item.key}`)}</th>
                  <td>
                    {item.key === "documents" && item.shows.key === "documents"
                      ? data.documents.map((doc) => t(`table.doc.${doc as "cv"}`)).join(", ")
                      : t(`table.value.${item.shows.key}` as "table.value.missing")}
                  </td>
                  <td>
                    <span className={cx("t-s", item.state === "ok" ? "t-v" : "t-a")}>
                      <span aria-hidden>{item.state === "ok" ? "✓" : "!"}</span>
                      <span className="sr-only">
                        {item.state === "ok" ? t("table.ok") : t("table.check")}
                      </span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="t-rw-ac">
          <div className="t-verre t-rw-web t-rw-pfa">
            {canKeep && shortlistForm("t-m")}
            <Link href={`/app/hire/candidats/${application.id}`} className="t-bt t-sec t-m t-press">
              <TalentIcon name="candidats" size="s" />
              {tw("file")}
            </Link>
            <Link
              href={`/app/hire/candidats/${application.id}/message`}
              className="t-bt t-sec t-m t-press"
            >
              <TalentIcon name="message" size="s" />
              {tw("write", { name: firstName })}
            </Link>
          </div>

          {questions.length > 0 && (
            <section aria-labelledby="ats-q-t" className="t-flux t-serre">
              <h2 id="ats-q-t" className="t-lab-c">
                {t("questions")}
              </h2>
              <ol className="t-verre t-r6-qx">
                {questions.map((question, index) => (
                  <li key={question.skill}>
                    <i aria-hidden>{index + 1}</i>
                    {ti(`ask.${question.kind}`, { skill: question.skill })}
                  </li>
                ))}
              </ol>
            </section>
          )}

          <p className="t-gar">
            <TalentIcon name="confidentialite" size="s" />
            <span>{t("excluded")}</span>
          </p>
        </div>
      </div>

      <div className="t-verre t-fort t-bas-f t-rw-tel">
        <Link href={`/app/hire/candidats/${application.id}`} className="t-bt t-sec t-m t-press">
          {t("file")}
        </Link>
        {canKeep && shortlistForm("t-pl")}
      </div>
      <OfferSheets
        job={{ ...job, figures }}
        back={`${base}/${application.id}`}
        manage={permissions.manage}
        readApplications
      />
    </div>
  );
}
