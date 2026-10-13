import type { Metadata } from "next";

/** Public site URL (NEXT_PUBLIC_SITE_URL), used for canonical links, Open Graph and the sitemap. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Metadata of a public page: title, description, canonical link and Open Graph card.
 * The Open Graph image is the site-wide one (src/app/opengraph-image.tsx) unless a page has its own.
 */
export function pageMetadata({
  path,
  title,
  description,
  ogTitle,
  ogDescription,
  noindex = false,
}: {
  path: string;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  noindex?: boolean;
}): Metadata {
  return {
    // SEO titles in the texts already end with the brand ("… · Jumanly").
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: "Jumanly",
      url: path,
      title: ogTitle ?? title,
      description: ogDescription ?? description,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle ?? title,
      description: ogDescription ?? description,
    },
    robots: noindex ? { index: false, follow: true } : undefined,
  };
}
