import { getTranslations } from "next-intl/server";
import { CheckList } from "@/components/site/sections";
import { Badge } from "@/components/ui";
import { languageName } from "@/lib/dates";
import { parseCriteria, parseLanguages, type PublicJob } from "@/server/services/jobs";

/** The body of a job offer, shared by the public page and the signed-in page. */
export async function JobBody({ job }: { job: PublicJob }) {
  const t = await getTranslations();
  const languages = parseLanguages(job.languagesRequired);
  const criteria = parseCriteria(job.knockoutCriteria);
  const required = job.skills.filter((skill) => skill.importance === "required");
  const preferred = job.skills.filter((skill) => skill.importance === "preferred");
  const listSection = (title: string, items: string[]) =>
    items.length > 0 && (
      <div className="flex flex-col gap-4">
        <h2 className="text-h2">{title}</h2>
        <CheckList items={items} />
      </div>
    );
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <h2 className="text-h1">{t("job.description.title")}</h2>
        <p className="text-[17px] leading-8 whitespace-pre-line">{job.description}</p>
      </div>
      {listSection(t("job.missions.title"), job.responsibilities)}
      {listSection(t("job.requirements.title"), job.requirements)}
      {(required.length > 0 || preferred.length > 0) && (
        <div className="flex flex-col gap-4">
          {required.length > 0 && (
            <>
              <h2 className="text-h2">{t("job.skills.required")}</h2>
              <ul className="flex flex-wrap gap-2">
                {required.map((skill) => (
                  <li key={skill.skillId}>
                    <Badge tone="sapin">{skill.skill.name}</Badge>
                  </li>
                ))}
              </ul>
            </>
          )}
          {preferred.length > 0 && (
            <>
              <h2 className="text-h2">{t("job.skills.preferred")}</h2>
              <ul className="flex flex-wrap gap-2">
                {preferred.map((skill) => (
                  <li key={skill.skillId}>
                    <Badge tone="neutral">{skill.skill.name}</Badge>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      {criteria.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-h2">{t("job.criteria.title")}</h2>
          <p className="text-[15px] text-ardoise">{t("job.criteria.help")}</p>
          <CheckList items={criteria} />
        </div>
      )}
      {languages.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-h2">{t("job.languages.title")}</h2>
          <ul className="flex flex-wrap gap-2">
            {languages.map((language) => (
              <li key={language.code}>
                <Badge tone="neutral">
                  {t("ui.languageLevel", {
                    language: languageName(language.code),
                    level: language.level,
                  })}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
      {listSection(t("job.benefits.title"), job.benefits)}
      {job.process.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-h2">{t("job.process.title")}</h2>
          <ol className="flex flex-col gap-2">
            {job.process.map((step, index) => (
              <li key={step} className="flex items-center gap-3 text-[15px]">
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-lime font-semibold"
                >
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
