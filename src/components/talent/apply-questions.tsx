import { getTranslations } from "next-intl/server";
import {
  screeningPresetOf,
  splitScreeningAnswer,
  type ScreeningPreset,
  type ScreeningQuestion,
} from "@/server/services/screening";

/**
 * The recruiter's questions while applying (Ephraïm, 31/10/2026): each one on its own card, with
 * ready answers to tap. « Dites-nous où » opens only after « Oui, déjà » (CSS `:has`, no script);
 * the salary is a figure the talent writes. Any other question keeps a free answer. Answering is
 * never a condition to apply (golden rule n° 1). The fields belong to the step's form (`form`).
 */
export async function ApplyQuestions({
  questions,
  answers,
  form,
}: {
  questions: ScreeningQuestion[];
  answers: Map<string, string>;
  form: string;
}) {
  const t = await getTranslations("apply.questions");
  const options: Record<Exclude<ScreeningPreset, "salary">, string[]> = {
    experience: [t("experience.yes"), t("experience.no")],
    start: [t("start.now"), t("start.week"), t("start.month")],
    place: [t("place.here"), t("place.ready"), t("place.no")],
  };
  const unit = t("salary.unit");

  return (
    <section className="t-apq" aria-labelledby="apq-titre">
      <input type="hidden" name="answers" value="1" form={form} />
      <div className="t-apq-tete">
        <h2 id="apq-titre" className="t-h2s">
          {t("title")}
        </h2>
      </div>
      <p className="t-aide">{t("help")}</p>
      <ol className="t-apq-l">
        {questions.map((question, index) => {
          const saved = answers.get(question.id) ?? "";
          const name = `answer-${question.id}`;
          const preset = screeningPresetOf(question);
          const headId = `apq-${question.id}-q`;
          const head = (
            <p className="t-apq-q" id={headId}>
              <small>{t("number", { n: index + 1 })}</small>
              <span>{question.text}</span>
            </p>
          );
          if (question.kind === "yesno" || (preset && preset !== "salary")) {
            const choices =
              question.kind === "yesno"
                ? [
                    { value: "yes", label: t("yes") },
                    { value: "no", label: t("no") },
                  ]
                : options[preset as Exclude<ScreeningPreset, "salary">].map((label) => ({
                    value: label,
                    label,
                  }));
            const split =
              question.kind === "yesno"
                ? { option: saved || null, detail: "" }
                : splitScreeningAnswer(
                    saved,
                    choices.map((choice) => choice.value),
                  );
            const withDetail = preset === "experience" ? choices[0]!.value : null;
            return (
              <li key={question.id}>
                <div className="t-verre t-apq-c">
                  {head}
                  <div className="t-apq-ch" role="radiogroup" aria-labelledby={headId}>
                    {choices.map((choice) => (
                      <label key={choice.value} className="t-press">
                        <input
                          type="radio"
                          name={name}
                          value={choice.value}
                          form={form}
                          defaultChecked={split.option === choice.value}
                          data-detail={choice.value === withDetail ? "" : undefined}
                        />
                        <span className="t-apq-coche" aria-hidden />
                        {choice.label}
                      </label>
                    ))}
                  </div>
                  {withDetail && (
                    <div className="t-apq-plus">
                      <input
                        type="hidden"
                        name={`detailFor-${question.id}`}
                        value={withDetail}
                        form={form}
                      />
                      <label htmlFor={`apq-${question.id}-d`}>{t("experience.where")}</label>
                      <input
                        id={`apq-${question.id}-d`}
                        name={`detail-${question.id}`}
                        form={form}
                        maxLength={300}
                        defaultValue={split.option === withDetail ? split.detail : ""}
                        placeholder={t("experience.wherePlaceholder")}
                        autoComplete="organization"
                      />
                    </div>
                  )}
                </div>
              </li>
            );
          }
          if (preset === "salary") {
            const figure = saved.endsWith(` ${unit}`) ? saved.slice(0, -unit.length - 1) : saved;
            return (
              <li key={question.id}>
                <div className="t-verre t-apq-c">
                  {head}
                  <input type="hidden" name={`unit-${question.id}`} value={unit} form={form} />
                  <label className="t-apq-sal">
                    <span className="sr-only">{t("salary.label")}</span>
                    <input
                      name={name}
                      form={form}
                      inputMode="numeric"
                      maxLength={20}
                      defaultValue={figure}
                      placeholder={t("salary.placeholder")}
                    />
                    <span className="t-apq-u">{unit}</span>
                  </label>
                  <small className="t-apq-aide">{t("salary.hint")}</small>
                </div>
              </li>
            );
          }
          return (
            <li key={question.id}>
              <div className="t-verre t-apq-c">
                {head}
                <label htmlFor={`apq-${question.id}`} className="sr-only">
                  {question.text}
                </label>
                <textarea
                  id={`apq-${question.id}`}
                  name={name}
                  form={form}
                  maxLength={1000}
                  rows={3}
                  defaultValue={saved}
                  placeholder={t("free")}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
