"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/brand/icon";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { cx } from "@/lib/cx";
import { joinWaitlistAction, type WaitlistFormState } from "@/server/actions/waitlist";
import { waitlistProfiles } from "@/server/services/waitlist-profiles";

const profileIcons: Record<(typeof waitlistProfiles)[number], IconName> = {
  talent: "profil",
  recruiter: "jobs",
  company: "entreprise",
  partner: "certificat",
};

/** /liste-attente form. Works with plain HTML submission too: the server action reads the form. */
export function WaitlistForm({
  initialProfile,
  countries,
}: {
  initialProfile?: string;
  countries: { value: string; label: string }[];
}) {
  const t = useTranslations("waitlist");
  const [state, action, pending] = useActionState<WaitlistFormState, FormData>(joinWaitlistAction, {
    status: "idle",
  });
  const values =
    state.status === "invalid" || state.status === "rateLimited" || state.status === "failed"
      ? state.values
      : {};
  const [profile, setProfile] = useState<string>(values.profile ?? initialProfile ?? "talent");
  const errors = state.status === "invalid" ? state.errors : {};
  const error = (field: string) => (errors[field] ? t(`form.error.${errors[field]}`) : undefined);

  if (state.status === "joined") {
    return (
      <div
        role="status"
        className="jm-waitlist-done relative flex flex-col items-start gap-5 overflow-hidden rounded-[28px] bg-blanc p-6 lg:rounded-[32px] lg:p-10"
      >
        <span
          aria-hidden
          className="jm-waitlist-burst grid size-16 place-items-center rounded-full bg-lime text-sapin"
        >
          <Icon name="check" className="size-8" />
        </span>
        <h2 className="text-[26px] leading-8 font-semibold tracking-[-0.02em] lg:text-[32px] lg:leading-[38px]">
          {state.firstName
            ? t("success.title", { firstName: state.firstName })
            : t("success.titleNoName")}
        </h2>
        <p className="max-w-[520px] text-[15px] leading-6 text-ardoise">
          {state.already
            ? t("success.already", { email: state.email })
            : state.mailed
              ? t("success.text", { email: state.email })
              : t("success.noMail", { email: state.email })}
        </p>
        <ButtonLink href="/" variant="secondary">
          {t("success.cta")}
        </ButtonLink>
      </div>
    );
  }

  const withOrganization = profile !== "talent";
  return (
    <form
      action={action}
      noValidate
      className="flex flex-col gap-6 rounded-[28px] bg-blanc p-6 lg:rounded-[32px] lg:p-10"
    >
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl leading-[30px] font-semibold tracking-[-0.015em]">
          {t("form.title")}
        </h2>
        <p className="text-sm leading-5 text-ardoise">{t("form.text")}</p>
      </div>
      {state.status === "rateLimited" && <Alert tone="error" title={t("form.error.rateLimit")} />}
      {state.status === "failed" && <Alert tone="error" title={t("form.error.failed")} />}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-semibold">{t("form.profile.legend")}</legend>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {waitlistProfiles.map((value) => (
            <label key={value} className="relative cursor-pointer">
              <input
                type="radio"
                name="profile"
                value={value}
                checked={profile === value}
                onChange={() => setProfile(value)}
                className="peer sr-only"
              />
              <span
                className={cx(
                  "flex h-full flex-col gap-2 rounded-[20px] p-3.5 ring-[1.5px] ring-brume transition-all ring-inset",
                  "peer-checked:bg-lime-clair peer-checked:ring-lime peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lime",
                  "hover:ring-ardoise",
                )}
              >
                <span
                  aria-hidden
                  className={cx(
                    "grid size-9 place-items-center rounded-full transition-colors",
                    profile === value ? "bg-lime text-sapin" : "bg-gris-clair text-feuille-fonce",
                  )}
                >
                  <Icon name={profileIcons[value]} className="size-[18px]" />
                </span>
                <span className="text-[14.5px] leading-5 font-semibold">
                  {t(`form.profile.${value}.label`)}
                </span>
                <span className="text-xs leading-[17px] text-ardoise">
                  {t(`form.profile.${value}.text`)}
                </span>
              </span>
            </label>
          ))}
        </div>
        {errors.profile && (
          <p className="font-medium text-corail-fonce text-caption">{error("profile")}</p>
        )}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="waitlist-first-name"
          name="firstName"
          autoComplete="given-name"
          label={t("form.firstName.label")}
          required
          defaultValue={values.firstName}
          error={error("firstName")}
        />
        <TextField
          id="waitlist-last-name"
          name="lastName"
          autoComplete="family-name"
          label={t("form.lastName.label")}
          defaultValue={values.lastName}
          error={error("lastName")}
        />
        <div className="sm:col-span-2">
          <TextField
            id="waitlist-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            label={t("form.email.label")}
            placeholder={t("form.email.placeholder")}
            hint={t("form.email.help")}
            required
            defaultValue={values.email}
            error={error("email")}
          />
        </div>
        <Select
          id="waitlist-country"
          name="country"
          label={t("form.country.label")}
          placeholder={t("form.country.placeholder")}
          required
          defaultValue={values.country ?? ""}
          options={countries}
          error={error("country")}
        />
        <TextField
          id="waitlist-city"
          name="city"
          autoComplete="address-level2"
          label={t("form.city.label")}
          defaultValue={values.city}
          error={error("city")}
        />
        {withOrganization && (
          <TextField
            id="waitlist-organization"
            name="organization"
            autoComplete="organization"
            label={t(profile === "partner" ? "form.institution.label" : "form.organization.label")}
            defaultValue={values.organization}
            error={error("organization")}
          />
        )}
      </div>

      {/* Left empty by people; robots that fill every field are ignored. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="waitlist-website">{t("form.honeypot")}</label>
        <input id="waitlist-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-1">
        <Checkbox
          id="waitlist-consent"
          name="consent"
          label={t("form.consent")}
          aria-invalid={errors.consent ? true : undefined}
          defaultChecked={values.consent === "on"}
        />
        <Link href="/confidentialite" className="ml-8 text-sm underline">
          {t("form.privacyLink")}
        </Link>
        {errors.consent && (
          <p className="ml-8 font-medium text-corail-fonce text-caption">{error("consent")}</p>
        )}
      </div>
      <div>
        <Button
          type="submit"
          variant="primary"
          loading={pending}
          size="lg"
          iconAfter={<Icon name="send" />}
          className="max-sm:w-full"
        >
          {pending ? t("form.pending") : t("form.submit")}
        </Button>
      </div>
    </form>
  );
}
