import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { cx } from "@/lib/cx";
import { improveSummaryAction } from "@/server/actions/cv";
import { TalentIcon } from "../../icon";
import { OrbiMark } from "../../orbi-mark";

/**
 * « Orbi pour vos CV » (planche studio-cv § 1 `.oa`): Orbi's credits, then its three actions on a
 * CV, each one a proposal the talent reviews (rien n'est modifié sans votre accord). On « Mes CV »
 * they work on the CV principal; in the studio, on the CV open.
 */
export async function OrbiCvCard({
  cvId,
  credits,
  pending = 0,
  className,
}: {
  /** The CV Orbi works on; none yet: the actions wait for a first CV. */
  cvId: string | null;
  /** Credits left this month, or null when unlimited. */
  credits: number | null;
  /** Changes Orbi proposed and the talent has not decided yet. */
  pending?: number;
  className?: string;
}) {
  const t = await getTranslations("docs.web.orbi");
  const studio = cvId ? `/app/career/cv/${cvId}` : null;
  const row = (
    icon: "modifier" | "opportunites" | "document",
    tone: string,
    title: string,
    hint: string,
  ) => (
    <>
      <span className={cx("t-cases", tone)} aria-hidden>
        <TalentIcon name={icon} size="s" />
      </span>
      <span className="t-t">
        {title}
        <small>{hint}</small>
      </span>
      <TalentIcon name="suivant" size="xs" />
    </>
  );
  return (
    <section aria-labelledby="sc-oa-t" className={cx("t-verre t-sc-oa", className)}>
      <div className="t-sc-oa-h">
        <OrbiMark size={40} />
        <div>
          <h2 id="sc-oa-t">{t("title")}</h2>
          <p>{credits === null ? t("creditsUnlimited") : t("credits", { count: credits })}</p>
        </div>
      </div>
      {!studio ? (
        <p className="t-sc-sub">{t("needCv")}</p>
      ) : (
        <>
          {pending > 0 && (
            <Link href={`${studio}?vue=ameliorer`} className="t-sc-o t-press t-sc-o-p">
              <span className="t-cases" aria-hidden>
                <OrbiMark size={24} />
              </span>
              <span className="t-t">{t("pending", { count: pending })}</span>
              <TalentIcon name="suivant" size="xs" />
            </Link>
          )}
          <form action={improveSummaryAction}>
            <input type="hidden" name="id" value={cvId!} />
            <button type="submit" className="t-sc-o t-press">
              {row("modifier", "t-sc-former", t("improve"), t("improveHint"))}
            </button>
          </form>
          <Link href={`${studio}?adapter=offre`} className="t-sc-o t-press">
            {row("opportunites", "t-sc-oppo", t("offer"), t("offerHint"))}
          </Link>
          <Link href={`${studio}?adapter=texte`} className="t-sc-o t-press">
            {row("document", "t-sc-accomp", t("text"), t("textHint"))}
          </Link>
        </>
      )}
    </section>
  );
}
