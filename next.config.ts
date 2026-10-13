import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Pas d'en-tête « X-Powered-By » : on n'expose pas la technologie utilisée.
  poweredByHeader: false,
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
