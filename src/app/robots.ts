import type { MetadataRoute } from "next";
import { appEnv } from "@/lib/env";
import { siteUrl } from "@/lib/seo";

/** Only production is indexed; the connected space, admin and internal pages never are. */
export default function robots(): MetadataRoute.Robots {
  if (appEnv() !== "production") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app", "/admin", "/dev", "/api", "/inscription", "/connexion"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
