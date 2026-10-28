"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/brand/icon";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { sendQuoteRequest, type ContactFormState } from "@/server/actions/contact";
import { MESSAGE_MAX, quoteNeeds } from "@/server/services/contact-rules";

export type QuoteDefaults = {
  organization?: string;
  name?: string;
  email?: string;
  country?: string;
};

const card =
  "rounded-card bg-blanc p-6 shadow-[0_30px_60px_rgba(11,26,31,0.12)] lg:rounded-[32px] lg:p-10";

/**
 * « Demander un devis Company Premium » (maquette 05-06): a two-column form, the particular needs,
 * the message and the consent; then the confirmation. The request goes by e-mail to the
 * professional mailbox (no online sale of Company Premium). Works without JavaScript too.
 */
export function QuoteForm({
  countries,
  defaults = {},
}: {
  countries: { value: string; label: string }[];
  defaults?: QuoteDefaults;
}) {
  const t = useTranslations("quote");
  const tContact = useTranslations("contact");
  const [state, action, pending] = useActionState<ContactFormState, FormData>(sendQuoteRequest, {
    status: "idle",
  });
  const values: Record<string, string> =
    state.status === "invalid" || state.status === "rateLimited" || state.status === "failed"
      ? state.values
      : { ...defaults };
  const done = useRef<HTMLDivElement>(null);
  // The confirmation replaces a long form: bring it into view and give it the focus.
  useEffect(() => {
    if (state.status !== "sent" || !done.current) return;
    done.current.scrollIntoView({ block: "center" });
    done.current.focus({ preventScroll: true });
  }, [state.status]);
  const checkedNeeds = (values.needs ?? "").split(",");
  const errors = state.status === "invalid" ? state.errors : {};
  const error = (field: string) => {
    const code = errors[field];
    if (!code) return undefined;
    if (code === "messageLong") return tContact("form.error.messageLong", { max: MESSAGE_MAX });
    return t(`error.${code === "messageShort" ? "required" : code}`);
  };

  if (state.status === "sent") {
    return (
      <div
        ref={done}
        role="status"
        tabIndex={-1}
        className={`${card} flex scroll-mt-24 flex-col items-center gap-4 text-center outline-none`}
      >
        <h2 className="text-2xl leading-[30px] font-semibold tracking-[-0.015em]">
          {t("success.title")}
        </h2>
        <p className="max-w-[460px] text-[15px] leading-6 text-ardoise">
          {t("success.text", { email: state.email })}
        </p>
        <ButtonLink href="/tarifs#companies" variant="secondary" size="lg">
          {t("success.cta")}
        </ButtonLink>
      </div>
    );
  }

  const direct = t("direct");
  const at = direct.search(/\S+@\S+$/);
  return (
    <form action={action} noValidate className={`${card} flex flex-col gap-5`}>
      <div className="flex items-start gap-3.5">
        <span
          aria-hidden
          className="flex size-[46px] shrink-0 items-center justify-center rounded-[14px] bg-nuit text-lime"
        >
          <Icon name="entreprise" className="size-5" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-xl leading-[26px] font-semibold tracking-[-0.015em] lg:text-2xl lg:leading-[30px]">
            {t("title")}
          </h2>
          <p className="text-[14.5px] leading-[22px] text-ardoise">{t("subtitle")}</p>
        </div>
      </div>
      {state.status === "rateLimited" && (
        <Alert tone="error" title={tContact("form.error.rateLimit")} />
      )}
      {state.status === "failed" && <Alert tone="error" title={t("error.send")} />}
      <div className="grid gap-x-4 gap-y-[18px] sm:grid-cols-2">
        <TextField
          id="quote-organization"
          name="organization"
          icon="entreprise"
          autoComplete="organization"
          label={t("org.label")}
          placeholder={t("org.placeholder")}
          required
          defaultValue={values.organization}
          error={error("organization")}
        />
        <TextField
          id="quote-name"
          name="name"
          icon="profil"
          autoComplete="name"
          label={t("name.label")}
          placeholder={t("name.placeholder")}
          required
          defaultValue={values.name}
          error={error("name")}
        />
        <TextField
          id="quote-role"
          name="role"
          icon="career"
          autoComplete="organization-title"
          label={t("role.label")}
          placeholder={t("role.placeholder")}
          required
          defaultValue={values.role}
          error={error("role")}
        />
        <TextField
          id="quote-email"
          name="email"
          type="email"
          icon="message"
          autoComplete="email"
          label={t("email.label")}
          placeholder={t("email.placeholder")}
          required
          defaultValue={values.email}
          error={error("email")}
        />
        <Select
          id="quote-country"
          name="country"
          label={t("country.label")}
          placeholder={t("country.placeholder")}
          required
          defaultValue={values.country ?? ""}
          options={countries}
          error={error("country")}
        />
        <TextField
          id="quote-users"
          name="users"
          icon="equipe"
          inputMode="numeric"
          label={t("users.label")}
          hint={t("users.placeholder")}
          required
          defaultValue={values.users}
          error={error("users")}
        />
        <TextField
          id="quote-entities"
          name="entities"
          icon="grid"
          inputMode="numeric"
          label={t("entities.label")}
          placeholder={t("entities.placeholder")}
          defaultValue={values.entities}
          error={error("entities")}
        />
        <TextField
          id="quote-jobs"
          name="jobs"
          icon="jobs"
          inputMode="numeric"
          label={t("jobs.label")}
          placeholder={t("jobs.placeholder")}
          defaultValue={values.jobs}
          error={error("jobs")}
        />
      </div>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-[13px] leading-[18px] font-semibold">
          {t("needs.label")}
        </legend>
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          {quoteNeeds.map((need) => (
            <Checkbox
              key={need}
              id={`quote-need-${need}`}
              name="needs"
              value={need}
              label={t(`needs.${need}`)}
              defaultChecked={checkedNeeds.includes(need)}
            />
          ))}
        </div>
      </fieldset>
      <TextField
        id="quote-tools"
        name="tools"
        icon="reglages"
        label={t("tools.label")}
        placeholder={t("tools.placeholder")}
        defaultValue={values.tools}
        error={error("tools")}
      />
      <TextArea
        id="quote-message"
        name="message"
        rows={4}
        maxLength={MESSAGE_MAX}
        label={t("message.label")}
        placeholder={t("message.placeholder")}
        defaultValue={values.message}
        error={error("message")}
      />
      <div className="flex flex-col gap-1">
        <Checkbox
          id="quote-consent"
          name="consent"
          label={t("consent")}
          aria-invalid={errors.consent ? true : undefined}
          aria-describedby={errors.consent ? "quote-consent-error" : undefined}
          defaultChecked={values.consent === "on"}
        />
        {errors.consent && (
          <p id="quote-consent-error" className="ml-8 font-medium text-corail-fonce text-caption">
            {error("consent")}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="submit"
          loading={pending}
          size="lg"
          icon={<Icon name="send" />}
          className="w-full shadow-[0_0_32px_rgba(166,242,107,0.45)] sm:w-auto"
        >
          {pending ? t("submitting") : t("submit")}
        </Button>
        <p className="text-[13px] leading-5 text-ardoise">
          {at > 0 ? (
            <>
              {direct.slice(0, at)}
              <a
                href={`mailto:${direct.slice(at)}`}
                className="font-semibold text-sapin hover:underline"
              >
                {direct.slice(at)}
              </a>
            </>
          ) : (
            direct
          )}
        </p>
      </div>
    </form>
  );
}
