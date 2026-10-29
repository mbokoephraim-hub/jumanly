import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import messages from "../../messages/fr.json";
import { NavigationFeedback } from "@/components/motion/navigation-feedback";
import { ServiceWorker } from "@/components/site/service-worker";
import { installScript } from "@/lib/install-prompt";
import { launchScript } from "@/lib/launch-splash";
import { siteUrl } from "@/lib/seo";
import { RootIntlProvider } from "@/i18n/root-provider";
import "./globals.css";

// Sora (SIL OFL) is self-hosted: no request to an external font service.
const sora = localFont({
  src: "../../node_modules/@fontsource-variable/sora/files/sora-latin-wght-normal.woff2",
  weight: "100 800",
  variable: "--font-sora",
  display: "swap",
});

// The root layout reads its few texts straight from the French file, without next-intl: the
// language of a public page is set by that page (src/i18n/site-locale.ts), after this layout.
const { common, home, loading, system } = messages;

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: home.seo.title, template: `%s ${common.seo.titleSuffix}` },
    description: home.seo.description,
    applicationName: common.brand,
    // Installed on an iPhone: the status bar is drawn over the app's own background.
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: common.brand },
  };
}

export const viewport: Viewport = {
  themeColor: "#0F3F37",
  // The page runs under the status bar and the home indicator of the phone: the background covers
  // the whole screen, each fixed bar keeps clear of them with env(safe-area-inset-*).
  viewportFit: "cover",
  // The keyboard shrinks the page instead of covering it: a conversation keeps its head (the
  // person's name) at the top and its writing bar just above the keys (Ephraïm, 29/10/2026).
  interactiveWidget: "resizes-content",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Only the texts of the connection notices go to every page (the 500 page has its own file).
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
        {/* Opening of the installed app: drawn before the first paint (src/lib/launch-splash.ts). */}
        <script dangerouslySetInnerHTML={{ __html: launchScript(common.brand) }} />
        {/* « Installer l'appli »: keeps the browser's offer before React mounts (src/lib/install-prompt.ts). */}
        <script dangerouslySetInnerHTML={{ __html: installScript }} />
        <RootIntlProvider locale="fr" messages={texts} timeZone="UTC">
          <NavigationFeedback label={loading.aria} />
          {children}
          <ServiceWorker enabled={process.env.NODE_ENV === "production"} />
        </RootIntlProvider>
      </body>
    </html>
  );
}
