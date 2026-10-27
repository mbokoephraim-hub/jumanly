import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import {
  PhoneCompanyProfile,
  type PhoneCompanyProfileData,
} from "@/components/phone/recruteur/entreprise-profil";
import { pickMessages } from "@/i18n/client-messages";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { signupSizes } from "@/server/services/admin-signup";
import { isOrgAdmin } from "@/server/services/hire-phone-account";
import { companyPageScreen } from "@/server/services/org-page";
import { isPhone } from "@/server/view";

const PAGE = "/app/hire/entreprise/profil";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneRhEntreprise");
  return { title: t("title"), robots: { index: false } };
}

/**
 * « Modifier le profil de l'entreprise » on the recruiter's phone (Ephraïm, 27/10/2026): the
 * banner, the logo and the fields of Page entreprise, for its administrators. A computer keeps
 * Page entreprise (`/app/organisation`).
 */
export default async function Page() {
  const { ctx } = await requireHire(PAGE);
  if (!isOrgAdmin(ctx.role)) redirect("/app/hire/compte");
  if (!(await isPhone())) redirect("/app/organisation");
  const [screen, messages, ts] = await Promise.all([
    companyPageScreen(db, ctx),
    getMessages(),
    getTranslations("adminSignup.company"),
  ]);
  const { org } = screen;
  const sizes: { value: string; label: string }[] = Object.entries(signupSizes).map(
    ([key, value]) => ({
      value,
      label: ts(`sizesLong.${key as keyof typeof signupSizes}`),
    }),
  );
  // A size written by an older screen stays selectable as it is.
  if (org.size && !sizes.some((size) => size.value === org.size))
    sizes.push({ value: org.size, label: org.size });
  const data: PhoneCompanyProfileData = {
    slug: org.slug,
    name: org.name,
    logo: org.logo,
    banner: org.banner,
    sector: org.sector ?? "",
    size: org.size ?? "",
    city: org.city ?? "",
    website: org.website ?? "",
    description: org.description ?? "",
    hiringNow: org.hiringNow,
    verified: Boolean(org.verifiedAt),
    sizes,
  };
  return (
    <NextIntlClientProvider messages={pickMessages(messages, ["orgPage", "phoneRhEntreprise"])}>
      <PhoneCompanyProfile data={data} />
    </NextIntlClientProvider>
  );
}
