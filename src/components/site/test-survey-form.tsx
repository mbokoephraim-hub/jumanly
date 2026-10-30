"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/brand/icon";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { TextArea } from "@/components/ui/text-area";
import { cx } from "@/lib/cx";
import { submitTestSurveyAction, type TestSurveyState } from "@/server/actions/test-survey";
import { testAreas, testDevices, testRatings } from "@/server/services/waitlist-test-options";

const card = "flex flex-col gap-6 rounded-[28px] bg-blanc p-6 lg:rounded-[32px] lg:p-10";
const pill = cx(
  "grid h-11 min-w-11 cursor-pointer place-items-center rounded-pill px-3 text-[14px] font-semibold ring-[1.5px] ring-brume transition-all ring-inset",
  "peer-checked:bg-lime peer-checked:text-sapin peer-checked:ring-lime peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lime",
  "hover:ring-ardoise",
);

/** End-of-test questionnaire (30/10/2026). Plain HTML submission works too. */
export function TestSurveyForm({ token, firstName }: { token: string; firstName: string }) {
  const t = useTranslations("testSurvey");
  const [state, action, pending] = useActionState<TestSurveyState, FormData>(
    submitTestSurveyAction,
    { status: "idle" },
  );
  const values =
    state.status === "invalid" || state.status === "failed" || state.status === "rateLimited"
      ? state.values
      : {};
  const errors = state.status === "invalid" ? state.errors : {};
  const error = (field: string) => (errors[field] ? t(`error.${errors[field]}`) : undefined);
  const text = (field: string) => (typeof values[field] === "string" ? values[field] : undefined);
  const areas = Array.isArray(values.areas) ? values.areas : [];

  if (state.status === "saved" || state.status === "already") {
    return (
      <div role="status" className={cx(card, "items-start")}>
        <span
          aria-hidden
          className="grid size-16 place-items-center rounded-full bg-lime text-sapin"
        >
          <Icon name="check" className="size-8" />
        </span>
        <h2 className="text-[26px] leading-8 font-semibold tracking-[-0.02em] lg:text-[32px] lg:leading-[38px]">
          {t(state.status === "saved" ? "done.title" : "done.alreadyTitle", { firstName })}
        </h2>
        <p className="max-w-[520px] text-[15px] leading-6 text-ardoise">
          {t(state.status === "saved" ? "done.text" : "done.alreadyText")}
        </p>
        <ButtonLink href="/" variant="secondary">
          {t("done.cta")}
        </ButtonLink>
      </div>
    );
  }
  if (state.status === "unknown") return <Alert tone="error" title={t("unknown.title")} />;

  return (
    <form action={action} noValidate className={card}>
      <input type="hidden" name="token" value={token} />
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl leading-[30px] font-semibold tracking-[-0.015em]">
          {t("form.title", { firstName })}
        </h2>
        <p className="text-sm leading-5 text-ardoise">{t("form.text")}</p>
      </div>
      {state.status === "invalid" && <Alert tone="error" title={t("error.summary")} />}
      {state.status === "rateLimited" && <Alert tone="error" title={t("error.rateLimit")} />}
      {state.status === "failed" && <Alert tone="error" title={t("error.failed")} />}

      <section className="flex flex-col gap-6">
        <h3 className="text-[13px] font-semibold tracking-[0.08em] text-ardoise uppercase">
          {t("sections.ratings")}
        </h3>
        {testRatings.map((name) => (
          <Scale
            key={name}
            name={name}
            from={1}
            to={5}
            label={t(`questions.${name}`)}
            low={t("scale.low")}
            high={t("scale.high")}
            chosen={text(name)}
            error={error(name)}
          />
        ))}
        <Scale
          name="recommend"
          from={0}
          to={10}
          label={t("questions.recommend")}
          low={t("scale.recommendLow")}
          high={t("scale.recommendHigh")}
          chosen={text("recommend")}
          error={error("recommend")}
        />
      </section>

      <section className="flex flex-col gap-6 border-t border-brume pt-6">
        <h3 className="text-[13px] font-semibold tracking-[0.08em] text-ardoise uppercase">
          {t("sections.usage")}
        </h3>
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 text-[15px] leading-[21px] font-semibold">
            {t("questions.areas")}
          </legend>
          <div className="flex flex-wrap gap-2">
            {testAreas.map((area) => (
              <label key={area} className="relative">
                <input
                  type="checkbox"
                  name="areas"
                  value={area}
                  defaultChecked={areas.includes(area)}
                  className="peer sr-only"
                />
                <span className={pill}>{t(`areas.${area}`)}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 text-[15px] leading-[21px] font-semibold">
            {t("questions.device")} <span className="text-corail-fonce">*</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {testDevices.map((device) => (
              <label key={device} className="relative">
                <input
                  type="radio"
                  name="device"
                  value={device}
                  defaultChecked={text("device") === device}
                  className="peer sr-only"
                />
                <span className={pill}>{t(`devices.${device}`)}</span>
              </label>
            ))}
          </div>
          {errors.device && (
            <p className="font-medium text-corail-fonce text-caption">{error("device")}</p>
          )}
        </fieldset>
      </section>

      <section className="flex flex-col gap-5 border-t border-brume pt-6">
        <h3 className="text-[13px] font-semibold tracking-[0.08em] text-ardoise uppercase">
          {t("sections.comments")}
        </h3>
        {(["liked", "problems", "improvements", "comments"] as const).map((name) => (
          <TextArea
            key={name}
            id={`test-survey-${name}`}
            name={name}
            label={t(`questions.${name}`)}
            hint={t(`hints.${name}`)}
            required={name === "improvements"}
            maxLength={2000}
            defaultValue={text(name)}
            error={error(name)}
          />
        ))}
      </section>

      <Button type="submit" variant="primary" disabled={pending} className="self-start">
        {pending ? t("form.pending") : t("form.submit")}
      </Button>
    </form>
  );
}

/** A row of numbered pills (1 to 5, or 0 to 10), one radio each. */
function Scale({
  name,
  from,
  to,
  label,
  low,
  high,
  chosen,
  error,
}: {
  name: string;
  from: number;
  to: number;
  label: string;
  low: string;
  high: string;
  chosen?: string;
  error?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-2.5 text-[15px] leading-[21px] font-semibold">
        {label} <span className="text-corail-fonce">*</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: to - from + 1 }, (_, index) => from + index).map((value) => (
          <label key={value} className="relative">
            <input
              type="radio"
              name={name}
              value={value}
              defaultChecked={chosen === String(value)}
              className="peer sr-only"
            />
            <span className={pill}>{value}</span>
          </label>
        ))}
      </div>
      <p className="flex justify-between gap-3 text-xs leading-4 text-ardoise">
        <span>{low}</span>
        <span>{high}</span>
      </p>
      {error && <p className="font-medium text-corail-fonce text-caption">{error}</p>}
    </fieldset>
  );
}
