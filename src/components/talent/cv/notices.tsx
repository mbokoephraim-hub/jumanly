import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Notice } from "@/components/talent/notice";
import { MAX_PAGES } from "@/features/cv/style";
import { MAX_CVS } from "@/server/services/cv";
import { talentPlanFor, type PublicPlan } from "@/server/services/plans";

/** The query of the CV studio's address (`?ok=`, `?erreur=`, `?vue=`…). */
export type CvQuery = Record<string, string | string[] | undefined>;

/**
 * What an action of the CV studio answers (`?ok=`, `?erreur=`, `?orbi=`, `?adaptation=`,
 * `?export=`), as notices: the same on a phone and on a computer.
 */
export async function cvNotices({
  query,
  title,
  templateName,
  included,
  plans,
}: {
  query: CvQuery;
  title: string;
  templateName: string;
  included: boolean;
  plans: PublicPlan[];
}) {
  const t = await getTranslations();
  const notices: ReactNode[] = [];
  const ok = (key: string, text: string) =>
    notices.push(
      <Notice key={key} tone="ok">
        {text}
      </Notice>,
    );
  const err = (key: string, text: string) =>
    notices.push(
      <Notice key={key} tone="err">
        {text}
      </Notice>,
    );
  if (typeof query.adapte === "string")
    ok("adapte", t("docs.editor.adapted", { title, target: query.adapte }));
  if (query.ok === "profil") ok("profil", t("docs.editor.fromProfile"));
  else if (query.ok === "modele") ok("modele", t("docs.editor.templateApplied", { templateName }));
  else if (query.ok === "change") ok("change", t("docs.editor.changeApplied"));
  else if (query.ok === "refus") ok("refus", t("docs.editor.changeRefused"));
  else if (query.ok === "tout")
    ok("tout", t("docs.web.change.allApplied", { count: Number(query.nombre) || 0 }));
  else if (query.ok) ok("ok", t("docs.editor.saved"));
  if (query.orbi === "same") ok("same", t("docs.editor.orbiSame"));
  if (query.orbi === "empty") err("empty", t("docs.editor.orbiEmpty"));
  if (query.orbi === "obsolete") err("obsolete", t("docs.editor.obsolete"));
  if (query.adaptation === "notFound") err("notFound", t("docs.tailor.notFound"));
  if (query.adaptation === "limit") err("limit", t("docs.list.limit", { max: MAX_CVS }));
  if (query.adaptation === "empty" || query.adaptation === "input")
    err("vide", t("docs.tailor.tooShort"));
  if (query.erreur === "modele")
    err(
      "modele",
      t("docs.templates.locked", {
        plan: talentPlanFor(plans, "career.cv.templates.access", ["pro"]),
      }),
    );
  if (query.erreur === "couleur")
    err(
      "couleur",
      t("career.cv.style.color.tooLight", {
        suggestion: typeof query.proposee === "string" ? query.proposee : "",
      }),
    );
  if (query.erreur === "1") err("erreur", t("docs.editor.error"));
  if (query.erreur === "telephone") err("telephone", t("career.cv.info.phone.invalid"));
  if (query.erreur === "limite") err("limite", t("docs.list.limit", { max: MAX_CVS }));
  if (typeof query.export === "string")
    err(
      "export",
      query.export === "overMax"
        ? t("career.cv.pages.overMax", { max: MAX_PAGES })
        : query.export === "locked"
          ? t("career.cv.template.downgraded", { templateName })
          : t("docs.pdf.error"),
    );
  if (!included && query.export !== "locked")
    err("modeleRetire", t("career.cv.template.downgraded", { templateName }));
  return notices;
}
