import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AiOrb } from "@/components/brand/ai-orb";
import { Alert, Button, Checkbox, TextArea } from "@/components/ui";
import { aiFeatures, aiReadiness } from "@/server/ai";
import {
  applyCvImportAction,
  cancelCvImportAction,
  readCvAction,
} from "@/server/actions/cv-import";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { CV_TEXT_MAX, parseImport } from "@/server/services/cv-import";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("talent.profile");
  return { title: { absolute: t("importCv.text") }, robots: { index: false } };
}

/**
 * « Remplir à partir de mon CV » (partie 08 § 8.9 `cv_parse`): paste the CV, then validate each
 * item found. Nothing enters the profile without the talent's tick.
 */
export default async function CvImportPage({ searchParams }: PageProps<"/app/profil/import">) {
  const query = await searchParams;
  const user = await requireUser("/app/profil/import");
  const t = await getTranslations();
  const [pending, readiness] = await Promise.all([
    db.aiSuggestion.findFirst({
      where: { userId: user.id, feature: "cv_parse", status: "pending" },
      orderBy: { createdAt: "desc" },
    }),
    aiReadiness(db, user.id, "cv_parse"),
  ]);
  const extraction = pending ? parseImport(pending.payload) : null;
  const found = extraction
    ? extraction.experiences.length + extraction.educations.length + extraction.skills.length
    : 0;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link href="/app/profil" className="text-sm underline">
        {t("talent.profile.title")}
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="text-h1">{t("talent.profile.importCv.text")}</h1>
        <p className="text-ardoise">{t("talent.profile.importCv.hint")}</p>
      </header>

      {!pending || !extraction ? (
        <form action={readCvAction} className="flex flex-col gap-4 rounded-card bg-blanc p-6">
          {query.erreur === "texte" && (
            <Alert tone="error" title={t("talent.profile.import.tooShort")} />
          )}
          <TextArea
            id="cv-import-text"
            name="text"
            label={t("talent.profile.import.paste.label")}
            hint={t("talent.profile.import.paste.hint")}
            rows={14}
            minLength={30}
            maxLength={CV_TEXT_MAX}
            required
          />
          <p className="flex items-center gap-2 text-sm text-ardoise">
            {readiness === "ready" ? (
              <>
                <AiOrb />
                {t("ai.credits.cost.text", { count: aiFeatures.cv_parse.credits })}
              </>
            ) : (
              t("ai.cvImport.noAi")
            )}
          </p>
          <div>
            <Button type="submit">{t("talent.profile.import.submit")}</Button>
          </div>
        </form>
      ) : (
        <form
          action={applyCvImportAction}
          className="flex flex-col gap-5 rounded-card bg-blanc p-6"
        >
          <input type="hidden" name="import" value={pending.id} />
          <div className="flex flex-col gap-1">
            <h2 className="flex items-center gap-2 text-h2">
              {extraction.source === "ai" && <AiOrb />}
              {t("ai.cvImport.title")}
            </h2>
            <p>{t("ai.cvImport.body")}</p>
            <p className="text-sm text-ardoise">
              {[
                t("ai.cvImport.found", { count: found }),
                extraction.source === "ai" ? t("ai.disclaimer.short") : t("ai.cvImport.noAi"),
              ].join(" · ")}
            </p>
          </div>
          {found === 0 && <Alert title={t("talent.profile.import.empty")} />}
          {extraction.experiences.length > 0 && (
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-2 font-semibold text-h3">
                {t("talent.profile.experience.title")}
              </legend>
              {extraction.experiences.map((item, index) => (
                <Checkbox
                  key={index}
                  id={`import-experience-${index}`}
                  name="experience"
                  value={String(index)}
                  defaultChecked={Boolean(item.start)}
                  disabled={!item.start}
                  label={[
                    item.title,
                    item.company,
                    [item.start, item.end].filter(Boolean).join(" – "),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  hint={item.start ? undefined : t("talent.profile.import.noStart")}
                />
              ))}
            </fieldset>
          )}
          {extraction.educations.length > 0 && (
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-2 font-semibold text-h3">
                {t("talent.profile.education.title")}
              </legend>
              {extraction.educations.map((item, index) => (
                <Checkbox
                  key={index}
                  id={`import-education-${index}`}
                  name="education"
                  value={String(index)}
                  defaultChecked
                  label={[item.degree, item.school, item.endYear ? String(item.endYear) : ""]
                    .filter(Boolean)
                    .join(" · ")}
                />
              ))}
            </fieldset>
          )}
          {extraction.skills.length > 0 && (
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-2 font-semibold text-h3">
                {t("talent.profile.skills.title")}
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {extraction.skills.map((skill, index) => (
                  <Checkbox
                    key={skill}
                    id={`import-skill-${index}`}
                    name="skill"
                    value={String(index)}
                    defaultChecked
                    label={skill}
                  />
                ))}
              </div>
              <p className="text-sm text-ardoise">{t("talent.profile.import.skillsHint")}</p>
            </fieldset>
          )}
          <div className="flex flex-wrap gap-3">
            {found > 0 && <Button type="submit">{t("ai.cvImport.accept")}</Button>}
            <Button type="submit" variant="tertiary" formAction={cancelCvImportAction}>
              {t("talent.profile.import.cancel")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
