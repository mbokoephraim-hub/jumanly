import { notFound } from "next/navigation";
import { getMessages, getTranslations } from "next-intl/server";
import { Alert } from "@/components/ui";
import { legalValues, siteCookies } from "@/config/legal";
import { legalNavigation } from "@/config/navigation";
import { childKeys, dynamic } from "@/i18n/dynamic";
import { formatDate } from "@/lib/dates";
import { appEnv } from "@/lib/env";
import { hasPlaceholder } from "@/lib/placeholders";
import { CookieSettingsButton } from "./cookie-consent";
import Link from "next/link";

type Namespace = "notice" | "privacy" | "terms" | "cookiesPolicy";

/** Every text of a legal page, flattened, to look for "[…]" placeholders. */
function allTexts(node: unknown): string[] {
  if (typeof node === "string") return [node];
  if (node && typeof node === "object") return Object.values(node).flatMap(allTexts);
  return [];
}

/**
 * Legal page rendered from its texts (textes, partie 10), section by section, in file order.
 * These are templates to be validated by a lawyer: a banner says so outside production, and in
 * production a page that still holds a "[…]" placeholder is not published (404).
 */
export async function LegalPage({ namespace, current }: { namespace: Namespace; current: string }) {
  const messages = await getMessages();
  const t = dynamic(await getTranslations());
  const tree = (messages as unknown as Record<string, Record<string, unknown>>)[namespace];
  const incomplete = allTexts(tree).some(hasPlaceholder);
  if (incomplete && appEnv() === "production") notFound();

  const values = { graceDays: legalValues.graceDays };
  const keys = childKeys(messages, namespace).filter((key) => key !== "seo" && key !== "title");
  const isPartTitle = (key: string) =>
    typeof tree[key] === "object" && childKeys(messages, `${namespace}.${key}`).length === 1;
  const firstPart = keys.findIndex(isPartTitle);

  const blocks = keys.map((key, index) => {
    const node = tree[key];
    if (typeof node === "string") {
      return (
        <p key={key} className="text-[16px] leading-8">
          {t(`${namespace}.${key}`, values)}
        </p>
      );
    }
    const children = childKeys(messages, `${namespace}.${key}`);
    const title = t(`${namespace}.${key}.title`);
    // A group with a title only opens a part ("Partie 1 · …").
    if (isPartTitle(key)) {
      return (
        <h2 key={key} className="mt-6 border-t border-brume pt-8 text-h1">
          {title}
        </h2>
      );
    }
    const Heading = firstPart !== -1 && index > firstPart ? "h3" : "h2";
    if (namespace === "cookiesPolicy" && key === "table") {
      const columns = [
        "colName",
        "colPurpose",
        "colCategory",
        "colDuration",
        "colProvider",
      ] as const;
      const fields = ["name", "purpose", "category", "duration", "provider"] as const;
      return (
        <section key={key} id={key} className="flex scroll-mt-24 flex-col gap-3">
          <Heading className="text-h2">{title}</Heading>
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={title}>
            <table className="w-full min-w-[560px] text-left text-[15px]">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="border-b border-brume py-2 pr-4 font-semibold"
                    >
                      {t(`cookiesPolicy.table.${column}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {siteCookies.map((cookie) => (
                  <tr key={cookie}>
                    {fields.map((field) => (
                      <td key={field} className="border-b border-brume py-2 pr-4">
                        {t(`cookiesTable.${cookie}.${field}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }
    return (
      <section key={key} id={key} className="flex scroll-mt-24 flex-col gap-3">
        <Heading className="text-h2">{title}</Heading>
        {children
          .filter((child) => child !== "title" && child !== "cta")
          .map((child) => (
            <p key={child} className="text-[16px] leading-8">
              {t(`${namespace}.${key}.${child}`, values)}
            </p>
          ))}
        {children.includes("cta") && namespace === "cookiesPolicy" && (
          <div className="font-semibold">
            <CookieSettingsButton label={t(`${namespace}.${key}.cta`)} />
          </div>
        )}
      </section>
    );
  });

  return (
    <section className="bg-creme">
      <div className="mx-auto grid max-w-7xl gap-8 page-x py-12 md:py-16 lg:grid-cols-[1fr_3fr]">
        <nav aria-label={t("legal.toc")} className="self-start lg:sticky lg:top-24">
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {legalNavigation.map((link) => (
              <li key={link.key}>
                <Link
                  href={link.href}
                  aria-current={link.href === current ? "page" : undefined}
                  className="block rounded-pill px-4 py-2 text-sm font-medium hover:bg-blanc aria-[current=page]:bg-lime"
                >
                  {t(`legal.nav.${link.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <article className="flex max-w-3xl flex-col gap-6 rounded-card bg-blanc p-6 md:p-10">
          {incomplete && <Alert tone="warning" title={t("legal.validationBanner")} />}
          <h1 className="text-display">{t(`${namespace}.title`)}</h1>
          <p className="text-ardoise text-caption">
            {t("legal.lastUpdated", { lastUpdated: formatDate(legalValues.lastUpdated) })}
          </p>
          {blocks}
          <p className="border-t border-brume pt-6 text-sm text-ardoise">
            {t("legal.contactLine")}
          </p>
        </article>
      </div>
    </section>
  );
}
