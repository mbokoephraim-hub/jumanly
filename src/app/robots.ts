import type { MetadataRoute } from "next";
import { appEnv } from "@/lib/env";
import { siteUrl } from "@/lib/seo";

/** Private areas: the connected space, admin, internal pages and the sign-up and login forms. */
const disallow = [
  "/app",
  "/demarrage",
  "/admin",
  "/dev",
  "/api",
  "/impression",
  "/inscription",
  "/connexion",
];

/**
 * Search engines and AI assistants that are welcome on the public pages. The "*" group already
 * covers them; naming them keeps them allowed even if a default changes elsewhere, and documents
 * the choice (the owner wants Jumanly visible in AI answers as well as on Google).
 */
const namedCrawlers = [
  "Googlebot",
  "Bingbot",
  "Applebot",
  "DuckDuckBot",
  "YandexBot",
  "Google-Extended",
  "Applebot-Extended",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Meta-ExternalAgent",
  "MistralAI-User",
  "CCBot",
];

/** Only production is indexed; the connected space, admin and internal pages never are. */
export default function robots(): MetadataRoute.Robots {
  if (appEnv() !== "production") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: namedCrawlers, allow: "/", disallow },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
