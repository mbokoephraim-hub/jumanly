import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { ServiceWorker } from "@/components/site/service-worker";
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
  // Only the texts of the connection notices go to every page (the 500 page has its own file).
  const { system } = await getMessages();
  const texts = {
    system: {
      error: { retry: system.error.retry },
      offline: {
        banner: system.offline.banner,
        back: system.offline.back,
        slow: system.offline.slow,
      },
    },
  };
  return (
    <html lang="fr" className={`${sora.variable} antialiased`}>
      <body className="min-h-dvh">
        <NextIntlClientProvider messages={texts}>
          {children}
          <ServiceWorker enabled={process.env.NODE_ENV === "production"} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
