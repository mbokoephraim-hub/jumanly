import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { CompanyPageEditor, type CompanyPageData } from "@/components/entreprise/company-page";
import { pickMessages } from "@/i18n/client-messages";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { signupSizes } from "@/server/services/admin-signup";
import { companyPageScreen } from "@/server/services/org-page";
import { organizationSizes } from "@/server/services/recruiter-account";

const PAGE = "/app/organisation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orgPage");
  return { title: t("title"), robots: { index: false } };
}

/** The tabs of the page before the redesign, now pages of their own (old links, e-mails). */
const oldTabs: Record<string, string> = {
  profil: "/app/organisation",
  verification: "/app/organisation/verification",
  membres: "/app/organisation/equipe",
  equipes: "/app/organisation/structure?onglet=equipes",
  departements: "/app/organisation/structure?onglet=departements",
  entites: "/app/organisation/structure?onglet=entites",
};

/**
 * Page entreprise (étape 3, A3, capture 081), for the owner and the administrators only: a
 * recruiter, a manager or a viewer gets « page introuvable ». Under 768 px the layout of
 * `/app/organisation` shows « À ouvrir sur un ordinateur ».
 */
export default async function CompanyPage({ searchParams }: PageProps<"/app/organisation">) {
  const params = await searchParams;
  const old = typeof params.onglet === "string" ? oldTabs[params.onglet] : undefined;
  if (old && old !== PAGE) redirect(old);
  const { ctx } = await requireHire(PAGE, "administer");
  const [screen, messages, t, ts, tw] = await Promise.all([
    companyPageScreen(db, ctx),
    getMessages(),
    getTranslations("hire.jobForm.brand"),
    getTranslations("adminSignup.company"),
    getTranslations("hireWelcome.org"),
  ]);
  const { org } = screen;
  const sizes: CompanyPageData["sizes"] = Object.entries(signupSizes).map(([key, value]) => ({
    value,
    label: ts(`sizesLong.${key as keyof typeof signupSizes}`),
  }));
  // A size written by an older screen stays selectable as it is.
  const index = (organizationSizes as readonly string[]).indexOf(org.size ?? "");
  if (org.size && !sizes.some((size) => size.value === org.size))
    sizes.push({
      value: org.size,
      label: index >= 0 ? tw(`sizes.s${index + 1}` as "sizes.s1") : org.size,
    });
  const data: CompanyPageData = {
    org: {
      name: org.name,
      logo: org.logo,
      banner: org.banner,
      bannerTheme: org.bannerTheme,
      sector: org.sector ?? "",
      size: org.size ?? "",
      city: org.city ?? "",
      website: org.website ?? "",
      description: org.description ?? "",
      hiringNow: org.hiringNow,
      verification: org.verificationStatus,
    },
    line: [org.sector, org.city].filter(Boolean).join(" · "),
    sizes,
    pending: screen.pending,
    confirmed: screen.confirmed,
    transferTo: screen.transferTo,
    brand: {
      banner: t("editBanner"),
      logo: t("editLogo"),
      bannerHint: t("bannerHint"),
      logoHint: t("logoHint"),
      choose: t("editor.choose"),
      empty: t("editor.empty"),
      cancel: t("editor.cancel"),
      save: t("editor.save"),
      removeBanner: t("editor.removeBanner"),
      removeLogo: t("editor.removeLogo"),
      error: t("editor.error"),
    },
  };
  return (
    <NextIntlClientProvider messages={pickMessages(messages, ["orgPage"])}>
      <CompanyPageEditor data={data} />
    </NextIntlClientProvider>
  );
}
