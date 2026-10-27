import "server-only";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { previewData } from "@/features/cv/document";
import { cvColors, cvFonts } from "@/features/cv/render/palette";
import { cvSourceOf } from "@/features/cv/source";
import { blockLayout } from "@/features/cv/style";
import { dynamic } from "@/i18n/dynamic";
import { languageName } from "@/lib/dates";
import { PROFILE_PALETTE, colorOf } from "@/lib/profile-colors";
import { setCvTemplateStepAction } from "@/server/actions/cv-flow";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { cvSectionIds } from "@/server/services/cv";
import { cvChecks, cvScore, pendingSuggestions, targetSkillsFor } from "@/server/services/cv-coach";
import { CvContentStep, type ContentSection } from "./content";
import { stepsOf, templateChoices } from "./data";
import type { CvStep } from "./frame";
import { CvPreviewStep, type PreviewCheck } from "./preview";
import { CvStyleStep } from "./style";
import { CvTemplatePicker } from "./templates";
import { CvTexts } from "./texts";

/** The colours of the sections on Contenu (maquette Cv.dc.html). */
const SECTION_COLORS = {
  experience: PROFILE_PALETTE.ambre,
  skills: PROFILE_PALETTE.ciel,
  education: PROFILE_PALETTE.lilas,
  languages: PROFILE_PALETTE.menthe,
} as const;
type Section = keyof typeof SECTION_COLORS;
const isSection = (key: string): key is Section => key in SECTION_COLORS;

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
    const visible = new Map(content.sections.map((section) => [section.id, section.visible]));
    const order = blockLayout(template, style, cvSectionIds).map((block) => block.type);
    const sections: ContentSection[] = order.filter(isSection).map((key) => {
      const base = {
        key,
        name: d(`docs.section.${key}`),
        visible: visible.get(key) ?? true,
        color: SECTION_COLORS[key],
        href: `${editor}?partie=${key}`,
      };
      switch (key) {
        case "experience":
          return {
            ...base,
            count: content.experiences.length,
            experiences: content.experiences.map((item) => ({
              title: item.title,
              company: item.company,
              color: PROFILE_PALETTE[colorOf(item.company || item.title)],
              bullets: item.bullets,
            })),
          };
        case "skills":
          return {
            ...base,
            count: content.skills.length,
            chips: content.skills.map((skill) => ({
              text: skill.name,
              color: PROFILE_PALETTE[colorOf(skill.name)],
            })),
          };
        case "education":
          return {
            ...base,
            count: content.education.length,
            lines: content.education.map((item) =>
              [item.degree, item.school].filter(Boolean).join(" · "),
            ),
          };
        case "languages":
          return {
            ...base,
            count: content.languages.length,
            chips: content.languages.map((item) => ({
              text: label(item.code),
              color: PROFILE_PALETTE.menthe,
            })),
          };
      }
    });
    const pending = await pendingSuggestions(db, user.id, cv.id);
    const summary = pending.find((item) => item.payload.target.section === "summary");
    const info = content.info;
    return (
      <CvTexts>
        <CvContentStep
          key={cv.updatedAt.toISOString()}
          cvId={cv.id}
          summary={content.summary}
          suggestion={
            summary?.payload.after ? { id: summary.id, text: summary.payload.after } : null
          }
          contact={{
            line: [info.name, info.showEmail ? info.email : null, info.city]
              .filter(Boolean)
              .join(" · "),
            href: `${editor}?partie=info`,
          }}
          sections={sections}
          order={order}
          steps={steps}
        />
      </CvTexts>
    );
  }

  const { data } = await previewData(source);

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
    figure: { kind: "link", href: `${editor}?partie=experience` },
    dates: { kind: "link", href: `${editor}?partie=experience` },
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
        steps={steps}
      />
    </CvTexts>
  );
}
