import { getTranslations } from "next-intl/server";
import { reportAction } from "@/server/actions/connect";
import { reportReasons, type reportTargets } from "@/server/services/moderation";

/** « Signaler » in the talent space (partie 10 § 10.7), inside a sheet: reviewed by the Jumanly team. */
export async function TalentReportForm({
  targetType,
  targetId,
  back,
}: {
  targetType: (typeof reportTargets)[number];
  targetId: string;
  back: string;
}) {
  const t = await getTranslations("report");
  const fieldId = `${targetType}-${targetId}`;
  return (
    <form action={reportAction} className="t-flux">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="back" value={back} />
      <p className="t-vide-t">{t("intro")}</p>
      <fieldset className="t-fs">
        <legend className="t-lab-c">{t("reason.text")}</legend>
        <div className="t-choix">
          {reportReasons.map((reason, index) => (
            <label key={reason} className="t-verre t-ch">
              <input
                type="radio"
                name="reason"
                value={reason}
                required
                defaultChecked={index === 0}
              />
              <span className="t-t">
                <b>{t(`reason.${reason}`)}</b>
              </span>
              <span className="t-radio" aria-hidden />
            </label>
          ))}
        </div>
      </fieldset>
      <div className="t-champ">
        <label htmlFor={`details-${fieldId}`}>{t("details.text")}</label>
        <textarea
          id={`details-${fieldId}`}
          name="details"
          rows={3}
          maxLength={1000}
          placeholder={t("details.placeholder")}
        />
      </div>
      <p className="t-vide-t">{t("urgent")}</p>
      <button type="submit" className="t-bt t-p t-pl t-press">
        {t("submit")}
      </button>
    </form>
  );
}
