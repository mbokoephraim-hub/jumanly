import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Logo, toneOf } from "@/components/talent/art";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { dynamic } from "@/i18n/dynamic";
import { startInterviewAction } from "@/server/actions/career-interviews";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { interviewDurations } from "@/server/services/interview-sim";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { NewPractice } from "./new-practice";
import { isPhone } from "@/server/view";
import { PhonePracticeSetup } from "@/components/phone/interview/setup";
import { InterviewTexts, setupView } from "@/components/phone/interview/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("practice");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

const durationText = { 10: "quick", 20: "standard", 30: "full" } as const;
const errors = ["consent", "entitlement", "quota", "invalid"] as const;

/**
 * « S'entraîner » (planche talent-2 § 4, briefing): what to know about the company and the offer,
 * built only from the offer and the profile, then the length and written or spoken. Opened from an
 * application (`?candidature=`) or an offer (`?offre=`). The recruiter never sees the practice.
 * Each session uses one unit of `career.interview.text.monthly` or `.voice.monthly`.
 */
export default async function PracticeBriefingPage({
  searchParams,
}: PageProps<"/app/career/entretiens/nouveau">) {
  const query = await searchParams;
  const user = await requireUser("/app/career/entretiens/nouveau");
  // On the phone (Modèle B, lot B6): the settings, Orbi's preparation and the trial.
  if (await isPhone())
    return (
      <InterviewTexts>
        <PhonePracticeSetup view={await setupView(user.id, query)} />
      </InterviewTexts>
    );
  const t = await getTranslations();
  const d = dynamic(t);
  const format = await getFormatter();
  const now = new Date();
  const applicationId =
    typeof query.candidature === "string" ? query.candidature.slice(0, 60) : null;
  const offer = typeof query.offre === "string" ? query.offre.slice(0, 200) : null;

  const jobSelect = {
    id: true,
    slug: true,
    title: true,
    city: true,
    skills: {
      where: { importance: "required" as const },
      orderBy: { weight: "desc" as const },
      select: { skill: { select: { id: true, name: true } } },
    },
    organization: { select: { name: true, logo: true, sector: true, city: true } },
  };
  const application = applicationId
    ? await db.application.findFirst({
        where: { id: applicationId, profile: { userId: user.id } },
        select: {
          id: true,
          job: { select: jobSelect },
          interviews: {
            where: { status: "confirmed", startsAt: { gt: now } },
            orderBy: { startsAt: "asc" },
            take: 1,
            select: { startsAt: true, mode: true, timezone: true },
          },
        },
      })
    : null;
  const job =
    application?.job ??
    (offer
      ? await db.job.findFirst({ where: { slug: offer, status: "published" }, select: jobSelect })
      : null);
  const profile = await db.talentProfile.findUnique({
    where: { userId: user.id },
    select: { headline: true, skills: { select: { skillId: true } } },
  });
  const owned = new Set(profile?.skills.map((entry) => entry.skillId) ?? []);
  const checked = job?.skills.slice(0, 3).map((entry) => entry.skill.name) ?? [];
  const weak = job?.skills.find((entry) => !owned.has(entry.skill.id))?.skill.name ?? null;
  const interview = application?.interviews[0] ?? null;
  const company = job?.organization.name ?? null;
  const back = application
    ? `/app/suivi/${application.id}`
    : job
      ? `/app/jobs/${job.slug}`
      : "/app/career/entretiens";
  const here = `/app/career/entretiens/nouveau${
    application ? `?candidature=${application.id}` : job ? `?offre=${job.slug}` : ""
  }`;
  const error = errors.find((code) => code === query.erreur);
  const mode = query.mode === "voice" ? "voice" : "text";

  // Without an offer: « Nouvel entraînement » (planche talent-4 § 5 bis).
  if (!job)
    return (
      <NewPractice
        userId={user.id}
        jobTitle={profile?.headline ?? ""}
        mode={mode}
        type={typeof query.type === "string" ? query.type : null}
        fromOffer={query.source === "offre"}
        error={error ?? null}
      />
    );

  return (
    <form action={startInterviewAction} className="t-flux t-large t-pq-w t-brf">
      <FlowHead
        back={back}
        backLabel={t("practice.back")}
        title={t("practice.title")}
        end={
          <Link href={back} className="t-bi t-press" aria-label={t("practice.close")}>
            <TalentIcon name="fermer" size="s" />
          </Link>
        }
      />
      <p className="t-w-sous">
        {interview?.startsAt
          ? t("practice.web.subtitle", {
              date: format.dateTime(interview.startsAt, {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: interview.timezone,
              }),
            })
          : [job.title, company].filter(Boolean).join(" · ")}
      </p>
      <input type="hidden" name="from" value={here} />
      <input type="hidden" name="type" value={checked.length > 0 ? "technical" : "hr"} />
      <input type="hidden" name="level" value="standard" />
      {job && <input type="hidden" name="jobId" value={job.id} />}

      {error && (
        <p role="status" className="t-gar t-err">
          <TalentIcon name="aide" size="s" />
          <span>
            {t(`entrain.error.${error}`)}{" "}
            {(error === "entitlement" || error === "quota") && (
              <Link href="/app/abonnement" className="t-lien-d">
                {t("apply.docs.orbi.errorCta.entitlement")}
              </Link>
            )}
          </span>
        </p>
      )}

      <div className="t-brf-g">
        <div className="t-flux t-brf-l">
          {job && company ? (
            <>
              <input type="hidden" name="jobTitle" value={job.title} />
              <section aria-labelledby="pr-savoir" className="t-verre t-brief">
                <h2 id="pr-savoir" className="t-h4">
                  {t("practice.know.title")}
                </h2>
                <div className="t-ck">
                  <div className="t-l t-ok">
                    <i aria-hidden>
                      <TalentIcon name="valider" size="xs" />
                    </i>
                    <div className="t-t">
                      <b>{t("practice.know.company")}</b>
                      <span>
                        {[job.organization.sector, job.organization.city ?? job.city, company]
                          .filter(Boolean)
                          .slice(0, 2)
                          .join(", ")}
                      </span>
                    </div>
                  </div>
                  {checked.length > 0 && (
                    <div className="t-l t-ok">
                      <i aria-hidden>
                        <TalentIcon name="valider" size="xs" />
                      </i>
                      <div className="t-t">
                        <b>{t("practice.know.checked")}</b>
                        <span>{checked.join(", ")}</span>
                      </div>
                    </div>
                  )}
                  {weak && (
                    <div className="t-l t-ko">
                      <i aria-hidden>
                        <TalentIcon name="plus" size="xs" />
                      </i>
                      <div className="t-t">
                        <b>{t("practice.know.weak")}</b>
                        <span>{t("practice.know.weakLine", { skill: weak })}</span>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : null}

          <section aria-labelledby="pr-type" className="t-verre t-brief">
            <h2 id="pr-type" className="t-h4">
              {t("practice.kind.title")}
            </h2>
            <fieldset className="t-fs">
              <legend className="sr-only">{t("practice.kind.length")}</legend>
              <div className="t-opts">
                {interviewDurations.map((minutes) => (
                  <label key={minutes} className="t-press">
                    <input
                      type="radio"
                      name="durationMinutes"
                      value={minutes}
                      defaultChecked={minutes === 20}
                    />
                    <b>{d(`practice.kind.${durationText[minutes]}`)}</b>
                    {t("practice.kind.minutes", { count: minutes })}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="t-fs">
              <legend className="sr-only">{t("practice.kind.mode")}</legend>
              <div className="t-puces">
                {(["text", "voice"] as const).map((value) => (
                  <label key={value} className="t-puce t-press">
                    <input
                      type="radio"
                      name="mode"
                      value={value}
                      defaultChecked={value === mode}
                      className="sr-only"
                    />
                    {d(`practice.kind.${value}`)}
                  </label>
                ))}
              </div>
            </fieldset>
          </section>
        </div>
        <div className="t-flux t-brf-r">
          {company && (
            <div className="t-verre t-cd t-min t-brf-cd">
              <div className="t-haut">
                <Logo name={company} src={job.organization.logo} tone={toneOf(company)} />
                <div className="t-t">
                  <b>{interview ? t("practice.interviewWith", { company }) : job.title}</b>
                  <span>
                    {interview?.startsAt
                      ? [
                          format.dateTime(interview.startsAt, {
                            weekday: "long",
                            day: "numeric",
                            month: "short",
                            timeZone: interview.timezone,
                          }),
                          format.dateTime(interview.startsAt, {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: interview.timezone,
                          }),
                          d(`practice.mode.${interview.mode}`),
                        ].join(" · ")
                      : company}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className="t-verre t-w-seul t-brf-os">
            <div className="t-haut">
              <OrbiMark size={40} />
              <div className="t-t">
                <b>{t("practice.web.with")}</b>
                <span>{t("practice.web.withLine")}</span>
              </div>
            </div>
            <p>{t("practice.web.withText")}</p>
          </div>
          <div className="t-verre t-fort t-bas-f">
            <button type="submit" className="t-bt t-a t-pl t-press">
              <TalentIcon name="entretien" size="s" />
              {t("practice.start")}
            </button>
          </div>
          <p className="t-gar">
            <TalentIcon name="cadenas" size="s" />
            <span>{t("practice.private")}</span>
          </p>
        </div>
      </div>
    </form>
  );
}
