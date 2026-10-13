"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { sendPartnerRequest, type ContactFormState } from "@/server/actions/contact";
import { MESSAGE_MAX, partnerPlans, partnerTypes } from "@/server/services/contact-rules";

/** Jumanly Partners request form (/partenaires#contact). */
export function PartnerForm({ countries }: { countries: { value: string; label: string }[] }) {
  const t = useTranslations("partners.contact");
  const c = useTranslations("contact.form");
  const [state, action, pending] = useActionState<ContactFormState, FormData>(sendPartnerRequest, {
    status: "idle",
  });
  const values =
    state.status === "invalid" || state.status === "rateLimited" || state.status === "failed"
      ? state.values
      : {};
  const errors = state.status === "invalid" ? state.errors : {};
  const error = (field: string) => {
    const code = errors[field];
    if (!code) return undefined;
    if (code === "email" || code === "number" || code === "consent" || code === "required")
      return t(`form.error.${code}`);
    return code === "messageLong"
      ? c("error.messageLong", { max: MESSAGE_MAX })
      : t("form.error.required");
  };

  if (state.status === "sent") {
    return (
      <div className="flex flex-col gap-3 rounded-card bg-blanc p-6 text-sapin" role="status">
        <h3 className="text-h2">{t("success.title")}</h3>
        <p className="text-[15px] leading-6">{t("success.text", { email: state.email })}</p>
      </div>
    );
  }

  return (
    <form
      action={action}
      noValidate
      className="flex flex-col gap-5 rounded-card bg-blanc p-6 text-sapin"
    >
      {(state.status === "failed" || state.status === "rateLimited") && (
        <Alert tone="error" title={state.status === "failed" ? t("error") : c("error.rateLimit")} />
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="partner-org"
          name="organization"
          autoComplete="organization"
          label={t("form.org.label")}
          placeholder={t("form.org.placeholder")}
          required
          defaultValue={values.organization}
          error={error("organization")}
        />
        <Select
          id="partner-type"
          name="type"
          label={t("form.type.label")}
          placeholder={t("form.type.placeholder")}
          required
          defaultValue={values.type ?? ""}
          error={error("type")}
          options={partnerTypes.map((value) => ({ value, label: t(`form.type.${value}`) }))}
        />
        <TextField
          id="partner-name"
          name="name"
          autoComplete="name"
          label={t("form.name.label")}
          placeholder={t("form.name.placeholder")}
          required
          defaultValue={values.name}
          error={error("name")}
        />
        <TextField
          id="partner-role"
          name="role"
          autoComplete="organization-title"
          label={t("form.role.label")}
          placeholder={t("form.role.placeholder")}
          defaultValue={values.role}
        />
        <TextField
          id="partner-email"
          name="email"
          type="email"
          autoComplete="email"
          label={t("form.email.label")}
          placeholder={t("form.email.placeholder")}
          required
          defaultValue={values.email}
          error={error("email")}
        />
        <Select
          id="partner-country"
          name="country"
          label={t("form.country.label")}
          placeholder={t("form.country.placeholder")}
          defaultValue={values.country ?? ""}
          options={countries}
        />
        <TextField
          id="partner-beneficiaries"
          name="beneficiaries"
          inputMode="numeric"
          label={t("form.beneficiaries.label")}
          placeholder={t("form.beneficiaries.placeholder")}
          hint={t("form.beneficiaries.help")}
          defaultValue={values.beneficiaries}
          error={error("beneficiaries")}
        />
        <Select
          id="partner-plan"
          name="plan"
          label={t("form.plan.label")}
          defaultValue={values.plan ?? "unsure"}
          options={partnerPlans.map((value) => ({ value, label: t(`form.plan.${value}`) }))}
        />
        <TextField
          id="partner-duration"
          name="duration"
          label={t("form.duration.label")}
          placeholder={t("form.duration.placeholder")}
          defaultValue={values.duration}
        />
      </div>
      <TextArea
        id="partner-message"
        name="message"
        rows={5}
        maxLength={MESSAGE_MAX}
        label={t("form.message.label")}
        placeholder={t("form.message.placeholder")}
        defaultValue={values.message}
        error={error("message")}
      />
      <div className="flex flex-col gap-1">
        <Checkbox
          id="partner-consent"
          name="consent"
          label={t("form.consent")}
          aria-invalid={errors.consent ? true : undefined}
          defaultChecked={values.consent === "on"}
        />
        <Link href="/confidentialite" className="ml-8 text-sm underline">
          {c("consentLink")}
        </Link>
        {errors.consent && (
          <p className="ml-8 font-medium text-corail-fonce text-caption">{error("consent")}</p>
        )}
      </div>
      <div>
        <Button type="submit" loading={pending} size="lg">
          {pending ? t("form.sending") : t("form.submit")}
        </Button>
      </div>
    </form>
  );
}
