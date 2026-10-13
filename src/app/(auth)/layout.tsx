import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand";
import { pickMessages } from "@/i18n/client-messages";

/** Sign-in and sign-up screens: a focused page without the site navigation. */
export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const t = await getTranslations("auth.layout");
  const messages = await getMessages();
  return (
    <div className="flex min-h-dvh flex-col bg-creme lg:flex-row">
      <aside className="flex items-center justify-between gap-4 bg-sapin px-4 py-4 text-blanc lg:w-[38%] lg:flex-col lg:items-start lg:justify-between lg:p-10">
        <Link href="/" aria-label={t("backHome")}>
          <Logo variant="negative" height={28} />
        </Link>
        <div className="hidden flex-col gap-3 lg:flex">
          <p className="text-display text-lime">{t("tagline")}</p>
          <p className="text-blanc/80">{t("signature")}</p>
        </div>
        <Link href="/" className="text-sm text-blanc/85 underline lg:no-underline">
          {t("backHome")}
        </Link>
      </aside>
      <main
        id="content"
        className="flex flex-1 justify-center page-x py-8 lg:items-center lg:py-12"
      >
        <div className="w-full max-w-xl">
          <NextIntlClientProvider
            messages={pickMessages(messages, [
              "auth",
              "login",
              "signup",
              "forgot",
              "reset",
              "common",
              "checkout",
            ])}
          >
            {children}
          </NextIntlClientProvider>
        </div>
      </main>
    </div>
  );
}
