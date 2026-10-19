import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { salaryText } from "@/components/jobs/talent-kit";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { DISPUTE_REPLY_DAYS } from "@/lib/disputes";
import { Banner, CourseArt, Logo, toneOf } from "@/components/talent/art";
import { BackButton } from "@/components/talent/back-button";
import { TalentIcon } from "@/components/talent/icon";
import { saveLabels } from "@/components/talent/offer-card";
import { OfferStickyHead, ShareButton } from "@/components/talent/offer-tools";
import { WhyCriteria } from "@/components/talent/offer-why";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { formatDate, formatDayMonth } from "@/lib/dates";
import { siteUrl } from "@/lib/seo";
import { disputeAction } from "@/server/actions/matching";
import { reportAction } from "@/server/actions/connect";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  disputeReasons,
  gapCourses,
  matchForUser,
  type MatchState,
} from "@/server/matching/service";
import { getJob } from "@/server/queries/public";
import { getApplicationDraft } from "@/server/services/application-draft";
import { contractFilterOf, parseCriteria, remoteFilterOf } from "@/server/services/jobs";
import { reportReasons } from "@/server/services/moderation";

export async function generateMetadata({
  params,
}: PageProps<"/app/jobs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations("talent.jobs.detail");
  const data = await getJob(slug);
  return {
    title: { absolute: t("seo", { jobTitle: data?.job.title ?? "" }) },
    robots: { index: false },
  };
}

const disputeStatus = {
  open: "open",
  in_review: "inReview",
  corrected: "corrected",
  confirmed: "confirmed",
} as const;

/** Level asked by the offer, from the years of experience it asks for. */
function levelOf(years: number) {
  if (years <= 0) return "none";
  if (years < 2) return "junior";
  if (years <= 5) return "mid";
  return "senior";
}

/**
 * An offer seen by a signed-in talent (planche talent-1 § 3 and 4). Everything is decided here:
 * the score and its « Pourquoi ? », « Préparer ma candidature » with Orbi, the course that closes
 * the gap, the check of the company. « Postuler » stays at the bottom, always visible. Applying is
 * free: no entitlement, no quota, no plan is checked here or in the action (golden rule n° 1), and
 * the knockout criteria are information, never a block. « Postuler » opens `/postuler`.
 */
export default async function TalentJobPage({
  params,
  searchParams,
}: PageProps<"/app/jobs/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;
  const user = await requireUser(`/app/jobs/${slug}`);
  const data = await getJob(slug);
  if (!data) notFound();
  const { job, open } = data;
  const t = await getTranslations();
  const d = dynamic(t);
  const profile = await db.talentProfile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      skills: { select: { skillId: true, skill: { select: { name: true } } } },
      documents: {
        where: { kind: "cv" },
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
        select: { id: true, title: true, isPrimary: true, updatedAt: true },
      },
      headline: true,
    },
  });
  const jobRow = await db.job.findUnique({ where: { slug }, select: { id: true } });
  const [application, saved] = jobRow
    ? await Promise.all([
        profile
          ? db.application.findUnique({
              where: { jobId_profileId: { jobId: jobRow.id, profileId: profile.id } },
              select: { id: true, createdAt: true },
            })
          : null,
        db.savedJob.findUnique({
          where: { userId_jobId: { userId: user.id, jobId: jobRow.id } },
        }),
      ])
    : [null, null];
  const company = job.organization.name;
  const cvs = profile?.documents ?? [];
  const outcome = typeof query.candidature === "string" ? query.candidature : undefined;

  // The application has its own pages (planche talent-2 § 1); old addresses lead there.
  if (outcome === "envoyee" && application) redirect(`/app/jobs/${slug}/postuler?envoyee=1`);
  if (query.postuler === "1" && open && !application) {
    const step = typeof query.etape === "string" ? `?etape=${encodeURIComponent(query.etape)}` : "";
    redirect(`/app/jobs/${slug}/postuler${step}`);
  }

  // ─── The offer. ─────────────────────────────────────────────────────────────────────
  const match: MatchState | null = jobRow ? await matchForUser(db, user.id, jobRow.id) : null;
  const ok = match?.state === "ok" ? match.explanation : null;
  const [gaps, dispute, draft] = await Promise.all([
    ok && jobRow ? gapCourses(db, user.id, jobRow.id) : Promise.resolve([]),
    ok && jobRow
      ? db.matchDispute.findFirst({
          where: { userId: user.id, jobId: jobRow.id },
          orderBy: { createdAt: "desc" },
          select: { status: true, scoreBefore: true, scoreAfter: true, resolution: true },
        })
      : Promise.resolve(null),
    jobRow && open && !application
      ? getApplicationDraft(db, user.id, jobRow.id)
      : Promise.resolve(null),
  ]);
  const tone = toneOf(company);
  const score = ok ? Math.round(ok.score) : null;
  const criteria = parseCriteria(job.knockoutCriteria);
  const mySkills = new Set(profile?.skills.map((skill) => skill.skillId));
  const workMode = t(`jobs.card.remote.${remoteFilterOf(job.remote)}`);
  const contract = t(`jobs.search.contract.${contractFilterOf(job.contractType)}`);
  const firstGap = gaps.find((gap) => gap.courses.length > 0);
  const owned = job.skills.filter((skill) => mySkills.has(skill.skillId));
  const missing = job.skills.filter(
    (skill) => !mySkills.has(skill.skillId) && skill.importance === "required",
  );
  const required = ok?.criteria.find((criterion) => criterion.key === "skills_required");
  const evidence = required?.evidence ?? [];
  const placeAndContract = ["location", "contract"].every(
    (key) => ok?.criteria.find((criterion) => criterion.key === key)?.status === "met",
  );
  const scoreLine = [
    evidence.length > 0
      ? t("offer.score.skills", {
          met: evidence.filter((item) => item.coverage >= 0.9).length,
          total: evidence.length,
        })
      : null,
    placeAndContract ? t("offer.score.placeContract") : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const revision = typeof query.revision === "string" ? query.revision : undefined;
  const disputePending = dispute && (dispute.status === "open" || dispute.status === "in_review");
  const back = `/app/jobs/${job.slug}`;
  const labels = await saveLabels();
  const save = (className: string) =>
    jobRow && (
      <SaveJobButton
        slug={job.slug}
        saved={Boolean(saved)}
        back={back}
        name={job.title}
        talent
        className={className}
        labels={labels}
      />
    );
  const salary = job.salaryMin !== null || job.salaryMax !== null ? salaryText(d, job) : null;

  const notice = (text: string, tone: "ok" | "err" | "" = "") => (
    <p role="status" className={cx("t-gar", tone && `t-${tone}`)}>
      <TalentIcon name={tone === "err" ? "aide" : "valider"} size="s" />
      {text}
    </p>
  );

  return (
    <div className="t-od t-od-bas">
      <OfferStickyHead
        watch="od-ban"
        title={job.title}
        backLabel={t("offer.back")}
        fallback="/app/jobs"
      >
        {save("t-bi t-press")}
      </OfferStickyHead>
      <div id="od-ban" className="t-od-ban">
        <Banner src={job.organization.banner} tone={tone} priority />
      </div>
      <div className="t-od-top">
        <BackButton fallback="/app/jobs" label={t("offer.back")} className="t-press" />
        <span className="flex gap-2">
          <ShareButton
            url={`${siteUrl()}/offres/${job.slug}`}
            title={job.title}
            label={t("offer.share")}
            copied={t("offer.shared")}
            className="t-bi t-press"
          />
          {save("t-bi t-press")}
        </span>
      </div>
      <div className="t-od-id">
        <Logo name={company} src={job.organization.logo} tone={tone} />
        <h1>{job.title}</h1>
        <div className="t-ent">
          <Link
            href={`/entreprises/${job.organization.slug}`}
            aria-label={t("offer.seeCompany", { company })}
          >
            {t("forMe.offers.line", { company, city: job.city })}
          </Link>
          {job.organization.verifiedAt && (
            <span className="t-verif">
              <TalentIcon name="valider" size="xs" />
              {t("offer.verified")}
            </span>
          )}
        </div>
      </div>
      <div className="t-tags">
        <span className="t-tag">{contract}</span>
        <span className="t-tag">{workMode}</span>
        <span className="t-tag">{d(`offer.level.${levelOf(job.experienceMin)}`)}</span>
        {job.closesAt && (
          <span className="t-tag">
            {t("offer.deadline", { date: formatDayMonth(job.closesAt) })}
          </span>
        )}
        {salary && <span className="t-tag">{salary}</span>}
      </div>

      {outcome === "deja" && notice(t("offer.notice.already"))}
      {query.brouillon === "1" && draft && notice(t("talent.jobs.apply.flow.kept"))}
      {(outcome === "close" || !open) && notice(t("offer.bar.closed"), "err")}
      {query.signalement === "ok" && notice(t("report.success"), "ok")}
      {query.signalement === "deja" && notice(t("report.already"))}

      {ok && score !== null ? (
        <section aria-label={t("offer.score.title")} className="t-verre t-sc-c">
          <span
            className="t-anneau"
            role="img"
            aria-label={t("offer.score.ring", { score })}
            style={{ "--p": score } as React.CSSProperties}
          >
            <b aria-hidden>{t("forMe.offers.score", { score })}</b>
          </span>
          <div className="t-t">
            <b>{t("offer.score.title")}</b>
            {scoreLine && <span>{scoreLine}</span>}
          </div>
          <SheetButton
            target="od-why"
            label={t("offer.score.whyAria", { score })}
            className="t-pq t-press"
          >
            <TalentIcon name="pourquoi" size="s" />
            {t("offer.score.why")}
          </SheetButton>
        </section>
      ) : (
        <section className="t-verre t-vf">
          <span className="t-cases" aria-hidden>
            <TalentIcon name="pourquoi" size="s" />
          </span>
          <div className="t-t">
            {match?.state === "optedOut" ? (
              <span>
                {t("offer.score.optedOut")}{" "}
                <Link href="/app/parametres?onglet=confidentialite">
                  {t("offer.score.optedOutCta")}
                </Link>
              </span>
            ) : (
              <span>
                {t("offer.score.incomplete")}{" "}
                <Link href="/app/profil#competences">{t("offer.score.incompleteCta")}</Link>
              </span>
            )}
          </div>
        </section>
      )}

      <SheetButton target="od-prep" className="t-verre t-prep t-press">
        <OrbiMark size={40} />
        <span className="t-t">
          <b>{t("offer.prepare.title")}</b>
          <span>{t("offer.prepare.line")}</span>
        </span>
        <TalentIcon name="suivant" size="s" />
      </SheetButton>

      {job.responsibilities.length > 0 && (
        <section className="t-verre t-bloc-t">
          <h2>{t("offer.missions")}</h2>
          <ul>
            {job.responsibilities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}
      <section className="t-verre t-bloc-t">
        <h2>{t("offer.description")}</h2>
        <p>{job.description}</p>
      </section>
      {job.skills.length > 0 && (
        <section className="t-verre t-bloc-t">
          <h2>{t("offer.skills")}</h2>
          <ul className="t-cmp" style={{ listStyle: "none", padding: 0 }}>
            {[...owned, ...job.skills.filter((skill) => !mySkills.has(skill.skillId))].map(
              (skill) => (
                <li key={skill.skillId} className="contents">
                  {mySkills.has(skill.skillId) ? (
                    <span aria-label={t("offer.skillOwned", { skill: skill.skill.name })}>
                      <TalentIcon name="valider" size="xs" />
                      {skill.skill.name}
                    </span>
                  ) : (
                    <span className="t-m">{skill.skill.name}</span>
                  )}
                </li>
              ),
            )}
          </ul>
        </section>
      )}
      {firstGap && (
        <article className="t-verre t-mg">
          <span className="t-vign">
            <CourseArt category="digital" />
          </span>
          <div className="t-t">
            <small>{t("offer.progress.eyebrow")}</small>
            <Link href={`/app/learn/${firstGap.courses[0]!.slug}`} className="t-lien">
              <b>{firstGap.courses[0]!.title}</b>
            </Link>
            <span>
              {t("offer.progress.line", {
                duration:
                  firstGap.courses[0]!.durationMinutes >= 60
                    ? t("forMe.learn.hours", {
                        count: Math.round(firstGap.courses[0]!.durationMinutes / 6) / 10,
                      })
                    : t("forMe.learn.minutes", { count: firstGap.courses[0]!.durationMinutes }),
                score: firstGap.newScore,
              })}
            </span>
          </div>
          <TalentIcon name="suivant" size="s" />
        </article>
      )}
      {job.requirements.length > 0 && (
        <section className="t-verre t-bloc-t">
          <h2>{t("offer.profile")}</h2>
          <ul>
            {job.requirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}
      {criteria.length > 0 && (
        <section className="t-verre t-bloc-t">
          <h2>{t("offer.knockout")}</h2>
          <ul>
            {criteria.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>{t("offer.knockoutHint")}</p>
        </section>
      )}
      {job.benefits.length > 0 && (
        <section className="t-verre t-bloc-t">
          <h2>{t("offer.benefits")}</h2>
          <ul>
            {job.benefits.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}
      {job.process.length > 0 && (
        <section className="t-verre t-bloc-t">
          <h2>{t("offer.process")}</h2>
          <ol className="flex list-decimal flex-col gap-1 pl-[18px] text-[13px] text-[var(--texte2)]">
            {job.process.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
      )}
      <section className="t-verre t-vf">
        <span className="t-cases" aria-hidden>
          <TalentIcon name="confidentialite" size="s" />
        </span>
        <div className="t-t">
          <b>
            {job.organization.verifiedAt ? t("offer.check.verifiedTitle") : t("offer.check.title")}
          </b>
          <span>
            {job.organization.verifiedAt
              ? t("offer.check.verifiedText", { date: formatDate(job.organization.verifiedAt) })
              : t("offer.check.text")}
          </span>
        </div>
      </section>
      {jobRow && (
        <SheetButton target="od-sig" className="t-sig t-press">
          <TalentIcon name="aide" size="xs" />
          {t("offer.report")}
        </SheetButton>
      )}

      {/* Postuler, always visible and always free. */}
      <div className="t-verre t-fort t-bas-f t-barre-p">
        <span className="t-gratuit">{t("offer.bar.free")}</span>
        {save("t-bi t-press")}
        {application ? (
          <Link href={`/app/suivi/${application.id}`} className="t-bt t-p t-press">
            {t("offer.bar.applied")}
          </Link>
        ) : open ? (
          <Link href={`/app/jobs/${job.slug}/postuler`} className="t-bt t-a t-press">
            <TalentIcon name="envoyer" size="s" />
            {draft ? t("offer.bar.resume") : t("offer.bar.apply")}
          </Link>
        ) : (
          <span className="t-bt t-off">{t("offer.bar.apply")}</span>
        )}
      </div>

      {/* Préparer ma candidature: Orbi, over the offer. */}
      <Sheet
        id="od-prep"
        title={t("offer.prepare.title")}
        closeLabel={t("offer.close")}
        head={
          <div className="t-or-tete">
            <OrbiMark size={40} />
            <div className="t-t">
              <b>{t("offer.prepare.title")}</b>
              <span>{t("offer.prepare.subtitle", { job: job.title, company })}</span>
            </div>
          </div>
        }
      >
        <span className="t-ck-t">{t("offer.prepare.matches")}</span>
        <ul className="t-ck">
          {owned.length > 0 ? (
            <li className="t-l t-ok">
              <i aria-hidden>
                <TalentIcon name="valider" size="xs" />
              </i>
              <div className="t-t">
                <b>{owned.map((skill) => skill.skill.name).join(", ")}</b>
                <span>
                  {cvs[0]
                    ? t("offer.prepare.inCv", { cv: cvs[0].title })
                    : t("offer.prepare.inProfile")}
                </span>
              </div>
            </li>
          ) : (
            <li className="t-l">
              <div className="t-t">
                <span>{t("offer.prepare.none")}</span>
              </div>
            </li>
          )}
          {placeAndContract && (
            <li className="t-l t-ok">
              <i aria-hidden>
                <TalentIcon name="valider" size="xs" />
              </i>
              <div className="t-t">
                <b>{[job.city, contract, workMode.toLowerCase()].join(", ")}</b>
                <span>{t("offer.prepare.prefs")}</span>
              </div>
            </li>
          )}
        </ul>
        {job.skills.length > 0 && <span className="t-ck-t">{t("offer.prepare.missing")}</span>}
        {job.skills.length > 0 && (
          <ul className="t-ck">
            {missing.length > 0 ? (
              missing.map((skill) => (
                <li key={skill.skillId} className="t-l t-ko">
                  <i aria-hidden>
                    <TalentIcon name="plus" size="xs" />
                  </i>
                  <div className="t-t">
                    <b>{skill.skill.name}</b>
                    <span>{t("offer.prepare.absent")}</span>
                  </div>
                  <Link
                    href="/app/profil?section=competences#competences"
                    aria-label={t("offer.prepare.addAria", { skill: skill.skill.name })}
                    className="t-ac t-press"
                  >
                    {t("offer.prepare.add")}
                  </Link>
                </li>
              ))
            ) : (
              <li className="t-l">
                <div className="t-t">
                  <span>{t("offer.prepare.complete")}</span>
                </div>
              </li>
            )}
          </ul>
        )}
        <Link
          href={cvs[0] ? `/app/career/cv/${cvs[0].id}#adapter` : "/app/career/cv"}
          className="t-bt t-p t-pl t-press"
        >
          <TalentIcon name="cv" size="s" />
          {cvs[0] ? t("offer.prepare.tailor") : t("offer.prepare.createCv")}
        </Link>
        <p className="t-gar">
          <TalentIcon name="cadenas" size="s" />
          {t("offer.prepare.guard")}
        </p>
      </Sheet>

      {ok && score !== null && (
        <>
          {/* Pourquoi 86 % ? The criteria, never personal data; the score can be contested. */}
          <Sheet
            id="od-why"
            title={t("offer.why.title", { score })}
            closeLabel={t("offer.close")}
            openParam="pourquoi"
            defaultOpen={query.pourquoi === "1"}
          >
            <p className="t-ss">{t("offer.why.text")}</p>
            <WhyCriteria explanation={ok} />
            <p className="t-gar">
              <TalentIcon name="pourquoi" size="s" />
              {t("offer.why.guard")}
            </p>
            <Link
              href="/comment-fonctionne-le-matching"
              className="text-center text-[12.5px] font-semibold underline underline-offset-2"
            >
              {t("match.why.talent.learnMore")}
            </Link>
            {dispute && (
              <p className="t-gar">
                <TalentIcon name="horloge" size="s" />
                <span>
                  {d(`ai.dispute.status.${disputeStatus[dispute.status]}`)}
                  {dispute.status === "corrected" && dispute.scoreAfter !== null && (
                    <>
                      {" · "}
                      {t("ai.dispute.result.corrected", {
                        oldScore: dispute.scoreBefore,
                        newScore: dispute.scoreAfter,
                      })}
                    </>
                  )}
                  {dispute.status === "confirmed" && (
                    <>
                      {" · "}
                      {t("ai.dispute.result.confirmed", { reason: dispute.resolution ?? "" })}
                    </>
                  )}
                </span>
              </p>
            )}
            {!disputePending && (
              <SheetButton target="od-contest" className="t-bt t-sec t-pl t-press">
                {t("offer.why.contest")}
              </SheetButton>
            )}
          </Sheet>

          <Sheet
            id="od-contest"
            title={t("ai.dispute.title")}
            closeLabel={t("offer.close")}
            openParam="revision"
            defaultOpen={Boolean(revision)}
          >
            {revision === "created" &&
              notice(
                [
                  t("ai.dispute.sent", { days: DISPUTE_REPLY_DAYS }),
                  application ? t("ai.dispute.applicationUnaffected") : null,
                ]
                  .filter(Boolean)
                  .join(" "),
                "ok",
              )}
            {revision === "already" && notice(t("ai.dispute.already"))}
            {revision === "invalide" && notice(t("ai.dispute.invalid"), "err")}
            {revision === "noScore" && notice(t("ai.dispute.noScore"), "err")}
            {!disputePending && (
              <form action={disputeAction} className="flex flex-col gap-3">
                <input type="hidden" name="job" value={job.slug} />
                <p className="t-ss mt-0!">{t("ai.dispute.intro")}</p>
                <p className="t-gar">
                  <TalentIcon name="profil" size="s" />
                  <span>
                    {t("ai.dispute.fixFirst.text")}{" "}
                    <Link href="/app/profil" className="font-semibold underline">
                      {t("ai.dispute.fixFirst.cta")}
                    </Link>
                  </span>
                </p>
                <fieldset className="t-fs">
                  <legend className="t-lab-c">{t("ai.dispute.what.text")}</legend>
                  <div className="t-choix">
                    {disputeReasons.map((reason) => (
                      <label key={reason} className="t-verre t-ch">
                        <input type="radio" name="reason" value={reason} required />
                        <span className="t-t">
                          <b>{d(`ai.dispute.what.${reason}`)}</b>
                        </span>
                        <span className="t-radio" aria-hidden />
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="t-champ">
                  <label htmlFor="od-dispute-details">{t("ai.dispute.details.text")}</label>
                  <textarea
                    id="od-dispute-details"
                    name="details"
                    placeholder={t("ai.dispute.details.placeholder", { company })}
                    minLength={10}
                    maxLength={2000}
                    required
                  />
                </div>
                {application && (
                  <label className="t-li min-h-11 cursor-pointer border-0 p-0">
                    <span className="t-t">
                      <b>{t("ai.dispute.notifyRecruiter")}</b>
                    </span>
                    <input
                      type="checkbox"
                      role="switch"
                      name="notifyRecruiter"
                      value="on"
                      className="sr-only"
                    />
                    <span aria-hidden className="t-sw" />
                  </label>
                )}
                <button type="submit" className="t-bt t-p t-pl t-press">
                  {t("ai.dispute.humanReview")}
                </button>
                <p className="t-ss mt-0!">{t("ai.dispute.contact")}</p>
              </form>
            )}
          </Sheet>
        </>
      )}

      {jobRow && (
        <Sheet
          id="od-sig"
          title={t("report.title.job")}
          closeLabel={t("offer.close")}
          openParam="signaler"
          defaultOpen={query.signaler === "1"}
        >
          <form action={reportAction} className="flex flex-col gap-3">
            <input type="hidden" name="targetType" value="job" />
            <input type="hidden" name="targetId" value={jobRow.id} />
            <input type="hidden" name="back" value={back} />
            <p className="t-ss mt-0!">{t("report.intro")}</p>
            <fieldset className="t-fs">
              <legend className="t-lab-c">{t("report.reason.text")}</legend>
              <div className="t-choix">
                {reportReasons.map((reason) => (
                  <label key={reason} className="t-verre t-ch">
                    <input type="radio" name="reason" value={reason} required />
                    <span className="t-t">
                      <b>{d(`report.reason.${reason}`)}</b>
                    </span>
                    <span className="t-radio" aria-hidden />
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="t-champ">
              <label htmlFor="od-report-details">{t("report.details.text")}</label>
              <textarea
                id="od-report-details"
                name="details"
                maxLength={1000}
                placeholder={t("report.details.placeholder")}
              />
            </div>
            <p className="t-ss mt-0!">{t("report.urgent")}</p>
            <button type="submit" className="t-bt t-p t-pl t-press">
              {t("report.submit")}
            </button>
          </form>
        </Sheet>
      )}
    </div>
  );
}
