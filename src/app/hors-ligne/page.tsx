import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Character, Logo } from "@/components/brand";
import { OfflineActions } from "@/components/site/offline-actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("system.offline.page");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

/**
 * Shown by the service worker (public/sw.js) when there is no connection and the page asked for
 * was never opened on this device (mockup 08-05, « Pas de connexion » card). Kept in the cache at
 * installation, so it carries no personal data; the offline banner comes from the root layout.
 */
export default async function OfflinePage() {
  const t = await getTranslations("system");
  return (
    <div className="flex min-h-dvh flex-col bg-creme text-sapin">
      <div className="px-4 py-5 lg:px-[120px] lg:py-9">
        <Logo height={30} />
      </div>
      <main
        id="content"
        className="mx-auto flex w-full max-w-[1248px] flex-1 items-start px-4 pt-14 pb-10 lg:items-center lg:px-6 lg:pt-10"
      >
        <div className="flex w-full flex-col items-center gap-3.5 rounded-[24px] bg-blanc px-5 py-8 text-center lg:p-14">
          <div className="[&_img]:h-[200px]! lg:[&_img]:h-[260px]!">
            <Character name="amani" pose="perplexe" height={260} />
          </div>
          <h1 className="text-app-h2">{t("offline.page.title")}</h1>
          <p className="max-w-[420px] text-xs leading-[17px] text-ardoise lg:text-[13px] lg:leading-5">
            {t("offline.page.body")}
          </p>
          <OfflineActions
            labels={{
              retry: t("error.retry"),
              dataSaver: t("offline.dataSaver"),
              dataSaverOn: t("offline.dataSaverOn"),
              dataSaverHint: t("offline.dataSaverHint"),
            }}
          />
        </div>
      </main>
    </div>
  );
}
