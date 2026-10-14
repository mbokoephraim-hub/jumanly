import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { securityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Pas d'en-tête « X-Powered-By » : on n'expose pas la technologie utilisée.
  poweredByHeader: false,
  // Export PDF des CV par Chromium (docs/modeles-cv § 6.3) : ces paquets restent hors du bundle.
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium", "playwright-core"],
  outputFileTracingIncludes: {
    "/api/cv/[documentId]/export": ["./node_modules/@sparticuz/chromium/bin/**"],
    "/app/jobs/candidatures/[id]/cv": ["./node_modules/@sparticuz/chromium/bin/**"],
    "/app/hire/candidats/[applicationId]/cv": ["./node_modules/@sparticuz/chromium/bin/**"],
    "/app/messages/[id]/document/[messageId]": ["./node_modules/@sparticuz/chromium/bin/**"],
  },
  // En-têtes de sécurité (partie 10 § 10.5). HSTS et « upgrade-insecure-requests » seulement en
  // production : en local, le site est servi en http.
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
