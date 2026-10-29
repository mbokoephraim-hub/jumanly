import "server-only";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { previewData } from "@/features/cv/document";
import { cvColors, cvFonts } from "@/features/cv/render/palette";
import { cvSourceOf } from "@/features/cv/source";
import { dynamic } from "@/i18n/dynamic";
import { languageName } from "@/lib/dates";
import { setCvTemplateStepAction } from "@/server/actions/cv-flow";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { cvChecks, cvScore, targetSkillsFor } from "@/server/services/cv-coach";
import { listProjects } from "@/server/services/portfolio";
import { profileLanguageCodes } from "@/server/services/profile-view";
import { countryOptions } from "@/config/countries";
import { cvTextLabelData } from "@/features/cv/labels";
import { CvFormStep } from "./form";
import { stepsOf, templateChoices } from "./data";
import type { CvStep } from "./frame";
import { CvPreviewStep, type PreviewCheck } from "./preview";
import { CvStyleStep } from "./style";
import { CvTemplatePicker } from "./templates";
import { CvTexts } from "./texts";

/** The fonts offered on the phone (capture 10): a sans, a neutral one, a serif. */
const PHONE_FONTS = ["sora", "inter", "lora"] as const;

const label = (code: string) => {
  const name = languageName(code);
  return name.charAt(0).toLocaleUpperCase("fr") + name.slice(1);
};

/**
 * The four steps of a CV on the phone (docs/carriere-v3, captures 07, 09, 10, 11), at
 * /app/career/cv/[id]?etape=modele|contenu|style|apercu. Each section's editor (`?partie=`) and
 * « Adapter à une offre » keep their own screens.
 */
export async function PhoneCvSteps({
  id,
  step,
  query,
}: {
  id: string;
  step: CvStep;
  query: Record<string, string | string[] | undefined>;
}) {
  const user = await requireUser(`/app/career/cv/${id}`);
  const cv = await db.document.findFirst({
    where: { id, kind: "cv", profile: { userId: user.id } },
  });
  if (!cv) notFound();
  const t = await getTranslations();
  const d = dynamic(t);
  const steps = await stepsOf(step, cv.id);
  const editor = `/app/career/cv/${cv.id}`;

  if (step === "modele") {
    const { choices, filters, sub } = await templateChoices(user.id);
    const asked = typeof query.modele === "string" ? query.modele : cv.templateId;
    const initial = choices.find((choice) => choice.id === asked) ?? choices[0]!;
    return (
      <CvTexts>
        <CvTemplatePicker
          choices={choices}
          filters={filters}
          sub={sub}
          initial={initial.id}
          action={setCvTemplateStepAction}
          cvId={cv.id}
          back="/app/career/cv?onglet=cv"
          steps={steps}
          error={query.erreur === "modele" ? t("phoneCv.template.lockedError") : null}
        />
      </CvTexts>
    );
  }

  const owner = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { image: true },
  });
  const source = cvSourceOf(cv, owner.image);
  const { template, style, content } = source;

  if (step === "contenu") {
    const [labels, projects] = await Promise.all([
      cvTextLabelData(style.titlesLanguage),
      listProjects(db, cv.profileId),
    ]);
    return (
      <CvTexts>
        <CvFormStep
          key={cv.updatedAt.toISOString()}
          cvId={cv.id}
          initial={content}
          fromProfile={{
            achievements: projects
              .map((project) => project.title.trim())
              .filter(Boolean)
              .slice(0, 6),
          }}
          labels={labels}
          template={template}
          style={style}
          photoUrl={source.photoUrl}
          languages={profileLanguageCodes.map((code) => ({ value: code, label: label(code) }))}
          countries={countryOptions("code")}
          steps={steps}
        />
      </CvTexts>
    );
  }

  const { data, demo } = await previewData(source);

  if (step === "style") {
    const colors = [...cvColors]
      .sort((a, b) => Number(b.ats) - Number(a.ats))
      .map((item) => ({ ...item, name: d(`cv.colors.${item.code}`) }));
    const fonts = PHONE_FONTS.map((code) => {
      const font = cvFonts.find((item) => item.code === code)!;
      return {
        code,
        label: font.label,
        family: `"${font.family}", ${font.serif ? "serif" : "sans-serif"}`,
      };
    });
    return (
      <CvTexts>
        <CvStyleStep
          key={cv.updatedAt.toISOString()}
          cvId={cv.id}
          title={cv.title}
          data={data}
          template={template}
          style={style}
          colors={colors}
          fonts={fonts}
          empty={demo}
          steps={steps}
        />
      </CvTexts>
    );
  }

  const targets = await targetSkillsFor(db, user.id);
  const score = cvScore(content, targets.skills);
  const tc = await getTranslations("phoneCv.check");
  const fixes: Record<string, PreviewCheck["fix"]> = {
    headline: { kind: "action" },
    summary: { kind: "link", href: `${editor}?etape=contenu` },
    figure: { kind: "link", href: `${editor}?etape=contenu` },
    dates: { kind: "link", href: `${editor}?etape=contenu` },
    skills: { kind: "action" },
    keywords: { kind: "action" },
    languages: { kind: "action" },
    readable: { kind: "link", href: `${editor}?etape=modele` },
  };
  const checks: PreviewCheck[] = cvChecks(content, targets.skills, template).map((check) => ({
    key: check.key,
    ok: check.ok,
    text: check.ok
      ? tc(`${check.key}.ok`)
      : check.key === "keywords"
        ? tc("keywords.todo", { skills: (check.missing ?? []).slice(0, 3).join(", ") })
        : tc(`${check.key}.todo`),
    fix: fixes[check.key] ?? null,
  }));
  const tp = await getTranslations("phoneCv.preview");
  const exportError = typeof query.export === "string" ? query.export : null;
  return (
    <CvTexts>
      <CvPreviewStep
        key={cv.updatedAt.toISOString()}
        cvId={cv.id}
        title={cv.title}
        primary={cv.isPrimary}
        data={data}
        template={template}
        style={style}
        score={score}
        checks={checks}
        why={[
          tp("why1"),
          targets.title ? tp("why2For", { job: targets.title }) : tp("why2"),
          tp("why3"),
        ]}
        error={exportError ? tp("exportError") : null}
        empty={demo}
        steps={steps}
      />
    </CvTexts>
  );
}
