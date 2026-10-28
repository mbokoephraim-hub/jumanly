import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { SettingsScreen, type SettingsData } from "@/components/entreprise/settings";
import { pickMessages } from "@/i18n/client-messages";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { recruitingSettings } from "@/server/services/org-settings";

const PAGE = "/app/organisation/reglages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orgSettings");
  return { title: t("title"), robots: { index: false } };
}

const tabs = ["etapes", "modeles", "grille"] as const;

/**
 * Réglages du recrutement (étape 3, A5, captures 085 à 087), for the owner and the administrators
 * only: a recruiter, a manager or a viewer gets « page introuvable ». Under 768 px the layout of
 * `/app/organisation` shows « À ouvrir sur un ordinateur ».
 */
export default async function SettingsPage({
  searchParams,
}: PageProps<"/app/organisation/reglages">) {
  const query = await searchParams;
  const { ctx } = await requireHire(PAGE, "administer");
  const [settings, messages] = await Promise.all([recruitingSettings(db, ctx), getMessages()]);
  const wanted = typeof query.onglet === "string" ? query.onglet : "";
  const initialTab = (tabs as readonly string[]).includes(wanted)
    ? (wanted as (typeof tabs)[number])
    : "etapes";
  const data: SettingsData = settings;
  return (
    <NextIntlClientProvider messages={pickMessages(messages, ["orgSettings"])}>
      <SettingsScreen data={data} initialTab={initialTab} />
    </NextIntlClientProvider>
  );
}
