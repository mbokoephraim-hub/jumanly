import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { AppPageHeader } from "@/components/app/page-header";
import { card, CareerTabs, eyebrow, pillClass } from "@/components/career/kit";
import { Alert } from "@/components/ui";
import { previewData } from "@/features/cv/document";
import { templateKey } from "@/features/cv/examples";
import { CvPaginationProvider, CvPreview } from "@/features/cv/render/CvPreview";
import { cvSourceOf } from "@/features/cv/source";
import { resolveStyle, styleForTemplate } from "@/features/cv/style";
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
import { templatesAccess } from "@/server/services/cv";
import { levelOf, listPublicPlans, plansOf, talentPlanFor } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("career.cv");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

const filters = [
  "all",
  "included",
  "photo",
  "noPhoto",
  "oneColumn",
  "twoColumns",
  "atsBest",
] as const;
type Filter = (typeof filters)[number];
const sorts = ["recommended", "free", "name"] as const;
type Sort = (typeof sorts)[number];
const accessRank = { free: 0, starter: 1, pro: 2 } as const;

/**
 * « Choisir un modèle » (docs/modeles-cv § 8.1, mockups interface/01-*): the 15 templates, those
 * of the plan marked « Inclus », the others with a lock and the plan that includes them. The
 * detail shows the template with the person's own content.
 */
export default async function CvTemplatesPage({
  searchParams,
}: PageProps<"/app/career/cv/modeles">) {
  const query = await searchParams;
  const user = await requireUser("/app/career/cv/modeles");
  const cvId = typeof query.cv === "string" ? query.cv : "";
  const cv = cvId
    ? await db.document.findFirst({
        where: { id: cvId, kind: "cv", profile: { userId: user.id } },
        include: { profile: { select: { user: { select: { image: true } } } } },
      })
    : await db.document.findFirst({
        where: { kind: "cv", profile: { userId: user.id } },
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
        include: { profile: { select: { user: { select: { image: true } } } } },
      });
  if (!cv) notFound();
  const t = await getTranslations("career.cv");
  const d = dynamic(t);
  const tHome = await getTranslations("career.home");
  const [granted, plans] = await Promise.all([
    templatesAccess(db, { type: "user", id: user.id }),
    listPublicPlans(db),
  ]);
  const current = templateOf(cv.templateId);
  const filter: Filter = filters.includes(query.filtre as Filter)
    ? (query.filtre as Filter)
    : "all";
  const sort: Sort = sorts.includes(query.tri as Sort) ? (query.tri as Sort) : "recommended";
  const selected = findTemplate(typeof query.modele === "string" ? query.modele : "") ?? current;
  const included = (template: CvTemplate) => includesAccess(granted, template.access);
  const includedCount = cvTemplateRegistry.filter(included).length;
  const name = (template: CvTemplate) => d(`template.name.${templateKey(template.id)}`);
  const matches: Record<Filter, (template: CvTemplate) => boolean> = {
    all: () => true,
    included,
    photo: (template) => template.photo,
    noPhoto: (template) => !template.photo,
    oneColumn: (template) => template.layout === "one",
    twoColumns: (template) => template.layout !== "one",
    atsBest: (template) => template.ats === "excellent",
  };
  const shown = cvTemplateRegistry
    .filter(matches[filter])
    .toSorted((a, b) =>
      sort === "free"
        ? accessRank[a.access] - accessRank[b.access]
        : sort === "name"
          ? name(a).localeCompare(name(b), "fr")
          : 0,
    );
  const href = (params: Record<string, string>) => {
    const search = new URLSearchParams({
      cv: cv.id,
      ...(filter !== "all" ? { filtre: filter } : {}),
      ...(sort !== "recommended" ? { tri: sort } : {}),
      modele: selected.id,
      ...params,
    });
    return `/app/career/cv/modeles?${search.toString()}#detail`;
  };
  const levels = (template: CvTemplate) =>
    template.access === "pro" ? ["pro"] : ["starter", "pro"];
  const lockPlan = (template: CvTemplate) =>
    talentPlanFor(plans, "career.cv.templates.access", levels(template));
  const includingPlans = (template: CvTemplate) =>
    plansOf(plans, "talent")
      .filter((plan) => levels(template).includes(levelOf(plan, "career.cv.templates.access")))
      .map((plan) => plan.name)
      .join(", ");

  // The selected template with the person's content (or the demonstration CV while it is empty).
  const source = cvSourceOf(cv, cv.profile.user.image);
  const style = styleForTemplate(resolveStyle(cv.style, current), current, selected);
  const { data, demo } = await previewData({ ...source, template: selected, style });
  const selectedIncluded = included(selected);
  const full = query.plein === "1";
  const badges = [
    t(`template.ats.${selected.ats}`),
    t(`template.layout.${selected.layout}`),
    selected.photo ? t("template.photo.optional") : t("template.photo.none"),
    t("export.pages", { count: selected.pages[1] }),
  ];

  return (
    <>
      <AppPageHeader
        eyebrow={[tHome("eyebrow"), cv.title].join(" · ")}
        title={t("templates.title")}
      />
      <CareerTabs active="cv" />
      {query.erreur === "modele" && (
        <Alert tone="error" title={t("template.locked", { plan: lockPlan(selected) })} />
      )}
      <p className="text-sm text-ardoise">{t("templates.subtitle")}</p>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          <nav
            aria-label={t("templates.title")}
            className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
          >
            <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
              {filters.map((item) => (
                <li key={item}>
                  <Link
                    href={href({ filtre: item === "all" ? "" : item })}
                    aria-current={item === filter ? "true" : undefined}
                    className={pillClass(item === filter ? "dark" : "outline", "sm", "h-10 px-4")}
                  >
                    {item === "all"
                      ? t("templates.filter.all", { count: cvTemplateRegistry.length })
                      : item === "included"
                        ? t("templates.filter.included", { count: includedCount })
                        : t(`templates.filter.${item}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm">
              <Icon name="check" className="size-4 text-feuille" />
              {t("templates.count", {
                included: includedCount,
                others: cvTemplateRegistry.length - includedCount,
              })}
            </p>
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                {t("templates.sort", { order: t(`templates.sortBy.${sort}`) })}
                <Icon name="chev-d" className="size-4" />
              </summary>
              <ul className="absolute right-0 z-10 mt-2 flex w-48 flex-col gap-1 rounded-[16px] bg-blanc p-2 shadow-lg ring-1 ring-brume">
                {sorts.map((item) => (
                  <li key={item}>
                    <Link
                      href={href({ tri: item === "recommended" ? "" : item })}
                      aria-current={item === sort ? "true" : undefined}
                      className="block rounded-xl px-3 py-2 text-sm hover:bg-lime-clair aria-[current=true]:font-semibold"
                    >
                      {t(`templates.sortBy.${item}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          </div>

          <ul className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {shown.map((template) => {
              const open = included(template);
              const number =
                cvTemplateRegistry.indexOf(template as (typeof cvTemplateRegistry)[number]) + 1;
              return (
                <li key={template.id}>
                  <Link
                    href={href({ modele: template.id })}
                    aria-current={template.id === selected.id ? "true" : undefined}
                    className="group flex flex-col gap-2"
                  >
                    <span
                      className={cx(
                        "relative block overflow-hidden rounded-[14px] bg-blanc ring-1 ring-brume transition group-hover:ring-sapin",
                        template.id === selected.id && "ring-[3px] ring-sapin",
                      )}
                    >
                      <Image
                        src={`/cv-templates/${String(number).padStart(2, "0")}-${template.id}.png`}
                        alt=""
                        width={600}
                        height={849}
                        sizes="(min-width: 1280px) 180px, 45vw"
                        className="aspect-[210/297] w-full object-cover object-top"
                      />
                      <span
                        className={cx(
                          "absolute top-2.5 left-2.5 flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-semibold",
                          open ? "bg-lime text-sapin" : "bg-sapin text-neon",
                        )}
                      >
                        {open ? (
                          t("template.included")
                        ) : (
                          <>
                            <Icon name="lock" className="size-3" />
                            {lockPlan(template)}
                          </>
                        )}
                      </span>
                      {template.id === current.id && (
                        <span className="absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-full bg-sapin text-blanc">
                          <Icon name="check" label={t("template.text")} className="size-4" />
                        </span>
                      )}
                    </span>
                    <span className="flex items-start justify-between gap-2">
                      <span className="flex min-w-0 flex-col">
                        <span className="text-[15px] font-semibold">{name(template)}</span>
                        <span className="text-xs text-ardoise">
                          {[
                            t(`template.layout.${template.layout}`),
                            template.photo
                              ? t("template.photo.optional")
                              : t("template.photo.none"),
                          ].join(" · ")}
                        </span>
                      </span>
                      {template.photo && <Icon name="profil" className="mt-1 size-4 shrink-0" />}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <aside
          id="detail"
          aria-labelledby="modele-detail"
          className={cx(card, "flex scroll-mt-24 flex-col gap-3 self-start xl:sticky xl:top-6")}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col">
              <p className={cx(eyebrow, "text-ardoise")}>{t("template.text")}</p>
              <h2 id="modele-detail" className="text-[22px] font-semibold">
                {name(selected)}
              </h2>
            </div>
            {selectedIncluded ? (
              <span className="rounded-pill bg-lime px-3 py-1 text-xs font-semibold text-sapin">
                {t("template.included")}
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-pill bg-sapin px-3 py-1 text-xs font-semibold text-neon">
                <Icon name="lock" className="size-3" />
                {lockPlan(selected)}
              </span>
            )}
          </div>
          <div className="relative overflow-hidden rounded-[16px] bg-creme p-3">
            <span className="absolute top-5 left-5 z-10 flex items-center gap-1.5 rounded-pill bg-blanc px-3 py-1 text-xs font-semibold shadow">
              <Icon name="eye" className="size-3.5" />
              {selectedIncluded ? t("template.preview") : t("template.previewBadge")}
            </span>
            <div className={cx("overflow-hidden", !full && "max-h-[420px]")}>
              <CvPaginationProvider>
                <CvPreview data={data} template={selected} style={style} />
              </CvPaginationProvider>
            </div>
          </div>
          {demo && <p className="text-xs text-ardoise">{t("empty")}</p>}
          <p className="text-sm">{d(`template.description.${templateKey(selected.id)}`)}</p>
          <ul className="flex flex-wrap gap-1.5">
            {badges.map((badge, index) => (
              <li
                key={badge}
                className={cx(
                  "rounded-pill px-3 py-1 text-xs font-semibold",
                  index === 0 && selected.ats !== "good" ? "bg-lime-clair" : "bg-creme",
                )}
              >
                {badge}
              </li>
            ))}
          </ul>
          {selectedIncluded ? (
            selected.id === current.id ? (
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Icon name="check" className="size-4 text-feuille" />
                {t("template.current", { templateName: name(selected) })}
              </p>
            ) : (
              <form action={setCvTemplate}>
                <input type="hidden" name="id" value={cv.id} />
                <input type="hidden" name="template" value={selected.id} />
                <button type="submit" className={pillClass("lime", "md", "w-full")}>
                  {t("template.apply")}
                </button>
              </form>
            )
          ) : (
            <>
              <div className="flex items-start gap-3 rounded-[16px] bg-creme p-4">
                <Icon name="lock" className="mt-0.5 size-5 shrink-0" />
                <div className="flex flex-col gap-1">
                  <p className="font-semibold">
                    {t("template.locked", { plan: lockPlan(selected) })}
                  </p>
                  <p className="text-sm text-ardoise">
                    {t("template.lockedHint", { plans: includingPlans(selected) })}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={href({ plein: full ? "" : "1" })}
                  className={pillClass("outline", "md", "px-3")}
                >
                  <Icon name="eye" className="size-4" />
                  {t("template.previewFull")}
                </Link>
                <Link
                  href={`/app/abonnement?suite=${encodeURIComponent(`/app/career/cv/modeles?cv=${cv.id}&modele=${selected.id}`)}`}
                  className={pillClass("lime", "md", "px-3")}
                >
                  {t("template.seePlans")}
                </Link>
              </div>
            </>
          )}
          <p className="text-center text-xs text-ardoise">{t("template.neutral")}</p>
          <Link
            href={`/app/career/cv/${cv.id}?vue=style`}
            className="text-center text-sm font-semibold text-up-texte hover:underline"
          >
            {t("title")}
          </Link>
        </aside>
      </div>
    </>
  );
}
