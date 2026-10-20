import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { BrandIdentity } from "@/components/hire/brand-identity";
import { FlowHead } from "@/components/talent/flow-head";
import { Notice } from "@/components/talent/notice";
import { countryOptions } from "@/config/countries";
import { updateOrganizationAction } from "@/server/actions/organization";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { organizationCategories } from "@/server/services/organization";
import { organizationSizes } from "@/server/services/recruiter-account";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("org");
  return { title: t("profile.title"), robots: { index: false } };
}

/**
 * The page of the organization, changed by its administrators (planche recruteur-3 `ORG_P`,
 * « modifier »): the banner and the logo shown on every offer, then the name, the kind, the
 * presentation, the place, the sector, the size and the contact e-mail.
 */
export default async function OrganizationEditPage({
  searchParams,
}: PageProps<"/app/organisation/modifier">) {
  const params = await searchParams;
  const { ctx } = await requireHire("/app/organisation/modifier", "administer");
  const t = await getTranslations("org");
  const tr = await getTranslations("rhOrg");
  const tw = await getTranslations("hireWelcome.org");
  const messages = await getMessages();
  const organization = await db.organization.findUniqueOrThrow({
    where: { id: ctx.organizationId },
  });
  const size = organization.size ?? "";
  const sizes: string[] = [...organizationSizes];

  const text = (
    name: "name" | "legalName" | "city" | "sector" | "website" | "contactEmail",
    label: string,
    options: { required?: boolean; type?: string; max: number; hint?: string; auto?: string },
  ) => (
    <div className="t-champ">
      <label htmlFor={`r5-org-${name}`}>{label}</label>
      <span className="t-verre t-saisie">
        <input
          id={`r5-org-${name}`}
          name={name}
          type={options.type ?? "text"}
          required={options.required}
          minLength={options.required ? 2 : undefined}
          maxLength={options.max}
          autoComplete={options.auto}
          defaultValue={organization[name] ?? ""}
          aria-describedby={options.hint ? `r5-org-${name}-h` : undefined}
        />
      </span>
      {options.hint && (
        <p id={`r5-org-${name}-h`} className="t-aide">
          {options.hint}
        </p>
      )}
    </div>
  );

  return (
    <div className="t-flux t-od-bas">
      <FlowHead back="/app/organisation" backLabel={tr("editBack")} title={t("profile.title")} />
      {params.erreur && <Notice tone="err">{t("profile.invalid")}</Notice>}

      <NextIntlClientProvider
        messages={{
          hire: { jobForm: { brand: messages.hire.jobForm.brand } },
          a11y: { avatar: messages.a11y.avatar },
        }}
      >
        <BrandIdentity
          org={organization.name}
          brand={{ banner: organization.banner, logo: organization.logo, canEdit: true }}
        />
      </NextIntlClientProvider>

      <form id="r5-org" action={updateOrganizationAction} className="t-flux">
        {text("name", t("profile.name"), { required: true, max: 120, auto: "organization" })}
        {text("legalName", t("profile.legalName"), { max: 160, hint: t("profile.legalNameHint") })}
        <div className="t-champ">
          <label htmlFor="r5-org-category">{t("profile.category.text")}</label>
          <span className="t-verre t-saisie">
            <select id="r5-org-category" name="category" defaultValue={organization.category ?? ""}>
              <option value="">{t("profile.category.none")}</option>
              {organizationCategories.map((category) => (
                <option key={category} value={category}>
                  {t(`profile.category.${category}`)}
                </option>
              ))}
            </select>
          </span>
        </div>
        <div className="t-champ">
          <label htmlFor="r5-org-description">{t("profile.description.text")}</label>
          <textarea
            id="r5-org-description"
            name="description"
            rows={5}
            maxLength={3000}
            defaultValue={organization.description ?? ""}
            placeholder={t("profile.description.placeholder")}
            className="t-verre t-zone"
          />
        </div>
        <div className="t-champ">
          <label htmlFor="r5-org-country">{t("profile.country")}</label>
          <span className="t-verre t-saisie">
            <select id="r5-org-country" name="country" defaultValue={organization.country ?? ""}>
              <option value="">{tw("countryNone")}</option>
              {countryOptions("code").map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </span>
        </div>
        {text("city", t("profile.city"), { max: 120, auto: "address-level2" })}
        {text("sector", t("profile.sector"), { max: 120 })}
        <div className="t-champ">
          <label htmlFor="r5-org-size">{t("profile.size.text")}</label>
          <span className="t-verre t-saisie">
            <select id="r5-org-size" name="size" defaultValue={size}>
              <option value="">{tw("sizeNone")}</option>
              {size && !sizes.includes(size) && <option value={size}>{size}</option>}
              {organizationSizes.map((value, index) => (
                <option key={value} value={value}>
                  {tw(`sizes.s${index + 1}` as "sizes.s1")}
                </option>
              ))}
            </select>
          </span>
        </div>
        {text("website", t("profile.website.text"), { type: "url", max: 200, auto: "url" })}
        {text("contactEmail", t("profile.contactEmail"), {
          type: "email",
          max: 200,
          auto: "email",
        })}
      </form>
      <div className="t-verre t-fort t-bas-f">
        <button type="submit" form="r5-org" className="t-bt t-p t-pl t-press">
          {t("profile.save")}
        </button>
      </div>
    </div>
  );
}
