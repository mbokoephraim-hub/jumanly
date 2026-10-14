"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/brand/icon";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { sendContactMessage, type ContactFormState } from "@/server/actions/contact";
import { contactSubjects, MESSAGE_MAX, type ContactSubject } from "@/server/services/contact-rules";

/** /contact form. Works with plain HTML submission too: the server action receives the form data. */
export function ContactForm({
  initialSubject,
  countries,
}: {
  initialSubject?: ContactSubject;
  countries: { value: string; label: string }[];
}) {
  const t = useTranslations("contact");
  const [state, action, pending] = useActionState<ContactFormState, FormData>(sendContactMessage, {
    status: "idle",
  });
  const values =
    state.status === "invalid" || state.status === "rateLimited" || state.status === "failed"
      ? state.values
      : {};
  const [subject, setSubject] = useState<string>(values.subject ?? initialSubject ?? "");
  const [length, setLength] = useState((values.message ?? "").length);
  const errors = state.status === "invalid" ? state.errors : {};
  const error = (field: string) => {
    const code = errors[field];
    if (!code) return undefined;
    return code === "messageLong"
      ? t("form.error.messageLong", { max: MESSAGE_MAX })
      : t(`form.error.${code === "number" ? "required" : code}`);
  };

  if (state.status === "sent") {
    return (
      <div
        className="flex flex-col items-start gap-4 rounded-card bg-blanc p-6 shadow-[0_30px_60px_rgba(11,26,31,0.12)] lg:rounded-[32px] lg:p-10"
        role="status"
      >
        <h2 className="text-2xl leading-[30px] font-semibold tracking-[-0.015em]">
          {t("success.title")}
        </h2>
        <p className="text-[15px] leading-6">{t("success.text", { email: state.email })}</p>
        <ButtonLink href="/" variant="secondary">
          {t("success.cta")}
        </ButtonLink>
      </div>
    );
  }

  const isQuote = subject === "quote";
  return (
    <form
      action={action}
      noValidate
      className="flex flex-col gap-5 rounded-card bg-blanc p-6 shadow-[0_30px_60px_rgba(11,26,31,0.12)] lg:rounded-[32px] lg:p-10"
    >
      <h2 className="text-2xl leading-[30px] font-semibold tracking-[-0.015em]">
        {t("form.title")}
      </h2>
      {state.status === "rateLimited" && <Alert tone="error" title={t("form.error.rateLimit")} />}
      {state.status === "failed" && <Alert tone="error" title={t("form.error.send")} />}
      <Select
        id="contact-subject"
        name="subject"
        label={t("form.subject.label")}
        required
        placeholder={t("form.subject.placeholder")}
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
        error={error("subject")}
        options={contactSubjects.map((value) => ({ value, label: t(`form.subject.${value}`) }))}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="contact-name"
          name="name"
          autoComplete="name"
          label={t("form.name.label")}
          placeholder={t("form.name.placeholder")}
          required
          defaultValue={values.name}
          error={error("name")}
        />
        <TextField
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          label={t("form.email.label")}
          placeholder={t("form.email.placeholder")}
          hint={t("form.email.help")}
          required
          defaultValue={values.email}
          error={error("email")}
        />
        <TextField
          id="contact-organization"
          name="organization"
          autoComplete="organization"
          label={t("form.organization.label")}
          placeholder={t("form.organization.placeholder")}
          hint={isQuote ? undefined : t("form.organization.help")}
          required={isQuote}
          defaultValue={values.organization}
          error={error("organization")}
        />
        <Select
          id="contact-country"
          name="country"
          label={t("form.country.label")}
          placeholder={t("form.country.placeholder")}
          defaultValue={values.country ?? ""}
          options={countries}
        />
        {isQuote && (
          <>
            <TextField
              id="contact-users"
              name="users"
              inputMode="numeric"
              label={t("form.quote.users.label")}
              placeholder={t("form.quote.users.placeholder")}
              defaultValue={values.users}
              error={error("users")}
            />
            <TextField
              id="contact-entities"
              name="entities"
              inputMode="numeric"
              label={t("form.quote.entities.label")}
              placeholder={t("form.quote.entities.placeholder")}
              defaultValue={values.entities}
              error={error("entities")}
            />
          </>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <TextArea
          id="contact-message"
          name="message"
          rows={6}
          maxLength={MESSAGE_MAX}
          label={t("form.message.label")}
          placeholder={t("form.message.placeholder")}
          required
          defaultValue={values.message}
          onChange={(event) => setLength(event.target.value.length)}
          error={error("message")}
        />
        <p className="self-end text-ardoise text-caption" aria-live="polite">
          {t("form.message.counter", { count: length, max: MESSAGE_MAX })}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <Checkbox
          id="contact-consent"
          name="consent"
          label={t("form.consent")}
          aria-invalid={errors.consent ? true : undefined}
          defaultChecked={values.consent === "on"}
        />
        <Link href="/confidentialite" className="ml-8 text-sm underline">
          {t("form.consentLink")}
        </Link>
        {errors.consent && (
          <p className="ml-8 font-medium text-corail-fonce text-caption">{error("consent")}</p>
        )}
      </div>
      <div>
        <Button
          type="submit"
          variant="secondary"
          loading={pending}
          size="lg"
          iconAfter={<Icon name="send" />}
        >
          {pending ? t("form.sending") : t("form.submit")}
        </Button>
      </div>
    </form>
  );
}
