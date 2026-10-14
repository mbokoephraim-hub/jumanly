import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Character } from "@/components/brand";
import { ButtonLink } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("system.offline.page");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

/**
 * Shown by the service worker (public/sw.js) when there is no connection and the page asked for
 * was never opened on this device. Kept in the cache at installation.
 */
export default async function OfflinePage() {
  const t = await getTranslations("system");
  return (
    <main id="content" className="flex min-h-dvh items-center bg-creme">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-5 page-x py-16 text-center">
        <Character name="kofi" pose="perplexe" height={200} />
        <h1 className="text-h1">{t("offline.page.title")}</h1>
        <p className="text-lg text-ardoise">{t("offline.page.body")}</p>
        <ButtonLink href="/app">{t("error.retry")}</ButtonLink>
      </div>
    </main>
  );
}
