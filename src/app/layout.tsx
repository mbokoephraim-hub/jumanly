import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import "./globals.css";

// Sora (licence SIL OFL), servie depuis le site : aucune requête vers un service externe.
const sora = localFont({
  src: "../../node_modules/@fontsource-variable/sora/files/sora-latin-wght-normal.woff2",
  weight: "100 800",
  variable: "--font-sora",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: { default: t("titre"), template: t("modeleTitre") },
    description: t("description"),
    applicationName: t("nomApplication"),
  };
}

export const viewport: Viewport = {
  themeColor: "#0F3F37",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${sora.variable} antialiased`}>
      <body className="min-h-dvh">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
