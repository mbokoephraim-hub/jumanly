import type { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";

/** Web app manifest: Jumanly can be installed on a phone's home screen (partie 12, E11). */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations();
  return {
    name: t("common.brand"),
    short_name: t("common.brand"),
    description: t("home.seo.description"),
    lang: "fr",
    // Opens on the animated logo, then the space (src/lib/launch-splash.ts).
    start_url: "/demarrage",
    scope: "/",
    display: "standalone",
    // The cream of the talent space: no dark screen while the app starts.
    background_color: "#EEE8DE",
    theme_color: "#EEE8DE",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/marque/jumanly-favicon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/marque/jumanly-favicon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/marque/jumanly-favicon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
