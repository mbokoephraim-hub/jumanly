import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { ContentBanners } from "@/components/site/content-banners";
import { CookieConsent } from "@/components/site/cookie-consent";
import { pickMessages } from "@/i18n/client-messages";

/** Public site layout, available without an account. */
export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const t = await getTranslations("nav");
  const messages = await getMessages();
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#content"
        className="sr-only z-50 rounded-md bg-lime px-4 py-2 font-medium text-sapin focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t("skipToContent")}
      </a>
      <ContentBanners audience="all" />
      <PublicHeader />
      <main id="content" className="flex-1">
        {children}
      </main>
      <PublicFooter />
      <NextIntlClientProvider messages={pickMessages(messages, ["cookies", "a11y", "common"])}>
        <CookieConsent />
      </NextIntlClientProvider>
    </div>
  );
}
