import { getTranslations } from "next-intl/server";
import { TalentIcon } from "@/components/talent/icon";
import { Sheet, SheetButton } from "@/components/talent/sheet";

export const REPORT_EXPORT_SHEET = "rw4-export";

/** The head's button of the reports page on a computer: it opens the export window. */
export async function ReportExportButton() {
  const tw = await getTranslations("hireWeb3.reports");
  return (
    <SheetButton target={REPORT_EXPORT_SHEET} className="t-bt t-sec t-m t-press t-w4-web">
      <TalentIcon name="telecharger" size="s" />
      {tw("export")}
    </SheetButton>
  );
}

/** « Exporter » of the PDF card at the end of the reports page, on a computer. */
export async function ReportExportCardButton() {
  const t = await getTranslations("hireWeb.export");
  return (
    <SheetButton target={REPORT_EXPORT_SHEET} className="t-bt t-sec t-m t-press t-w4-web t-rw-expo">
      {t("open")}
    </SheetButton>
  );
}

/**
 * « Exporter le rapport en PDF » (web recruiter lot 4, planche `exp`): the period, the offers and
 * the parts of the report, then the PDF. A plain GET form to the export route, which checks the
 * right `reports.export` again. Each unticked part sends `0` (the hidden field before the box).
 * Only on a computer or a tablet; the phone keeps its direct link at the end of the page.
 */
export async function ReportExportDialog({
  periode,
  activeJobs,
}: {
  periode: "30d" | "90d";
  activeJobs: number;
}) {
  const t = await getTranslations("hireWeb.export");
  const periods = [
    { value: "30d", label: t("p30") },
    { value: "90d", label: t("p90") },
    { value: "12m", label: t("p12") },
    { value: "custom", label: t("custom") },
  ];
  return (
    <div className="t-rw-web">
      <Sheet
        id={REPORT_EXPORT_SHEET}
        title={t("title")}
        closeLabel={t("close")}
        className="t-rw-exp"
      >
        <form method="get" action="/app/hire/rapports/export" className="t-rw-expf">
          <fieldset>
            <legend>{t("period")}</legend>
            <div className="t-rw-expp">
              {periods.map((item) => (
                <label key={item.value} className="t-press">
                  <input
                    type="radio"
                    name="periode"
                    value={item.value}
                    defaultChecked={item.value === periode}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
            <div className="t-rw-expd">
              <label>
                <span>{t("from")}</span>
                <input type="date" name="du" />
              </label>
              <label>
                <span>{t("to")}</span>
                <input type="date" name="au" />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>{t("jobs")}</legend>
            <p className="t-rw-expj">
              <span className="t-cases t-c2" aria-hidden>
                <TalentIcon name="offre" size="s" />
              </span>
              <b>{t("jobsAll", { count: activeJobs })}</b>
            </p>
          </fieldset>

          <fieldset>
            <legend>{t("content")}</legend>
            <ul className="t-rw-expc">
              <li>
                <label className="t-li t-press">
                  <span className="t-t">
                    <b>{t("key")}</b>
                    <span>{t("keyText")}</span>
                  </span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked
                    disabled
                    readOnly
                    className="sr-only"
                  />
                  <span aria-hidden className="t-sw" />
                </label>
              </li>
              <li>
                <label className="t-li t-press">
                  <span className="t-t">
                    <b>{t("byJob")}</b>
                    <span>{t("byJobText")}</span>
                  </span>
                  <input type="hidden" name="offres" value="0" />
                  <input
                    type="checkbox"
                    role="switch"
                    name="offres"
                    value="1"
                    defaultChecked
                    className="sr-only"
                  />
                  <span aria-hidden className="t-sw" />
                </label>
              </li>
              <li>
                <label className="t-li t-press">
                  <span className="t-t">
                    <b>{t("reading")}</b>
                    <span>{t("readingText")}</span>
                  </span>
                  <input type="hidden" name="lecture" value="0" />
                  <input
                    type="checkbox"
                    role="switch"
                    name="lecture"
                    value="1"
                    defaultChecked
                    className="sr-only"
                  />
                  <span aria-hidden className="t-sw" />
                </label>
              </li>
            </ul>
          </fieldset>

          <p className="t-gar">
            <TalentIcon name="pourquoi" size="s" />
            <span>{t("note")}</span>
          </p>

          <div className="t-rw-expb">
            <button
              type="submit"
              name="apercu"
              value="1"
              formTarget="_blank"
              className="t-bt t-sec t-m t-press"
            >
              {t("preview")}
            </button>
            <button type="submit" className="t-bt t-m t-rw-dk t-press">
              <TalentIcon name="telecharger" size="s" />
              {t("download")}
            </button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}
