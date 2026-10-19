import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { StudioFrame } from "@/components/talent/cv/studio/studio-frame";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { CvPage } from "@/components/talent/cv/studio/preview";
import { previewData } from "@/features/cv/document";
import { cvSourceOf } from "@/features/cv/source";
import { resolveStyle, styleForTemplate } from "@/features/cv/style";
import { templateImage } from "@/features/cv/templates/images";
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
/** The chips of the web planche (studio-cv § 2). */
const webFilters = ["tous", "inclus", "photo", "une", "ats"] as const;
type Filter = (typeof filters)[number] | (typeof webFilters)[number];
const creative = new Set(["creatif", "visuel", "contraste", "bandeau"]);
const matches: Record<Filter, (template: CvTemplate) => boolean> = {
  tous: () => true,
  sobres: (template) => template.layout === "one" && !creative.has(template.id),
  colonne: (template) => template.layout !== "one",
  creatifs: (template) => creative.has(template.id),
  inclus: () => true,
  photo: (template) => template.photo,
  une: (template) => template.layout === "one",
  ats: (template) => template.ats === "excellent",
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
    select: { id: true, title: true, templateId: true, content: true, style: true },
  });
  if (!cv) return cvId ? notFound() : redirect("/app/career/cv");
  const t = await getTranslations();
  const d = dynamic(t);
  const [granted, plans, owner] = await Promise.all([
    templatesAccess(db, { type: "user", id: user.id }),
    listPublicPlans(db),
    db.user.findUniqueOrThrow({ where: { id: user.id }, select: { image: true } }),
  ]);
  const current = templateOf(cv.templateId);
  const filter: Filter =
    filters.includes(query.filtre as (typeof filters)[number]) ||
    webFilters.includes(query.filtre as (typeof webFilters)[number])
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
  const shown = cvTemplateRegistry.filter(
    (template) => matches[filter](template) && (filter !== "inclus" || included(template)),
  );
  const includedCount = cvTemplateRegistry.filter(included).length;
  const otherCount = cvTemplateRegistry.length - includedCount;
  const otherPlans = [
    ...new Set(cvTemplateRegistry.filter((item) => !included(item)).map(lockPlan)),
  ].filter(Boolean);
  const lead =
    otherCount > 0 && otherPlans.length > 0
      ? t("docs.web.templates.leadMore", {
          included: includedCount,
          others: otherCount,
          plans: new Intl.ListFormat("fr", { type: "disjunction" }).format(otherPlans),
        })
      : t("docs.web.templates.lead", { included: includedCount });
  // « Aperçu avec votre contenu »: the CV laid out in the selected template, its colour and
  // font carried over the way « Utiliser » would carry them.
  const source = cvSourceOf(cv, owner.image);
  const selectedStyle = styleForTemplate(resolveStyle(cv.style, current), current, selected);
  const preview = await previewData({ ...source, template: selected, style: selectedStyle });
  const webCount = (item: (typeof webFilters)[number]) =>
    item === "tous" ? cvTemplateRegistry.length : item === "inclus" ? includedCount : undefined;
  const tags = [
    { key: "ats", label: d(`career.cv.template.ats.${selected.ats}`), ok: true },
    { key: "layout", label: d(`docs.web.templates.layout.${selected.layout}`) },
    ...(selected.photo ? [{ key: "photo", label: t("docs.web.templates.photo") }] : []),
    {
      key: "pages",
      label:
        selected.pages[0] === selected.pages[1]
          ? t("docs.web.templates.pages", { min: selected.pages[0] })
          : t("docs.web.templates.pagesRange", { min: selected.pages[0], max: selected.pages[1] }),
    },
  ];
  const href = (params: { filtre?: Filter; modele?: string }) => {
    const search = new URLSearchParams({ cv: cv.id });
    const nextFilter = params.filtre ?? filter;
    if (nextFilter !== "tous") search.set("filtre", nextFilter);
    search.set("modele", params.modele ?? selected.id);
    return `/app/career/cv/modeles?${search.toString()}`;
  };
  const editor = `/app/career/cv/${cv.id}`;
  const action = (className: string) =>
    !included(selected) ? (
      <Link
        href={`/app/abonnement?suite=${encodeURIComponent(href({ modele: selected.id }))}`}
        className={cx("t-bt t-p t-press", className)}
      >
        <TalentIcon name="cadenas" size="s" />
        {t("docs.templates.unlock", { plan: lockPlan(selected) })}
      </Link>
    ) : selected.id === current.id ? (
      <Link href={editor} className={cx("t-bt t-sec t-press", className)}>
        {t("docs.templates.current", { name: name(selected) })}
      </Link>
    ) : (
      <form action={setCvTemplate} className="contents">
        <input type="hidden" name="id" value={cv.id} />
        <input type="hidden" name="template" value={selected.id} />
        <button type="submit" className={cx("t-bt t-p t-press", className)}>
          {t("docs.templates.use", { name: name(selected) })}
        </button>
      </form>
    );

  return (
    <>
      <div className="t-mob t-flux t-od-bas">
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

        <div className="t-verre t-fort t-bas-f">{action("t-pl")}</div>
      </div>

      {/* ─── Tablet and computer (planche studio-cv § 2) ──────────────────────────────── */}
      <div className="t-large t-sc-galerie">
        <StudioFrame />
        <div className="t-sc-wh">
          <div className="t-t">
            <h1>{t("docs.templates.title")}</h1>
            <p>{lead}</p>
          </div>
          <Link href={editor} className="t-bt t-sec t-m t-press">
            <TalentIcon name="retour" size="xs" />
            {t("docs.web.templates.back")}
          </Link>
        </div>
        {query.erreur === "modele" && (
          <Notice tone="err">{t("docs.templates.locked", { plan: lockPlan(selected) })}</Notice>
        )}
        <nav aria-label={t("docs.templates.filters")} className="t-puces">
          {webFilters.map((item) => (
            <Link
              key={item}
              href={href({ filtre: item })}
              aria-current={item === filter ? "true" : undefined}
              className={cx("t-puce t-press", item === filter && "t-on")}
            >
              {t(`docs.web.templates.filter.${item}`, { count: webCount(item) ?? 0 })}
            </Link>
          ))}
        </nav>
        <div className="t-sc-gal">
          <ul className="t-sc-tpg">
            {shown.map((template) => {
              const open = included(template);
              const on = template.id === selected.id;
              return (
                <li key={template.id}>
                  <Link
                    href={href({ modele: template.id })}
                    aria-current={on ? "true" : undefined}
                    className={cx("t-sc-tp t-press", on && "t-on", !open && "t-lk")}
                    scroll={false}
                  >
                    <span className="t-sc-vg">
                      <Image
                        src={templateImage(template)}
                        alt=""
                        width={600}
                        height={849}
                        sizes="(min-width: 1200px) 200px, 30vw"
                      />
                      {open ? (
                        <span className="t-sc-bd">
                          <TalentIcon name="valider" size="xs" />
                          {t("docs.templates.included")}
                        </span>
                      ) : (
                        <span className="t-sc-bd t-n">
                          <TalentIcon name="cadenas" size="xs" />
                          {lockPlan(template)}
                        </span>
                      )}
                      {on && (
                        <span className="t-sc-ck" aria-hidden>
                          <TalentIcon name="valider" size="xs" />
                        </span>
                      )}
                    </span>
                    <span>
                      {name(template)}
                      {template.id === current.id && (
                        <span className="sr-only">{t("docs.templates.currentShort")}</span>
                      )}
                    </span>
                    <small>{d(`docs.web.templates.layout.${template.layout}`)}</small>
                  </Link>
                </li>
              );
            })}
          </ul>
          <section aria-labelledby="sc-gd-t" className="t-verre t-sc-gd">
            <div className="t-sc-big" aria-hidden inert>
              <CvPage
                data={preview.data}
                template={selected}
                style={selectedStyle}
                className="t-sc-mini"
              />
            </div>
            <h2 id="sc-gd-t">{name(selected)}</h2>
            <p>
              {d(`career.cv.template.description.${templateKey(selected.id)}`)}{" "}
              {t("docs.web.templates.yourContent")}
            </p>
            <ul className="t-sc-tg">
              {tags.map((tag) => (
                <li key={tag.key} className={cx(tag.ok && "t-v")}>
                  {tag.label}
                </li>
              ))}
            </ul>
            {action("t-sc-use")}
            <p className="t-sc-neutre">
              <TalentIcon name="cadenas" size="xs" />
              {t("docs.web.templates.neutral")}
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
