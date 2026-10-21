import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { CandidateAvatar, ScoreRing, StageTrack } from "@/components/recruiter/candidates";
import { fileTrack, LetterSheet, MoveSheet, WhySheet } from "@/components/recruiter/file-parts";
import { TalentIcon } from "@/components/talent/icon";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { SheetButton } from "@/components/talent/sheet";
import { formatDayMonth } from "@/lib/dates";
import { db } from "@/server/db";
import { can, level } from "@/server/entitlements";
import { applicationMatches } from "@/server/matching/service";
import { ensureApplicationConversation } from "@/server/services/connect";
import { parseAnalysis, ANALYSIS_EVENT, type AnalysisPoint } from "@/server/services/cv-analysis";
import { hirePermissions, recordView, type HireContext } from "@/server/services/hire";
import { cheapestPlanWhere, levelOf, listPublicPlans } from "@/server/services/plans";

const MONTH = 30.44 * 86_400_000;
const DAY = 86_400_000;

/**
 * The file opened beside the list on a computer (web recruteur lot 2, planche `.ats`): who, the
 * score and its « Pourquoi ? », the track, Orbi's summary, the documents and the actions. Opening it
 * is a consultation like any other: logged (golden rule n° 5), filtered by organization
 * (`recordView` → `getOrgApplication`). The complete file stays one click away.
 */
export async function CandidatePane({
  ctx,
  applicationId,
}: {
  ctx: HireContext;
  applicationId: string;
}) {
  const t = await getTranslations("hireCandidates");
  const tw = await getTranslations("hireWeb.pane");
  const ui = await getTranslations("ui");
  const format = await getFormatter();
  const now = new Date();
  const application = await recordView(db, ctx, applicationId, now);
  const permissions = hirePermissions(ctx.role);
  const { profile } = application;
  const person = profile.user;
  const firstName = person.firstName || person.name.split(/\s+/)[0]!;
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [conversation, matchingLevel, appointments, plans, steps] = await Promise.all([
    application.conversation ?? ensureApplicationConversation(db, application.id),
    level(db, subject, "hire.matching.level"),
    can(db, subject, "connect.appointments"),
    listPublicPlans(db),
    fileTrack(application),
  ]);
  const match =
    matchingLevel === "none"
      ? null
      : await applicationMatches(db, [application], now).then(
          (map) => map.get(application.id) ?? null,
        );
  const explanation = match && match !== "disabled" ? match : null;
  const score = explanation?.score ?? null;
  const base = `/app/hire/candidats/${application.id}`;
  const decided = application.stage.kind === "hired" || application.stage.kind === "rejected";
  const live = permissions.manage && application.status !== "withdrawn" && !decided;

  const months = profile.experiences.reduce(
    (sum, item) =>
      sum + Math.max(0, ((item.endDate ?? now).getTime() - item.startDate.getTime()) / MONTH),
    0,
  );
  const line = [
    profile.headline,
    profile.experiences.length ? t("file.years", { count: Math.floor((months + 0.5) / 12) }) : null,
    person.city,
  ]
    .filter(Boolean)
    .join(" · ");
  const when = (date: Date) =>
    now.getTime() - date.getTime() < 2 * DAY
      ? format.relativeTime(date, now)
      : formatDayMonth(date);

  const analysisEvent = [...application.events]
    .reverse()
    .find((event) => event.type === ANALYSIS_EVENT);
  const analysis = parseAnalysis(analysisEvent?.payload);
  const analysisLine = (item: AnalysisPoint) =>
    "text" in item ? item.text : t(`analysis.point.${item.key}`, item.values as never);
  const letter = application.coverLetter?.trim() ?? "";
  const words = letter ? letter.split(/\s+/).length : 0;
  const morePlan =
    cheapestPlanWhere(
      plans,
      ["rh", "company"],
      (plan) => levelOf(plan, "hire.matching.level") === "explainable",
    )?.name ?? null;

  return (
    <section aria-label={tw("aria", { name: person.name })} className="t-verre t-rw-pane">
      <div className="t-rc-id">
        <CandidateAvatar id={application.id} name={person.name} className="t-l" />
        <div className="t-t">
          <h2>{person.name}</h2>
          {line && <p>{line}</p>}
          <div className="t-k">
            {!application.viewedAt && <span className="t-rx-nv">{t("file.new")}</span>}
            {application.status === "withdrawn" && (
              <span className="t-rc-etq t-ret">{t("file.withdrawn")}</span>
            )}
            <span className="t-rc-etq">
              {t("file.applied", { when: when(application.createdAt) })}
            </span>
          </div>
        </div>
        {score !== null && (
          <ScoreRing
            score={score}
            text={ui("percent", { value: score })}
            label={t("file.scoreAria", { score })}
          />
        )}
      </div>
      <StageTrack steps={steps} label={t("file.track")} />

      <div className="t-rc-orbi">
        <div className="t-h">
          <OrbiMark size={30} />
          <div className="t-t">
            <b>{t("orbiCard.title")}</b>
            <span>{t("orbiCard.sub")}</span>
          </div>
        </div>
        {analysis ? (
          <ul className="t-rc-pts">
            {[
              ...analysis.strengths.slice(0, 2).map((item) => ({ item, tone: "t-v" as const })),
              ...analysis.toVerify.slice(0, 1).map((item) => ({ item, tone: "t-a" as const })),
            ].map(({ item, tone }, index) => (
              <li key={index}>
                <i aria-hidden className={tone}>
                  {tone === "t-v" ? "✓" : "!"}
                </i>
                <span>{analysisLine(item)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>{tw("noAnalysis")}</p>
        )}
        {explanation && (
          <div className="t-rc-liens">
            <SheetButton target="rw-pourquoi" className="t-pq t-press">
              <TalentIcon name="pourquoi" size="xs" />
              {t("why.link", { score: explanation.score })}
            </SheetButton>
          </div>
        )}
      </div>

      <div className="t-rc-docs" role="group" aria-label={t("docs.aria")}>
        {application.cvSnapshot !== null ? (
          <a
            href={`${base}/cv`}
            aria-label={t("docs.cvAria", { name: person.name })}
            className="t-rc-doc t-press"
          >
            <span className="t-pg" aria-hidden>
              <i className="t-hd" />
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="t-t">
              <TalentIcon name="cv" size="xs" />
              <span>
                <b>{t("docs.cv")}</b>
                {t("docs.cvLine", { date: formatDayMonth(application.createdAt) })}
              </span>
            </span>
          </a>
        ) : (
          <span className="t-rc-doc t-vide">
            <b>{t("docs.noCv")}</b>
            {t("docs.noCvText")}
          </span>
        )}
        {letter ? (
          <SheetButton
            target="rw-lettre"
            label={t("docs.letterAria", { name: person.name })}
            className="t-rc-doc t-press"
          >
            <span className="t-pg" aria-hidden>
              <i className="t-hd" />
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="t-t">
              <TalentIcon name="document" size="xs" />
              <span>
                <b>{t("docs.letter")}</b>
                {t("docs.letterLine", { count: words })}
              </span>
            </span>
          </SheetButton>
        ) : (
          <span className="t-rc-doc t-vide">
            <b>{t("docs.noLetter")}</b>
            {t("docs.optional")}
          </span>
        )}
      </div>

      <nav aria-label={t("bar.aria")} className="t-rw-pbar">
        {live ? (
          <SheetButton target="rw-etape" className="t-bt t-p t-s t-press">
            <TalentIcon name="progression" size="xs" />
            {t("bar.move")}
          </SheetButton>
        ) : (
          <span className="t-rc-bar-etat">
            {application.status === "withdrawn"
              ? t("file.withdrawn")
              : t("bar.decided", { stage: application.stage.name })}
          </span>
        )}
        {live && application.status === "active" && appointments && (
          <Link
            href={`${base}/entretien`}
            aria-label={t("bar.interview")}
            className="t-bt t-sec t-s t-press"
          >
            <TalentIcon name="entretien" size="xs" />
            <span aria-hidden>{tw("interview")}</span>
          </Link>
        )}
        <Link
          href={`/app/messages/${conversation.id}`}
          aria-label={t("bar.message")}
          className="t-bt t-sec t-s t-press"
        >
          <TalentIcon name="message" size="xs" />
          <span aria-hidden>{tw("write")}</span>
        </Link>
        <Link
          href={base}
          aria-label={tw("open", { name: person.name })}
          className="t-bi t-press t-rw-ouvrir"
        >
          <TalentIcon name="suivant" size="s" />
        </Link>
      </nav>

      {explanation && (
        <WhySheet
          id="rw-pourquoi"
          explanation={explanation}
          matchingLevel={matchingLevel}
          morePlan={morePlan}
        />
      )}
      {letter && <LetterSheet id="rw-lettre" name={person.name} letter={letter} />}
      {live && (
        <MoveSheet
          id="rw-etape"
          application={application}
          name={person.name}
          firstName={firstName}
          appointments={appointments}
          back="liste"
        />
      )}
    </section>
  );
}
