import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { templateKey } from "@/features/cv/examples";
import {
  cvTemplateRegistry,
  findTemplate,
  includesAccess,
  templateOf,
  type CvTemplate,
} from "@/features/cv/templates/registry";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { setCvTemplate } from "@/server/actions/cv";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { templatesAccess, TEMPLATES_ACCESS_KEY } from "@/server/services/cv";
import { listPublicPlans, talentPlanFor } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("docs.templates");
  return { title: t("seo"), robots: { index: false } };
}

/** The chips of the planche: every template, the sober ones, those with a column, the creative ones. */
const filters = ["tous", "sobres", "colonne", "creatifs"] as const;
type Filter = (typeof filters)[number];
const creative = new Set(["creatif", "visuel", "contraste", "bandeau"]);
const matches: Record<Filter, (template: CvTemplate) => boolean> = {
  tous: () => true,
  sobres: (template) => template.layout === "one" && !creative.has(template.id),
  colonne: (template) => template.layout !== "one",
  creatifs: (template) => creative.has(template.id),
};

/**
 * Choisir un modèle (planche talent-4 § 6): the templates of docs/modeles-cv, those of the plan
 * marked « Inclus » (`career.cv.templates.access`, never a plan name in the code), the others with
 * a lock and the plan that includes them. « Utiliser » changes the layout, never the content.
 */
export default async function CvTemplatesPage({
  searchParams,
}: PageProps<"/app/career/cv/modeles">) {
  const query = await searchParams;
  const user = await requireUser("/app/career/cv/modeles");
  const cvId = typeof query.cv === "string" ? query.cv : "";
  const cv = await db.document.findFirst({
    where: { kind: "cv", profile: { userId: user.id }, ...(cvId ? { id: cvId } : {}) },
    orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
    select: { id: true, templateId: true },
  });
  if (!cv) return cvId ? notFound() : redirect("/app/career/cv");
  const t = await getTranslations();
  const d = dynamic(t);
  const [granted, plans] = await Promise.all([
    templatesAccess(db, { type: "user", id: user.id }),
    listPublicPlans(db),
  ]);
  const current = templateOf(cv.templateId);
  const filter: Filter = filters.includes(query.filtre as Filter)
    ? (query.filtre as Filter)
    : "tous";
  const selected = findTemplate(typeof query.modele === "string" ? query.modele : "") ?? current;
  const included = (template: CvTemplate) => includesAccess(granted, template.access);
  const name = (template: CvTemplate) => d(`career.cv.template.name.${templateKey(template.id)}`);
  const lockPlan = (template: CvTemplate) =>
    talentPlanFor(
      plans,
      TEMPLATES_ACCESS_KEY,
      template.access === "pro" ? ["pro"] : ["starter", "pro"],
    );
  const shown = cvTemplateRegistry.filter(matches[filter]);
  const href = (params: { filtre?: Filter; modele?: string }) => {
    const search = new URLSearchParams({ cv: cv.id });
    const nextFilter = params.filtre ?? filter;
    if (nextFilter !== "tous") search.set("filtre", nextFilter);
    search.set("modele", params.modele ?? selected.id);
    return `/app/career/cv/modeles?${search.toString()}`;
  };
  const editor = `/app/career/cv/${cv.id}`;

  return (
    <div className="t-flux t-od-bas">
      <FlowHead
        back={editor}
        backLabel={t("docs.back")}
        title={t("docs.templates.title")}
        end={
          <Link href={editor} className="t-bi t-press" aria-label={t("offer.close")}>
            <TalentIcon name="fermer" size="s" />
          </Link>
        }
      />
      {query.erreur === "modele" && (
        <Notice tone="err">{t("docs.templates.locked", { plan: lockPlan(selected) })}</Notice>
      )}
      <nav aria-label={t("docs.templates.filters")} className="t-puces">
        {filters.map((item) => (
          <Link
            key={item}
            href={href({ filtre: item })}
            aria-current={item === filter ? "true" : undefined}
            className={cx("t-puce t-press", item === filter && "t-on")}
          >
            {t(`docs.templates.filter.${item}`)}
          </Link>
        ))}
      </nav>

      <ul className="t-tpls">
        {shown.map((template) => {
          const open = included(template);
          const number =
            cvTemplateRegistry.indexOf(template as (typeof cvTemplateRegistry)[number]) + 1;
          return (
            <li key={template.id}>
              <Link
                href={href({ modele: template.id })}
                aria-current={template.id === selected.id ? "true" : undefined}
                className={cx("t-tpl t-press", template.id === selected.id && "t-on")}
                scroll={false}
              >
                <span className="t-pg">
                  <Image
                    src={`/cv-templates/${String(number).padStart(2, "0")}-${template.id}.png`}
                    alt=""
                    width={600}
                    height={849}
                    sizes="(min-width: 560px) 250px, 45vw"
                  />
                  {open ? (
                    <span className="t-bdg">
                      <TalentIcon name="valider" size="xs" />
                      {t("docs.templates.included")}
                    </span>
                  ) : (
                    <span className="t-bdg t-n">
                      <TalentIcon name="cadenas" size="xs" />
                      {lockPlan(template)}
                    </span>
                  )}
                </span>
                <span>
                  {name(template)}
                  {template.id === current.id && (
                    <span className="sr-only">{t("docs.templates.currentShort")}</span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="t-verre t-fort t-bas-f">
        {!included(selected) ? (
          <Link
            href={`/app/abonnement?suite=${encodeURIComponent(href({ modele: selected.id }))}`}
            className="t-bt t-p t-pl t-press"
          >
            <TalentIcon name="cadenas" size="s" />
            {t("docs.templates.unlock", { plan: lockPlan(selected) })}
          </Link>
        ) : selected.id === current.id ? (
          <Link href={editor} className="t-bt t-sec t-pl t-press">
            {t("docs.templates.current", { name: name(selected) })}
          </Link>
        ) : (
          <form action={setCvTemplate} className="contents">
            <input type="hidden" name="id" value={cv.id} />
            <input type="hidden" name="template" value={selected.id} />
            <button type="submit" className="t-bt t-p t-pl t-press">
              {t("docs.templates.use", { name: name(selected) })}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
