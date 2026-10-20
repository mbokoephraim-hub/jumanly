import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";

/**
 * The job sheet read in Jumanly (planche r1plus `PDF_V`): the text of each page, read when the
 * file was checked, one page at a time; « Télécharger le PDF » for the exact layout. Talents see
 * « Postuler » next to it.
 */
export async function JobSheetReader({
  back,
  backLabel,
  org,
  title,
  pages,
  page,
  pageHref,
  downloadHref,
  apply,
}: {
  back: string;
  backLabel: string;
  org: string;
  title: string;
  pages: string[];
  page: number;
  pageHref: (page: number) => string;
  downloadHref: string;
  apply?: ReactNode;
}) {
  const t = await getTranslations("hireOffers.sheet");
  const total = Math.max(1, pages.length);
  const current = Math.min(Math.max(1, page), total);
  const text = pages[current - 1]?.trim();
  return (
    <div className="t-flux">
      <FlowHead
        back={back}
        backLabel={backLabel}
        title={t("title")}
        end={
          <a href={downloadHref} className="t-bi t-press" aria-label={t("download")} download>
            <TalentIcon name="telecharger" size="s" />
          </a>
        }
      />
      <div className="t-rx-lect">
        <article className="t-rx-pg" aria-label={t("page", { page: current, total })}>
          <div className="t-hd">
            <b>{org}</b>
            <span>{title}</span>
          </div>
          {text || <em>{t("noText")}</em>}
        </article>
        <nav className="t-rx-nav" aria-label={t("page", { page: current, total })}>
          {current > 1 ? (
            <Link href={pageHref(current - 1)} aria-label={t("prev")}>
              <TalentIcon name="retour" size="s" />
            </Link>
          ) : (
            <span aria-disabled>
              <TalentIcon name="retour" size="s" />
            </span>
          )}
          <span aria-current="page">{t("page", { page: current, total })}</span>
          {current < total ? (
            <Link href={pageHref(current + 1)} aria-label={t("next")}>
              <TalentIcon name="suivant" size="s" />
            </Link>
          ) : (
            <span aria-disabled>
              <TalentIcon name="suivant" size="s" />
            </span>
          )}
        </nav>
      </div>
      <p className="t-rx-note">{t("note")}</p>
      <div className="t-verre t-fort t-bas-f">
        <a href={downloadHref} className="t-bt t-sec t-m t-press" download>
          <TalentIcon name="telecharger" size="s" />
          {t("pdf")}
        </a>
        {apply}
      </div>
    </div>
  );
}
