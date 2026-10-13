import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { getTranslations } from "next-intl/server";
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
    title: { default: t("home.seo.title"), template: `%s ${t("common.seo.titleSuffix")}` },
    description: t("home.seo.description"),
    applicationName: t("common.brand"),
  };
}

export const viewport: Viewport = {
  themeColor: "#0F3F37",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${sora.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
