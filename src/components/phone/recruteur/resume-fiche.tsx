import "server-only";
import Link from "next/link";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { MenuArt } from "@/components/site/menu-art";
import { countryCode, countryName, flagOf, languageFlagOf } from "@/lib/countries";
import { languageName } from "@/lib/dates";
import { markCriterionAction, sortGestureAction } from "@/server/actions/hire-tri";
import { db } from "@/server/db";
import { applicationMatches } from "@/server/matching/service";
import type { MatchExplanation } from "@/server/matching/types";
import { sentAttachments } from "@/server/services/application-attachments";
import { ANALYSIS_EVENT } from "@/server/services/cv-analysis";
import { hirePermissions, HireError, recordView, type HireContext } from "@/server/services/hire";
import { atsBoard } from "@/server/services/hire-ats";
import { rankByClass } from "@/server/services/hire-classes";
import { proposedQuestions } from "@/server/services/hire-interviews";
import { highlightsOf } from "@/server/services/hire-phone-candidatures";
import { isOnHold } from "@/server/services/hire-tri";
import { parseCriteria } from "@/server/services/jobs";
import { PhoneIcon } from "../icon";
import { initialsOf, tintOf } from "./candidatures";
import { SwipePager } from "./tri-client";
import { RhUndoGesture } from "./tri";

const MONTH = 30.44 * 86_400_000;

const CONTRACTS = [
  "cdi",
  "cdd",
  "internship",
  "freelance",
  "apprenticeship",
  "volunteer",
  "partTime",
] as const;
const LEVELS = ["native", "fluent", "professional", "intermediate", "basic"] as const;

type Language = { code: string; level: string };
const languagesOf = (value: unknown): Language[] =>
  Array.isArray(value)
    ? value.flatMap((item) =>
        item && typeof item === "object" && typeof (item as Language).code === "string"
          ? [{ code: (item as Language).code, level: String((item as Language).level ?? "") }]
          : [],
      )
    : [];

/**
 * The summary of a candidate, before any document (« Logique du recrutement », la fiche résumé,
 * Ephraïm 01/11/2026): identity with the flag and the current situation, one sentence, six skills
 * (those of the offer first), a short timeline, the practical points and the documents with their
 * state. The Orbi block (score, class, reasons, gaps, two questions) comes with the matching level
 * of the organization (`hire.matching.level`). Fixed at the bottom: Ne pas retenir · En attente ·
 * Retenir; a horizontal swipe goes to the next candidate in the order of the ranking. Opening it
 * is logged (golden rule n° 5).
 */
export async function RhCandidateSummary({
  ctx,
  jobId,
  applicationId,
  stageId,
  query,
  sortable,
}: {
  ctx: HireContext;
  jobId: string;
  applicationId: string;
  stageId: string | undefined;
  query: Record<string, string | string[] | undefined>;
  sortable: boolean;
}) {
  const t = await getTranslations("phoneRhTri");
  const tr = await getTranslations("phoneRhCandidatures");
  const tc = await getTranslations("talent.profile.preferences.contract");
  const tl = await getTranslations("talent.profile.languages.level");
  const format = await getFormatter();
  const now = new Date();
  const board = await atsBoard(db, ctx, jobId, now);
  const row = board.rows.find((item) => item.id === applicationId);
  if (!row) notFound();
  const application = await recordView(db, ctx, applicationId, now).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const permissions = hirePermissions(ctx.role);
  const { profile, job } = application;
  const person = profile.user;

  // ─── The order of the ranking, inside the stage of the candidate ─────────────────
  const sameStage = board.rows.filter(
    (item) => item.stage.name === row.stage.name && item.status === row.status,
  );
  const ranked = rankByClass(sameStage);
  const at = ranked.findIndex((item) => item.id === row.id);
  const stageParam = stageId ? `&etape=${stageId}` : "";
  const hrefOf = (id: string) => `/app/hire/offres/${jobId}?vue=candidats${stageParam}&fiche=${id}`;
  const next = at >= 0 && at < ranked.length - 1 ? hrefOf(ranked[at + 1]!.id) : null;
  const previous = at > 0 ? hrefOf(ranked[at - 1]!.id) : null;
  const self = hrefOf(row.id);
  const list = `/app/hire/offres/${jobId}?vue=candidats${stageParam}`;

  // ─── Identity and the sentence ───────────────────────────────────────────────────
  const code = countryCode(person.country);
  const current = profile.experiences.find((item) => item.endDate === null) ?? null;
  const studying = profile.educations.find(
    (item) => item.endYear === null || item.endYear >= now.getUTCFullYear(),
  );
  const situation = current
    ? t("identity.job", { title: current.title, company: current.company })
    : studying
      ? t("identity.studies", { degree: studying.degree, school: studying.school })
      : null;
  const months = profile.experiences.reduce(
    (sum, item) =>
      sum + Math.max(0, ((item.endDate ?? now).getTime() - item.startDate.getTime()) / MONTH),
    0,
  );
  const years = Math.floor((months + 0.5) / 12);
  const availability =
    profile.availability === "not_looking"
      ? tr("availability.not")
      : profile.availableFrom && profile.availableFrom > now
        ? t("sentence.from", { date: profile.availableFrom })
        : profile.availability === "listening"
          ? tr("availability.listening")
          : t("sentence.now");
  const sentence = [
    profile.headline,
    years > 0 ? t("sentence.years", { count: years }) : null,
    person.city,
    availability,
  ]
    .filter(Boolean)
    .join(", ");

  // ─── Skills: those of the offer first, six at most ───────────────────────────────
  const offerSkills = new Set(job.skills.map((item) => item.skillId));
  const skills = [...profile.skills]
    .sort(
      (a, b) =>
        Number(offerSkills.has(b.skillId)) - Number(offerSkills.has(a.skillId)) ||
        b.level - a.level,
    )
    .slice(0, 6)
    .map((item) => ({
      name: item.skill.name,
      asked: offerSkills.has(item.skillId),
      proven: item.verified || ["certificate", "project", "experience"].includes(item.proof ?? ""),
    }));

  // ─── Timeline ────────────────────────────────────────────────────────────────────
  const year = (date: Date | null) => (date ? String(date.getUTCFullYear()) : t("timeline.today"));
  const timeline = [
    ...profile.experiences.slice(0, 3).map((item) => ({
      id: item.id,
      kind: "xp" as const,
      title: item.title,
      where: item.company,
      when: `${year(item.startDate)} – ${year(item.endDate)}`,
    })),
    ...profile.educations.slice(0, 1).map((item) => ({
      id: item.id,
      kind: "edu" as const,
      title: item.degree,
      where: item.school,
      when: item.endYear ? String(item.endYear) : t("timeline.today"),
    })),
  ];

  // ─── Practical points ────────────────────────────────────────────────────────────
  const languages = languagesOf(profile.languages).slice(0, 4);
  const contracts = profile.desiredContracts
    .map((key) => CONTRACTS.find((item) => item === key))
    .filter((key) => key !== undefined)
    .map((key) => tc(key));
  const mobility = [
    profile.relocation ? t("practical.relocation") : null,
    ...profile.desiredLocations.slice(0, 2),
  ].filter(Boolean);

  // ─── Documents and their state ───────────────────────────────────────────────────
  const read = application.events.some((event) => event.type === ANALYSIS_EVENT);
  const attachments = sentAttachments(application.attachments);
  const state = (verified: boolean): "verified" | "read" | "received" =>
    verified ? "verified" : read ? "read" : "received";
  const documents = [
    application.cvSnapshot
      ? { key: "cv", title: t("documents.cv"), state: state(false), href: "?onglet=cv" }
      : null,
    application.coverLetter?.trim()
      ? {
          key: "letter",
          title: t("documents.letter"),
          state: state(false),
          href: "?onglet=reponses",
        }
      : null,
    ...attachments.map((item, index) => ({
      key: `a-${index}`,
      title: item.title,
      // An attestation of Jumanly is checked by its code: it counts as verified.
      state: state(item.type === "certificate"),
      href: "?onglet=reponses",
    })),
  ].filter((item): item is NonNullable<typeof item> => item !== null);
  const missingAsked = Math.max(0, row.documents.asked - row.documents.received);

  // ─── Orbi ────────────────────────────────────────────────────────────────────────
  const match = board.withScores
    ? await applicationMatches(db, [application], now).then((map) => map.get(application.id))
    : undefined;
  const explanation: MatchExplanation | null = match && match !== "disabled" ? match : null;
  const latest = profile.experiences[0] ?? null;
  const { notes } = highlightsOf(
    explanation,
    latest ? { title: latest.title, company: latest.company } : null,
    job.city,
  );
  const gaps = [
    ...(explanation?.missingSkills ?? [])
      .filter((item) => item.importance === "required")
      .map((item) => t("orbi.gapSkill", { skill: item.skill })),
    ...(explanation?.criteria ?? [])
      .filter((item) => item.key === "languages" && item.status === "unmet")
      .map(() => t("orbi.gapLanguages")),
    ...(explanation?.criteria ?? [])
      .filter((item) => item.key === "experience" && item.status === "unmet")
      .map(() => t("orbi.gapExperience")),
  ].slice(0, 2);
  const questions = proposedQuestions(application, 2);

  // ─── Elimination criteria ────────────────────────────────────────────────────────
  const criteria = parseCriteria(job.knockoutCriteria);
  const live = sortable && permissions.manage && application.status === "active";
  const onHold = isOnHold(application.events);
  const shortlisted = application.shortlistedAt !== null;

  const gestureForm = (id: string, gesture: string, target: string) => (
    <form id={id} action={sortGestureAction} hidden>
      <input type="hidden" name="application" value={row.id} />
      <input type="hidden" name="job" value={jobId} />
      <input type="hidden" name="gesture" value={gesture} />
      <input type="hidden" name="back" value={target} />
    </form>
  );
  // After « Retenir » or « En attente », the next candidate opens (« trier les 15 »).
  const after = next ?? list;

  return (
    <SwipePager next={next} previous={previous}>
      <div className="nb-page nb-rh-detail nb-rh-fr" data-classe={row.orbiClass ?? undefined}>
        <header className="nb-rh-barre">
          <Link href={list} className="nb-rh-retour">
            <PhoneIcon name="retour" size={20} />
            {t("back")}
          </Link>
          {at >= 0 ? (
            <span className="nb-rh-fr-nav">
              {previous ? (
                <Link href={previous} aria-label={t("previous")} className="nb-rond">
                  <PhoneIcon name="retour" size={18} />
                </Link>
              ) : null}
              <span className="nb-meta">
                {t("position", { index: at + 1, total: ranked.length })}
              </span>
              {next ? (
                <Link href={next} aria-label={t("next")} className="nb-rond nb-rh-fr-suiv">
                  <PhoneIcon name="retour" size={18} />
                </Link>
              ) : null}
            </span>
          ) : null}
        </header>
        <RhUndoGesture query={query} jobId={jobId} back={self} />

        <section className="nb-rh-fr-id" aria-labelledby="rh-fr-nom">
          <span className="nb-rh-ini nb-rh-ini-l" data-teinte={tintOf(row.id)} aria-hidden>
            {initialsOf(person.name)}
          </span>
          <span className="nb-rh-res-t">
            <h1 id="rh-fr-nom">{person.name}</h1>
            {profile.headline ? <p className="nb-rh-fr-titre">{profile.headline}</p> : null}
            {person.city || code ? (
              <p className="nb-meta">
                {[person.city, code ? flagOf(code) : null].filter(Boolean).join(" ")}
                {code ? <span className="sr-only">{countryName(code)}</span> : null}
              </p>
            ) : null}
            {situation ? <p className="nb-meta">{situation}</p> : null}
          </span>
          {shortlisted || onHold ? (
            <span className="nb-rh-fr-etat" data-etat={shortlisted ? "retenu" : "attente"}>
              {shortlisted ? t("state.retained") : t("state.hold")}
            </span>
          ) : null}
        </section>
        {sentence ? <p className="nb-rh-fr-phrase">{sentence}</p> : null}

        {board.withScores ? (
          <section className="nb-rh-fr-s nb-rh-fr-orbi" aria-labelledby="rh-fr-orbi">
            <h2 id="rh-fr-orbi">
              <span className="nb-rh-etoile" aria-hidden />
              {t("orbi.title")}
            </h2>
            {explanation ? (
              <>
                <div className="nb-rh-fr-score">
                  <span
                    className="nb-rh-anneau nb-rh-anneau-l"
                    style={{ "--p": explanation.score } as CSSProperties}
                    role="img"
                    aria-label={t("orbi.score", { value: explanation.score })}
                  >
                    <b aria-hidden>{explanation.score}</b>
                  </span>
                  <span className="nb-rh-res-t">
                    <b>{row.orbiClass ? t(`class.${row.orbiClass}`) : null}</b>
                    <span className="nb-meta">{t("orbi.rule")}</span>
                  </span>
                </div>
                {notes.length > 0 ? (
                  <>
                    <p className="nb-rh-f-verif" data-lime="">
                      {t("orbi.reasons")}
                    </p>
                    <ul className="nb-rh-puces">
                      {notes.slice(0, 3).map((note, index) => (
                        <li key={index}>{tr(`notes.${note.key}`, note as never)}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {gaps.length > 0 ? (
                  <>
                    <p className="nb-rh-f-verif">{t("orbi.gaps")}</p>
                    <ul className="nb-rh-puces" data-ambre="">
                      {gaps.map((gap) => (
                        <li key={gap}>{gap}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {questions.length > 0 ? (
                  <>
                    <p className="nb-rh-f-verif">{t("orbi.questions")}</p>
                    <ol className="nb-rh-fr-questions">
                      {questions.map((item) => (
                        <li key={item.skill}>
                          {t(`orbi.question.${item.check ? "check" : "proven"}`, {
                            skill: item.skill,
                          })}
                        </li>
                      ))}
                    </ol>
                  </>
                ) : null}
              </>
            ) : (
              <p className="nb-meta">{t("orbi.none")}</p>
            )}
          </section>
        ) : null}

        {criteria.length > 0 ? (
          <section className="nb-rh-fr-s" aria-labelledby="rh-fr-crit">
            <h2 id="rh-fr-crit">{t("criteria.title")}</h2>
            <p className="nb-meta">{t("criteria.lead")}</p>
            <ul className="nb-rh-fr-crit">
              {criteria.map((label) => {
                const missed = row.missedCriteria.includes(label);
                return (
                  <li key={label} data-manque={missed ? "" : undefined}>
                    <span>{label}</span>
                    {live ? (
                      <form action={markCriterionAction}>
                        <input type="hidden" name="application" value={row.id} />
                        <input type="hidden" name="job" value={jobId} />
                        <input type="hidden" name="label" value={label} />
                        <input type="hidden" name="missing" value={missed ? "0" : "1"} />
                        <input type="hidden" name="back" value={self} />
                        <button type="submit" className="nb-rh-fr-crit-b">
                          {missed ? t("criteria.met") : t("criteria.unmet")}
                        </button>
                      </form>
                    ) : missed ? (
                      <b>{t("criteria.missing")}</b>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <section className="nb-rh-fr-s" aria-labelledby="rh-fr-comp">
          <h2 id="rh-fr-comp">{t("skills.title")}</h2>
          {skills.length === 0 ? (
            <p className="nb-meta">{t("skills.none")}</p>
          ) : (
            <ul className="nb-rh-fr-comp">
              {skills.map((item) => (
                <li key={item.name} data-offre={item.asked ? "" : undefined}>
                  {item.name}
                  {item.proven ? <span className="sr-only">{t("skills.proven")}</span> : null}
                  {item.proven ? <PhoneIcon name="coche" size={14} /> : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="nb-rh-fr-s" aria-labelledby="rh-fr-parc">
          <h2 id="rh-fr-parc">{t("timeline.title")}</h2>
          {timeline.length === 0 ? (
            <p className="nb-meta">{t("timeline.none")}</p>
          ) : (
            <ol className="nb-rh-fr-frise">
              {timeline.map((item) => (
                <li key={item.id} data-type={item.kind}>
                  <b>{item.title}</b>
                  <span className="nb-meta">
                    {[item.where, item.when].filter(Boolean).join(" · ")}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="nb-rh-fr-s" aria-labelledby="rh-fr-prat">
          <h2 id="rh-fr-prat">{t("practical.title")}</h2>
          <dl className="nb-rh-fr-prat">
            <div>
              <dt>{t("practical.languages")}</dt>
              <dd>
                {languages.length === 0
                  ? t("practical.unknown")
                  : languages
                      .map((item) => {
                        const name = languageName(item.code);
                        const known = LEVELS.find((value) => value === item.level);
                        const level = known ? tl(known) : "";
                        return [languageFlagOf(item.code), name, level ? `(${level})` : ""]
                          .filter(Boolean)
                          .join(" ");
                      })
                      .join(", ")}
              </dd>
            </div>
            <div>
              <dt>{t("practical.contract")}</dt>
              <dd>{contracts.length > 0 ? contracts.join(", ") : t("practical.unknown")}</dd>
            </div>
            <div>
              <dt>{t("practical.availability")}</dt>
              <dd>{availability}</dd>
            </div>
            <div>
              <dt>{t("practical.mobility")}</dt>
              <dd>{mobility.length > 0 ? mobility.join(", ") : t("practical.unknown")}</dd>
            </div>
          </dl>
        </section>

        <section className="nb-rh-fr-s" aria-labelledby="rh-fr-docs">
          <h2 id="rh-fr-docs">
            <MenuArt name="letter" size="xs" />
            {t("documents.title")}
          </h2>
          {documents.length === 0 ? (
            <p className="nb-meta">{t("documents.none")}</p>
          ) : (
            <ul className="nb-rh-fr-docs">
              {documents.map((item) => (
                <li key={item.key}>
                  <Link href={`/app/hire/candidats/${row.id}${item.href}`}>
                    <span>{item.title}</span>
                    <span className="nb-rh-fr-doc-etat" data-etat={item.state}>
                      {t(`documents.state.${item.state}`)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {missingAsked > 0 ? (
            <p className="nb-meta" data-ambre="">
              {t("documents.missing", { count: missingAsked })}
            </p>
          ) : null}
          <Link href={`/app/hire/candidats/${row.id}`} className="nb-rh-classes-tous">
            {t("file")}
          </Link>
        </section>
        <p className="nb-meta nb-rh-regle">
          {t("applied", { when: format.relativeTime(application.createdAt, now) })}
        </p>

        {live ? (
          <div className="nb-bas nb-rh-fr-bas">
            {gestureForm(
              `rh-fr-retenir-${row.id}`,
              shortlisted ? "annuler-retenir" : "retenir",
              shortlisted ? self : after,
            )}
            {gestureForm(
              `rh-fr-attente-${row.id}`,
              onHold ? "annuler-attente" : "attente",
              onHold ? self : after,
            )}
            <Link
              href={`/app/hire/candidats/${row.id}/decision?issue=rejected`}
              className="nb-rh-fr-act"
              data-act="non"
            >
              {t("actions.reject")}
            </Link>
            <button
              type="submit"
              form={`rh-fr-attente-${row.id}`}
              className="nb-rh-fr-act"
              data-act="attente"
            >
              {onHold ? t("actions.unhold") : t("actions.hold")}
            </button>
            <button
              type="submit"
              form={`rh-fr-retenir-${row.id}`}
              className="nb-rh-fr-act"
              data-act="oui"
            >
              {shortlisted ? t("actions.unretain") : t("actions.retain")}
            </button>
          </div>
        ) : null}
      </div>
    </SwipePager>
  );
}
