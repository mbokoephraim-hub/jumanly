import "server-only";
import { getTranslations } from "next-intl/server";
import { templateKey } from "@/features/cv/examples";
import { templateImage } from "@/features/cv/templates/images";
import { cvTemplateRegistry, includesAccess } from "@/features/cv/templates/registry";
import { dynamic } from "@/i18n/dynamic";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";
import { templatesAccess, TEMPLATES_ACCESS_KEY } from "@/server/services/cv";
import { listPublicPlans, talentPlanFor } from "@/server/services/plans";
import { CV_STEPS, type CvStep } from "./frame";

export type TemplateLevel = "free" | "starter" | "pro";

export type TemplateChoice = {
  id: string;
  name: string;
  image: string;
  level: TemplateLevel;
  /** « Gratuit », or the name of the cheapest plan that includes it (from the base, never the code). */
  levelLabel: string;
  /** The plan to take when the person's own does not include it, else null. */
  lockedBy: string | null;
  tags: string[];
};

/**
 * The fifteen templates of docs/modeles-cv with their real thumbnails (capture 07): the level of
 * each one against the entitlement `career.cv.templates.access`, plan names read from the base.
 */
export async function templateChoices(userId: string) {
  const t = await getTranslations("phoneCv.template");
  const d = dynamic(await getTranslations());
  const subject = { type: "user" as const, id: userId };
  const [granted, plans, plan] = await Promise.all([
    templatesAccess(db, subject),
    listPublicPlans(db),
    resolvePlan(db, subject),
  ]);
  const planOf: Record<TemplateLevel, string> = {
    free: t("free"),
    starter: talentPlanFor(plans, TEMPLATES_ACCESS_KEY, ["starter", "pro"]) || t("paid"),
    pro: talentPlanFor(plans, TEMPLATES_ACCESS_KEY, ["pro"]) || t("paid"),
  };
  const choices: TemplateChoice[] = cvTemplateRegistry.map((template) => {
    const level = template.access as TemplateLevel;
    const open = includesAccess(granted, template.access);
    return {
      id: template.id,
      name: d(`career.cv.template.name.${templateKey(template.id)}`),
      image: templateImage(template),
      level,
      levelLabel: planOf[level],
      lockedBy: open ? null : planOf[level],
      tags: [
        planOf[level],
        template.photo ? t("withPhoto") : t("withoutPhoto"),
        t(`ats.${template.ats}`),
      ],
    };
  });
  const included = choices.filter((choice) => choice.lockedBy === null).length;
  return {
    choices,
    filters: [
      { key: "tous" as const, label: t("filterAll", { count: choices.length }) },
      { key: "free" as const, label: t("filterFree") },
      { key: "starter" as const, label: planOf.starter },
      { key: "pro" as const, label: planOf.pro },
    ],
    sub: plan?.planName
      ? t("sub", { count: choices.length, plan: plan.planName, included })
      : t("subNoPlan", { count: choices.length, included }),
  };
}

/** The four steps of a CV, each one opening its own screen. */
export async function stepsOf(current: CvStep, cvId: string | null) {
  const t = await getTranslations("phoneCv.steps");
  const hrefs = Object.fromEntries(
    CV_STEPS.map((step) => [step, cvId ? `/app/career/cv/${cvId}?etape=${step}` : null]),
  ) as Record<CvStep, string | null>;
  return {
    current,
    hrefs,
    names: Object.fromEntries(CV_STEPS.map((step) => [step, t(step)])) as Record<CvStep, string>,
    label: t("label"),
    count: t("count", { step: CV_STEPS.indexOf(current) + 1, all: CV_STEPS.length }),
  };
}
