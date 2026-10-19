import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { startInterviewAction } from "@/server/actions/career-interviews";
import { db } from "@/server/db";
import {
  interviewDurations,
  interviewJobs,
  interviewLevels,
  interviewModes,
  interviewQuota,
  interviewTypes,
  quotaKey,
} from "@/server/services/interview-sim";
import { listPublicPlans, talentPlanFor } from "@/server/services/plans";

const durationText = { 10: "quick", 20: "standard", 30: "full" } as const;
/** The types ticked by default (planche: motivation, techniques, mises en situation). */
const defaultTypes = ["motivation", "technical", "behavioral"];

/**
 * « Nouvel entraînement » (planche talent-4 § 5 bis): the job, the level, the types of
 * questions, written or spoken (with what is left of each monthly quota) and the length. A
 * format the plan does not include stays visible, locked, with the plan that opens it.
 */
export async function NewPractice({
  userId,
  jobTitle,
  mode,
  type,
  fromOffer,
  error,
}: {
  userId: string;
  jobTitle: string;
  mode: "text" | "voice";
  /** A single type chosen on the previous screen (« Questions classiques »). */
  type: string | null;
  /** « Sur une offre »: the saved offers and applications to choose from. */
  fromOffer: boolean;
  error: "consent" | "entitlement" | "quota" | "invalid" | null;
}) {
  const t = await getTranslations();
  const [text, voice, plans, jobs] = await Promise.all([
    interviewQuota(db, userId, "text"),
    interviewQuota(db, userId, "voice"),
    listPublicPlans(db),
    fromOffer ? interviewJobs(db, userId) : Promise.resolve([]),
  ]);
  const quotas = { text, voice };
  const open = interviewModes.filter((item) => quotas[item].limit !== 0);
  if (open.length === 0) redirect("/app/career/entretiens");
  const chosenMode = open.includes(mode) ? mode : open[0];
  const ticked = interviewTypes.some((item) => item === type) ? [type] : defaultTypes;

  return (
    <form action={startInterviewAction} className="t-flux">
      <FlowHead
        back="/app/career/entretiens"
        backLabel={t("entrain.back")}
        title={t("entrain.new.title")}
        end={
          <Link
            href="/app/career/entretiens"
            className="t-bi t-press"
            aria-label={t("entrain.new.close")}
          >
            <TalentIcon name="fermer" size="s" />
          </Link>
        }
      />
      <input type="hidden" name="from" value="/app/career/entretiens/nouveau" />
      {error && <Notice tone="err">{t(`entrain.error.${error}`)}</Notice>}

      <div className="t-champ">
        <label htmlFor="ne-metier">{t("entrain.new.job")}</label>
        <span className="t-verre t-saisie">
          <TalentIcon name="cap" size="s" />
          <input
            id="ne-metier"
            name="jobTitle"
            type="text"
            required
            minLength={2}
            maxLength={120}
            defaultValue={jobTitle}
          />
        </span>
      </div>
      {fromOffer && (
        <div className="t-champ">
          <label htmlFor="ne-offre">{t("entrain.new.offer")}</label>
          <span className="t-verre t-saisie">
            <TalentIcon name="offre" size="s" />
            <select id="ne-offre" name="jobId" defaultValue={jobs[0]?.id ?? ""}>
              <option value="">{t("entrain.new.noOffer")}</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </span>
        </div>
      )}

      <fieldset className="t-fs">
        <legend className="t-ck-t">{t("entrain.new.level")}</legend>
        <div className="t-seg">
          {interviewLevels.map((level, index) => (
            <label key={level}>
              <input type="radio" name="level" value={level} defaultChecked={index === 0} />
              {t(`entrain.new.levels.${level}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="t-fs">
        <legend className="t-ck-t">{t("entrain.new.types")}</legend>
        <div className="t-puces">
          {(["motivation", "technical", "behavioral", "hr"] as const).map((item) => (
            <label key={item} className="t-puce t-press">
              <input
                type="checkbox"
                name="type"
                value={item}
                defaultChecked={ticked.includes(item)}
              />
              <TalentIcon name="valider" size="xs" />
              {t(`entrain.new.type.${item}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="t-fs">
        <legend className="t-ck-t">{t("entrain.new.format")}</legend>
        <div className="t-opts t-deux">
          {interviewModes.map((item) => {
            const quota = quotas[item];
            return (
              <label key={item} className="t-press">
                <input
                  type="radio"
                  name="mode"
                  value={item}
                  disabled={quota.limit === 0}
                  defaultChecked={item === chosenMode}
                />
                <b>{t(`practice.kind.${item}`)}</b>
                {quota.limit === 0
                  ? t("entrain.new.formatLocked", { plan: talentPlanFor(plans, quotaKey(item)) })
                  : quota.limit < 0
                    ? t("entrain.quota.unlimited")
                    : t("entrain.quota.short", { used: quota.used, limit: quota.limit })}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="t-fs">
        <legend className="t-ck-t">{t("entrain.new.length")}</legend>
        <div className="t-opts">
          {interviewDurations.map((minutes) => (
            <label key={minutes} className="t-press">
              <input
                type="radio"
                name="durationMinutes"
                value={minutes}
                defaultChecked={minutes === 20}
              />
              <b>{t(`practice.kind.${durationText[minutes]}`)}</b>
              {t("practice.kind.minutes", { count: minutes })}
            </label>
          ))}
        </div>
      </fieldset>

      <p className="t-gar">
        <TalentIcon name="cadenas" size="s" />
        <span>{t("entrain.private")}</span>
      </p>
      <div className="t-verre t-fort t-bas-f">
        <button type="submit" className="t-bt t-a t-pl t-press">
          <TalentIcon name="entretien" size="s" />
          {t("practice.start")}
        </button>
      </div>
    </form>
  );
}
