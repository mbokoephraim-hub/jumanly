import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { securityHeaders } from "./src/lib/security-headers";
import { publicSiteRewrites, siteLocales } from "./src/i18n/site-routes";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Préchargement complet (22/10/2026) : une page chargée d'avance par le téléphone
  // (src/components/phone/preload.tsx) arrive avec ses données, un toucher l'ouvre sans attendre.
  // Le préchargement partiel ne chargeait que la coquille : il reste désactivé.
  partialPrefetching: false,
  // Pas d'en-tête « X-Powered-By » : on n'expose pas la technologie utilisée.
  poweredByHeader: false,
  // Justificatifs de vérification (Admin v2, étape 4) : 4 Mo par envoi, sous la limite de 4,5 Mo
  // d'une requête sur Vercel. Une page chargée d'avance sert 30 s au plus, pour ne pas montrer
  // de données anciennes.
  experimental: { serverActions: { bodySizeLimit: "4.2mb" }, staleTimes: { static: 30 } },
  // Export PDF des CV par Chromium (docs/modeles-cv § 6.3) : ces paquets restent hors du bundle.
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium", "playwright-core"],
  // The CV export also carries the Sora files: when Chromium fails, the CV is drawn by react-pdf
  // (src/server/pdf/cv-simple.tsx, Ephraïm 31/10/2026).
  outputFileTracingIncludes: {
    "/api/cv/[documentId]/export": [
      "./node_modules/@sparticuz/chromium/bin/**",
      "./public/fonts/cv/Sora-*.ttf",
    ],
    // « Télécharger en PDF » of the phone and of the studio (Ephraïm, 29/10: it failed in
    // production because Chromium was not shipped with this route).
    "/app/career/cv/[id]/pdf": [
      "./node_modules/@sparticuz/chromium/bin/**",
      "./public/fonts/cv/Sora-*.ttf",
    ],
    "/app/jobs/candidatures/[id]/cv": [
      "./node_modules/@sparticuz/chromium/bin/**",
      "./public/fonts/cv/Sora-*.ttf",
    ],
    "/app/hire/candidats/[applicationId]/cv": [
      "./node_modules/@sparticuz/chromium/bin/**",
      "./public/fonts/cv/Sora-*.ttf",
    ],
    "/app/messages/[id]/document/[messageId]": [
      "./node_modules/@sparticuz/chromium/bin/**",
      "./public/fonts/cv/Sora-*.ttf",
    ],
    // Job sheet drawn by Jumanly (react-pdf, no browser): the Sora font and the logo it reads.
    "/api/offres/[slug]/fiche": [
      "./public/fonts/cv/Sora-*.ttf",
      "./public/marque/jumanly-logo-principal.svg",
    ],
    // Attestation (refonte mobile, lot 5): Chromium for the PDF and the image, the font and the
    // logo read by the drawing.
    "/app/learn/attestations/[id]/[format]": [
      "./node_modules/@sparticuz/chromium/bin/**",
      "./node_modules/@fontsource-variable/sora/files/sora-latin-wght-normal.woff2",
      "./public/marque/jumanly-logo-principal.svg",
    ],
  },
  // En-têtes de sécurité (partie 10 § 10.5). HSTS et « upgrade-insecure-requests » seulement en
  // production : en local, le site est servi en http.
  // Maintenance (mockup 08-04): with MAINTENANCE_MODE=1 at build time, every page shows
  // /maintenance; built files, pictures, course media and the scheduled tasks keep working.
  // Public site in French or English (src/i18n/site-routes.ts): same addresses, the language comes
  // from the visitor's choice, each language rendered statically.
  async rewrites() {
    if (process.env.MAINTENANCE_MODE !== "1") {
      return { beforeFiles: publicSiteRewrites(), afterFiles: [], fallback: [] };
    }
    return {
      beforeFiles: [
        { source: "/", destination: "/maintenance" },
        {
          source:
            "/:path((?!maintenance|_next|medias|marque|illustrations|fonts|icon\\.svg|apple-icon|sw\\.js|manifest|robots|api/jobs|api/webhooks).+)",
          destination: "/maintenance",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  // `/en/tarifs` or `/fr/tarifs`: the language is kept, then the usual address is shown.
  async redirects() {
    return siteLocales.flatMap((locale) => [
      { source: `/${locale}`, destination: `/langue?vers=${locale}&suite=/`, permanent: false },
      {
        source: `/${locale}/:path*`,
        destination: `/langue?vers=${locale}&suite=/:path*`,
        permanent: false,
      },
    ]);
  },
  async headers() {
    return securityHeaders({ production: process.env.APP_ENV === "production" });
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

const avecNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default avecNextIntl(nextConfig);
