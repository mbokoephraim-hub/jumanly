import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { securityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Pas d'en-tête « X-Powered-By » : on n'expose pas la technologie utilisée.
  poweredByHeader: false,
  // Justificatifs de vérification (Admin v2, étape 4) : 4 Mo par envoi, sous la limite de 4,5 Mo
  // d'une requête sur Vercel.
  experimental: {
    serverActions: { bodySizeLimit: "4.2mb" },
    // Fluidité (Ephraïm, 20/10) : une page déjà ouverte se rouvre à l'instant pendant 3 minutes,
    // sans nouvel aller-retour ; une action (enregistrer, postuler…) la rafraîchit aussitôt.
    staleTimes: { dynamic: 180, static: 300 },
  },
  // Export PDF des CV par Chromium (docs/modeles-cv § 6.3) : ces paquets restent hors du bundle.
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium", "playwright-core"],
  outputFileTracingIncludes: {
    "/api/cv/[documentId]/export": ["./node_modules/@sparticuz/chromium/bin/**"],
    "/app/jobs/candidatures/[id]/cv": ["./node_modules/@sparticuz/chromium/bin/**"],
    "/app/hire/candidats/[applicationId]/cv": ["./node_modules/@sparticuz/chromium/bin/**"],
    "/app/messages/[id]/document/[messageId]": ["./node_modules/@sparticuz/chromium/bin/**"],
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
  async rewrites() {
    if (process.env.MAINTENANCE_MODE !== "1") return [];
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
