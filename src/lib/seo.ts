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

/** JSON-LD for a page, serialized with "<" escaped (values come from the database). */
export function jsonLdScript(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** ISO 8601 duration ("PT1H30M") for schema.org. */
export function isoDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `PT${hours > 0 ? `${hours}H` : ""}${rest > 0 || hours === 0 ? `${rest}M` : ""}`;
}

/**
 * Structured data of a course page (schema.org `Course`, partie 12 E11). A free course is offered
 * at 0 USD; a paid one is part of a subscription, priced at the cheapest plan that includes it.
 */
export function courseJsonLd(course: {
  slug: string;
  title: string;
  summary: string;
  language: string;
  level: string;
  durationMinutes: number;
  instructor?: string | null;
  plan: { priceCents: number | null } | null;
  free: boolean;
}) {
  const url = `${siteUrl()}/formations/${course.slug}`;
  const provider = { "@type": "Organization", name: "Jumanly", sameAs: siteUrl() };
  const price = course.free ? 0 : course.plan?.priceCents;
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.summary,
    url,
    inLanguage: course.language,
    educationalLevel: course.level,
    provider,
    offers: {
      "@type": "Offer",
      category: course.free ? "Free" : "Subscription",
      ...(price !== null && price !== undefined
        ? { price: (price / 100).toFixed(2), priceCurrency: "USD" }
        : {}),
      url,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      courseWorkload: isoDuration(course.durationMinutes),
      ...(course.instructor ? { instructor: { "@type": "Person", name: course.instructor } } : {}),
    },
  };
}

/**
 * Structured data of the home page: who publishes the site (schema.org `Organization`) and the site
 * itself (`WebSite`). Search engines and AI assistants use it to name Jumanly and show its logo.
 * Contact is by e-mail only (règle d'or 8).
 */
export function siteJsonLd({
  name,
  description,
  slogan,
  publisher,
  emails,
}: {
  name: string;
  description: string;
  slogan: string;
  publisher: string;
  emails: string[];
}) {
  const url = siteUrl();
  const organization = {
    "@type": "Organization",
    "@id": `${url}/#organization`,
    name,
    url,
    logo: `${url}/marque/jumanly-favicon-512.png`,
    slogan,
    description,
    email: emails[0],
    contactPoint: emails.map((email) => ({
      "@type": "ContactPoint",
      contactType: "customer support",
      email,
      availableLanguage: "fr",
    })),
    parentOrganization: { "@type": "Organization", name: publisher },
  };
  const website = {
    "@type": "WebSite",
    "@id": `${url}/#website`,
    name,
    url,
    description,
    inLanguage: "fr",
    publisher: { "@id": `${url}/#organization` },
  };
  return { "@context": "https://schema.org", "@graph": [organization, website] };
}
