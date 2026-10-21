import type { StageKind } from "@/generated/prisma/client";
import { getTranslations } from "next-intl/server";
import { TalentIcon } from "@/components/talent/icon";
import { WhyCriteria } from "@/components/talent/offer-why";
import { Sheet } from "@/components/talent/sheet";
import { moveCandidateAction } from "@/server/actions/hire-candidates";
import type { MatchExplanation } from "@/server/matching/types";
import { decisionStageOf } from "@/server/services/hire-candidates";

/**
 * The parts of a candidate's file that the full file and the file opened beside the list (web
 * recruteur lot 2, planche `.ats`) share: the track of the stages, « Pourquoi ? », « Changer
 * d'étape » and the letter. One source, so the two places never say different things.
 */

type Stage = { id: string; name: string; kind: StageKind; order: number };
type Track = { key: string; name: string; state: "done" | "now" | "next"; hint: string };

/** The stages passed, the current one, those to come, then « Décision ». */
export async function fileTrack(application: {
  stageId: string;
  stage: Stage;
  job: { stages: Stage[] };
}): Promise<Track[]> {
  const t = await getTranslations("hireCandidates");
  const { job } = application;
  const decided = application.stage.kind === "hired" || application.stage.kind === "rejected";
  const ordered = job.stages.filter((stage) => stage.kind !== "hired" && stage.kind !== "rejected");
  const finalStage = decisionStageOf(job.stages);
  const steps = [
    ...ordered
      .filter((stage) => stage.id !== finalStage?.id)
      .map((stage) => ({
        key: stage.id,
        name: stage.name,
        state: (decided || stage.order < application.stage.order
          ? "done"
          : stage.id === application.stageId
            ? "now"
            : "next") as Track["state"],
      })),
    {
      key: "decision",
      name: decided ? application.stage.name : t("file.trackDecision"),
      state: (decided || application.stageId === finalStage?.id ? "now" : "next") as Track["state"],
    },
  ];
  return steps.map((step) => ({
    ...step,
    hint: t(
      step.state === "now"
        ? "file.trackNow"
        : step.state === "done"
          ? "file.trackDone"
          : "file.track",
    ),
  }));
}

/** « Pourquoi 88 % ? »: the fixed calculation, criterion by criterion. */
export async function WhySheet({
  id,
  explanation,
  matchingLevel,
  morePlan,
}: {
  id: string;
  explanation: MatchExplanation;
  matchingLevel: string;
  /** The cheapest plan that shows every criterion, when this one shows only three. */
  morePlan: string | null;
}) {
  const t = await getTranslations("hireCandidates");
  const th = await getTranslations("hire");
  return (
    <Sheet id={id} title={t("why.title", { score: explanation.score })} closeLabel={t("why.close")}>
      <p className="t-ss">{t("why.sub")}</p>
      <WhyCriteria
        recruiter
        explanation={
          matchingLevel === "explainable"
            ? explanation
            : {
                ...explanation,
                criteria: explanation.criteria
                  .filter((item) => item.status === "met" || item.status === "partial")
                  .sort((a, b) => b.weight * b.value - a.weight * a.value)
                  .slice(0, 3),
              }
        }
      />
      {matchingLevel !== "explainable" && morePlan && (
        <p className="t-rc-note">{t("why.more", { plan: morePlan })}</p>
      )}
      <p className="t-gar">
        <TalentIcon name="confidentialite" size="s" />
        <span>{t("why.excluded")}</span>
      </p>
      <p className="t-gar">
        <TalentIcon name="pourquoi" size="s" />
        <span>{th("reject.aiRule")}</span>
      </p>
    </Sheet>
  );
}

/** « Changer d'étape »: a human move, the talent sees the new stage, no message leaves. */
export async function MoveSheet({
  id,
  application,
  name,
  firstName,
  appointments,
  back,
  openParam,
  defaultOpen,
}: {
  id: string;
  application: { id: string; stageId: string; job: { stages: Stage[] } };
  name: string;
  firstName: string;
  appointments: boolean;
  /** « liste »: back to the list with this file open beside it (web, planche `.ats`). */
  back?: "liste";
  openParam?: string;
  defaultOpen?: boolean;
}) {
  const t = await getTranslations("hireCandidates");
  const finalStage = decisionStageOf(application.job.stages);
  const movable = application.job.stages.filter(
    (stage) => stage.kind !== "hired" && stage.kind !== "rejected" && stage.id !== finalStage?.id,
  );
  return (
    <Sheet
      id={id}
      title={t("move.title", { name })}
      closeLabel={t("move.cancel")}
      openParam={openParam}
      defaultOpen={defaultOpen}
    >
      <form action={moveCandidateAction} className="t-rc-move">
        <input type="hidden" name="application" value={application.id} />
        {back && <input type="hidden" name="retour" value={back} />}
        <fieldset>
          <legend className="sr-only">{t("move.legend")}</legend>
          <div className="t-verre t-rc-etp">
            {movable.map((stage) =>
              stage.id === application.stageId ? (
                <div key={stage.id} className="t-li t-act">
                  <span className="t-t">
                    <b>{stage.name}</b>
                  </span>
                  <span className="t-v">{t("move.current")}</span>
                </div>
              ) : (
                <label key={stage.id} className="t-li">
                  <input type="radio" name="stage" value={stage.id} required />
                  <span className="t-t">
                    <b>{stage.name}</b>
                    {stage.kind === "interview" && appointments && (
                      <span>{t("move.interview")}</span>
                    )}
                  </span>
                  <span className="t-radio" aria-hidden />
                </label>
              ),
            )}
            <label className="t-li">
              <input type="radio" name="stage" value="decision" required />
              <span className="t-t">
                <b>{t("move.decision")}</b>
                <span>{t("move.decisionText")}</span>
              </span>
              <span className="t-radio" aria-hidden />
            </label>
          </div>
        </fieldset>
        <p className="t-gar">
          <TalentIcon name="notification" size="s" />
          <span>{t("move.note", { firstName })}</span>
        </p>
        <div className="t-rx-feuille-bts">
          <button type="submit" className="t-bt t-p t-m t-press">
            {t("move.submit")}
          </button>
        </div>
      </form>
    </Sheet>
  );
}

/** The cover letter, in paragraphs. */
export async function LetterSheet({
  id,
  name,
  letter,
}: {
  id: string;
  name: string;
  letter: string;
}) {
  const t = await getTranslations("hireCandidates");
  return (
    <Sheet id={id} title={t("docs.letterTitle", { name })} closeLabel={t("docs.close")}>
      <div className="t-rc-lettre">
        {letter
          .split(/\n\s*\n/)
          .filter((part) => part.trim())
          .map((part, index) => (
            <p key={index} className="whitespace-pre-line">
              {part.trim()}
            </p>
          ))}
      </div>
    </Sheet>
  );
}
