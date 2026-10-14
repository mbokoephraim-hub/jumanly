import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { siteUrl } from "@/lib/seo";
import "./globals.css";

// Sora (SIL OFL) is self-hosted: no request to an external font service.
const sora = localFont({
  src: "../../node_modules/@fontsource-variable/sora/files/sora-latin-wght-normal.woff2",
  weight: "100 800",
  variable: "--font-sora",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: t("home.seo.title"), template: `%s ${t("common.seo.titleSuffix")}` },
    description: t("home.seo.description"),
    applicationName: t("common.brand"),
  };
}

export const viewport: Viewport = {
  themeColor: "#0F3F37",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Only the error page texts go to the browser: the error page is the one client screen that
  // cannot receive its texts from the server.
  const { system } = await getMessages();
  const errorTexts = {
    system: { 500: system["500"], error: { reference: system.error.reference } },
  };
  return (
    <html lang="fr" className={`${sora.variable} antialiased`}>
      <body className="min-h-dvh">
        <NextIntlClientProvider messages={errorTexts}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
