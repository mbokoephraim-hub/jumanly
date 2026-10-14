import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { languageName } from "@/lib/dates";
import { parseCriteria, parseLanguages, type PublicJob } from "@/server/services/jobs";

const heading = "text-2xl leading-[30px] font-semibold tracking-[-0.015em]";
const chip =
  "inline-flex min-h-7 items-center rounded-pill px-3 py-1 text-xs leading-4 font-semibold";

function CheckItems({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-[14.5px] leading-[22px]">
          <span
            aria-hidden
            className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-lime-clair text-feuille-fonce"
          >
            <Icon name="check" className="size-3" />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

/** The body of a job offer (mockup 01-13), shared by the public page and the signed-in page. */
export async function JobBody({ job }: { job: PublicJob }) {
  const t = await getTranslations();
  const languages = parseLanguages(job.languagesRequired);
  const criteria = parseCriteria(job.knockoutCriteria);
  const required = job.skills.filter((skill) => skill.importance === "required");
  const preferred = job.skills.filter((skill) => skill.importance === "preferred");
  const listSection = (title: string, items: string[]) =>
    items.length > 0 && (
      <div data-reveal className="flex flex-col gap-4">
        <h2 className={heading}>{title}</h2>
        <CheckItems items={items} />
      </div>
    );
  return (
    <div className="flex flex-col gap-10">
      <div data-reveal className="flex flex-col gap-3">
        <h2 className={heading}>{t("job.description.title")}</h2>
        <p className="text-[15px] leading-6 whitespace-pre-line">{job.description}</p>
      </div>
      {listSection(t("job.missions.title"), job.responsibilities)}
      {listSection(t("job.requirements.title"), job.requirements)}
      {(required.length > 0 || preferred.length > 0) && (
        <div data-reveal className="grid gap-6 sm:grid-cols-2">
          {required.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-[15px] font-semibold">{t("job.skills.required")}</h2>
              <ul className="flex flex-wrap gap-2">
                {required.map((skill) => (
                  <li key={skill.skillId} className={`${chip} bg-lime`}>
                    {skill.skill.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {preferred.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-[15px] font-semibold">{t("job.skills.preferred")}</h2>
              <ul className="flex flex-wrap gap-2">
                {preferred.map((skill) => (
                  <li key={skill.skillId} className={`${chip} bg-brume`}>
                    {skill.skill.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {criteria.length > 0 && (
        <div data-reveal className="flex flex-col gap-4">
          <h2 className={heading}>{t("job.criteria.title")}</h2>
          <div className="flex flex-col gap-3.5 rounded-[20px] bg-creme p-5">
            <ul className="flex flex-col gap-3">
              {criteria.map((criterion) => (
                <li
                  key={criterion}
                  className="flex items-start gap-2.5 text-[14.5px] leading-[22px]"
                >
                  <Icon
                    name="objectif"
                    className="mt-0.5 size-[18px] shrink-0 text-feuille-fonce"
                  />
                  {criterion}
                </li>
              ))}
            </ul>
            <p className="flex items-start gap-2 text-xs leading-[17px] text-ardoise">
              <Icon name="eye" className="mt-px size-3.5 shrink-0" />
              {t("job.criteria.help")}
            </p>
          </div>
        </div>
      )}
      {languages.length > 0 && (
        <div data-reveal className="flex flex-col gap-4">
          <h2 className={heading}>{t("job.languages.title")}</h2>
          <ul className="flex flex-wrap gap-2">
            {languages.map((language) => (
              <li key={language.code} className={`${chip} bg-brume`}>
                {t("ui.languageLevel", {
                  language: languageName(language.code),
                  level: language.level,
                })}
              </li>
            ))}
          </ul>
        </div>
      )}
      {job.benefits.length > 0 && (
        <div data-reveal className="flex flex-col gap-4">
          <h2 className={heading}>{t("job.benefits.title")}</h2>
          <ul className="flex flex-wrap gap-2">
            {job.benefits.map((benefit) => (
              <li key={benefit} className={`${chip} bg-menthe-claire`}>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}
      {job.process.length > 0 && (
        <div data-reveal className="flex flex-col gap-4">
          <h2 className={heading}>{t("job.process.title")}</h2>
          <ol className="grid gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(130px,1fr))]">
            {job.process.map((step, index) => (
              <li
                key={step}
                className="flex items-center gap-3 rounded-[16px] bg-creme px-3.5 py-3 text-[13px] leading-[17px] font-medium"
              >
                <span
                  aria-hidden
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${index === 0 ? "bg-lime" : "bg-blanc"}`}
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
