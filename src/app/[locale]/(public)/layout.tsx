import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { ContentBanners } from "@/components/site/content-banners";
import { CookieConsent } from "@/components/site/cookie-consent";
import { notFound } from "next/navigation";
import { pickMessages } from "@/i18n/client-messages";
import { applySiteLocale, isSiteLocale, siteLocales } from "@/i18n/site-locale";

/** Both languages of the public site are rendered at build time. */
export function generateStaticParams() {
  return siteLocales.map((locale) => ({ locale }));
}

/** Public site layout, available without an account, in French or English. */
export default async function PublicLayout({ children, params }: LayoutProps<"/[locale]">) {
  // Any other first segment is an unknown address (`/n-importe-quoi`).
  if (!isSiteLocale((await params).locale)) notFound();
  const locale = await applySiteLocale(params);
  const t = await getTranslations("nav");
  const messages = await getMessages();
  return (
    <div lang={locale} className="flex min-h-dvh flex-col bg-papier">
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
      <NextIntlClientProvider
        locale={locale}
        messages={pickMessages(messages, ["cookies", "a11y", "common"])}
      >
        <CookieConsent />
      </NextIntlClientProvider>
    </div>
  );
}
