import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AppPageHeader } from "@/components/app/page-header";
import {
  CvEmptyCard,
  CvListHero,
  enter,
  NewCvCard,
  OtherCvCard,
  PrimaryCvCard,
  TemplatesBand,
  type CvRow,
} from "@/components/career/cv/list";
import { Alert } from "@/components/ui";
import { cvFonts } from "@/features/cv/render/palette";
import {
  cvTemplateRegistry,
  includesAccess,
  templateOf,
  type CvTemplate,
} from "@/features/cv/templates/registry";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { MAX_CVS, parseCv, templatesAccess } from "@/server/services/cv";
import { cvScore, targetSkillsFor } from "@/server/services/cv-coach";
import { listPublicPlans, talentPlanFor } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("career.cv");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

/**
 * « Mes CV » (docs/refonte-career/BRIEF-CV-V2.md § 1): the hero with the real figures, the CV
 * principal in a large card, the other CVs, a « Nouveau CV » card and the templates band.
 */
export default async function CvListPage({ searchParams }: PageProps<"/app/career/cv">) {
  const params = await searchParams;
  const user = await requireUser("/app/career/cv");
  const t = await getTranslations("career.cv");
  const tHome = await getTranslations("career.home");
  const [documents, targets, granted, plans] = await Promise.all([
    db.document.findMany({
      where: { kind: "cv", profile: { userId: user.id } },
      orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        isPrimary: true,
        updatedAt: true,
        templateId: true,
        content: true,
      },
    }),
    targetSkillsFor(db, user.id),
    templatesAccess(db, { type: "user", id: user.id }),
    listPublicPlans(db),
  ]);
  // At most MAX_CVS pure calls (§ 1.5).
  const cvs: CvRow[] = documents.map((document) => ({
    id: document.id,
    title: document.title,
    isPrimary: document.isPrimary,
    updatedAt: document.updatedAt,
    template: templateOf(document.templateId),
    score: cvScore(parseCv(document.content), targets.skills),
  }));
  const primary = cvs.find((cv) => cv.isPrimary) ?? null;
  const others = cvs.filter((cv) => cv !== primary);
  const atLimit = cvs.length >= MAX_CVS;

  const included = (template: CvTemplate) => includesAccess(granted, template.access);
  const includedTemplates = cvTemplateRegistry.filter(included);
  const lockedTemplate = cvTemplateRegistry.find((template) => !included(template));
  const locked = lockedTemplate
    ? {
        template: lockedTemplate,
        plan: talentPlanFor(
          plans,
          "career.cv.templates.access",
          lockedTemplate.access === "pro" ? ["pro"] : ["starter", "pro"],
        ),
      }
    : null;

  return (
    <>
      <AppPageHeader eyebrow={tHome("eyebrow")} title={t("title")} />
      {params.ok === "supprime" && <Alert tone="success" title={t("deleted")} />}
      {params.ok === "principal" && <Alert tone="success" title={t("saved")} />}
      {params.erreur === "limite" && <Alert tone="error" title={t("limit", { max: MAX_CVS })} />}

      <CvListHero count={cvs.length} max={MAX_CVS} primary={primary} />

      {cvs.length === 0 ? (
        <CvEmptyCard />
      ) : (
        <>
          {primary && <PrimaryCvCard cv={primary} />}
          {(others.length > 0 || !atLimit) && (
            <section
              id="cv-autres"
              aria-labelledby="cv-others-title"
              {...enter(2)}
              className="jm-ch-in flex flex-col gap-4"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 id="cv-others-title" className="text-[22px] font-semibold tracking-[-0.02em]">
                  {t("list.othersTitle")}
                </h2>
                <p className="text-sm text-ardoise">{t("list.othersLead")}</p>
              </div>
              {atLimit && <Alert tone="info" title={t("limit", { max: MAX_CVS })} />}
              <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                {others.map((cv, index) => (
                  <OtherCvCard key={cv.id} cv={cv} index={index} />
                ))}
                {!atLimit && <NewCvCard left={MAX_CVS - cvs.length} />}
              </ul>
            </section>
          )}
        </>
      )}

      <TemplatesBand
        total={cvTemplateRegistry.length}
        included={includedTemplates.length}
        fonts={cvFonts.length}
        fan={includedTemplates.slice(0, 3)}
        locked={locked}
        href={
          primary
            ? `/app/career/cv/modeles?cv=${primary.id}`
            : cvs[0]
              ? `/app/career/cv/modeles?cv=${cvs[0].id}`
              : null
        }
      />
    </>
  );
}
