import { notFound } from "next/navigation";
import { getMessages, getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { Eyebrow, wrap } from "@/components/site/marketing";
import { cx } from "@/lib/cx";
import { legalValues, siteCookies } from "@/config/legal";
import { legalNavigation } from "@/config/navigation";
import { childKeys, dynamic } from "@/i18n/dynamic";
import { formatDate } from "@/lib/dates";
import { appEnv } from "@/lib/env";
import { hasPlaceholder } from "@/lib/placeholders";
import { CookieSettingsButton } from "./cookie-consent";
import { PrintButton } from "./print-button";
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

  // Sections whose first text introduces the bullets that follow (mockup 01-17).
  const introKeys = new Set(["text", "intro", "principle", "list"]);
  const paragraph = "text-[15px] leading-[25px]";

  const blocks = keys.map((key, index) => {
    const node = tree[key];
    if (typeof node === "string") {
      return (
        <p key={key} className={paragraph}>
          <RichText text={t(`${namespace}.${key}`, values)} />
        </p>
      );
    }
    const children = childKeys(messages, `${namespace}.${key}`);
    const title = t(`${namespace}.${key}.title`);
    // A group with a title only opens a part ("Partie 1 · …").
    if (isPartTitle(key)) {
      return (
        <h2
          key={key}
          id={key}
          className="mt-4 scroll-mt-24 border-t border-brume pt-8 text-[26px] font-bold tracking-tight lg:text-[30px]"
        >
          {title}
        </h2>
      );
    }
    const Heading = firstPart !== -1 && index > firstPart ? "h3" : "h2";
    const heading = "text-[22px] leading-tight font-bold tracking-tight lg:text-2xl";
    if (key === "summary") {
      return (
        <section
          key={key}
          id={key}
          className="relative scroll-mt-24 overflow-hidden rounded-[28px] bg-lime-clair p-6 lg:p-8"
        >
          <div className="relative flex flex-col gap-4">
            <Heading className="text-lg font-bold">{title}</Heading>
            <ul className="flex flex-col gap-3">
              {children
                .filter((child) => child !== "title")
                .map((child) => (
                  <li key={child} className="flex items-start gap-3 text-[15px] leading-[23px]">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-sapin text-lime">
                      <Icon name="check" className="size-3" />
                    </span>
                    <RichText text={t(`${namespace}.${key}.${child}`, values)} />
                  </li>
                ))}
            </ul>
          </div>
        </section>
      );
    }
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
          <Heading className={heading}>{title}</Heading>
          <div
            className="overflow-x-auto rounded-[20px] bg-blanc p-4"
            tabIndex={0}
            role="region"
            aria-label={title}
          >
            <table className="w-full min-w-[560px] text-left text-sm">
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
    const texts = children.filter((child) => child !== "title" && child !== "cta");
    const lead = texts.length > 1 && introKeys.has(texts[0]!) ? texts[0] : undefined;
    const items = texts.length > 1 ? texts.filter((child) => child !== lead) : [];
    const highlighted = key === "ai";
    return (
      <section
        key={key}
        id={key}
        className={cx(
          "flex scroll-mt-24 flex-col gap-3",
          highlighted &&
            "rounded-[24px] bg-blanc p-6 shadow-[0_12px_32px_rgba(15,63,55,0.06)] ring-[1.5px] ring-menthe ring-inset lg:p-8",
        )}
      >
        {highlighted && (
          <span className="flex items-center gap-1.5 self-start rounded-pill bg-sapin px-3 py-1 text-[11px] font-semibold text-lime">
            <Icon name="intelligence" className="size-3" />
            {t("home.trust.ai.title")}
          </span>
        )}
        <Heading className={heading}>{title}</Heading>
        {texts.length === 1 && (
          <p className={paragraph}>
            <RichText text={t(`${namespace}.${key}.${texts[0]}`, values)} />
          </p>
        )}
        {lead && (
          <p className={paragraph}>
            <RichText text={t(`${namespace}.${key}.${lead}`, values)} />
          </p>
        )}
        {items.length > 0 && (
          <ul className="flex flex-col gap-2.5">
            {items.map((child) => (
              <li key={child} className={cx(paragraph, "flex gap-3")}>
                <span
                  aria-hidden
                  className="mt-[9px] size-1.5 shrink-0 rounded-full bg-feuille-fonce"
                />
                <span>
                  <RichText text={t(`${namespace}.${key}.${child}`, values)} labelled />
                </span>
              </li>
            ))}
          </ul>
        )}
        {children.includes("cta") && namespace === "cookiesPolicy" && (
          <div className="font-semibold">
            <CookieSettingsButton label={t(`${namespace}.${key}.cta`)} />
          </div>
        )}
      </section>
    );
  });

  const contents = keys
    .filter((key) => typeof tree[key] === "object" && key !== "summary")
    .map((key) => ({ key, title: t(`${namespace}.${key}.title`), part: isPartTitle(key) }));
  const navIcons: Record<(typeof legalNavigation)[number]["key"], IconName> = {
    notice: "info",
    privacy: "confidentialite",
    terms: "doc",
    cookies: "reglages",
  };

  return (
    <section id="haut" className="bg-papier pb-16 lg:pb-24">
      <div className={cx(wrap, "flex flex-col gap-6 pt-6 lg:pt-8")}>
        {incomplete && (
          <p
            role="note"
            className="jm-light flex items-center gap-2.5 rounded-[14px] bg-[#FFF1C9] px-4 py-3 text-sm font-medium text-ambre-texte print:hidden"
          >
            <Icon name="alerte" className="size-4 shrink-0" />
            {t("legal.validationBanner")}
          </p>
        )}
        <header className="flex flex-col gap-4 rounded-[32px] bg-lime-clair px-6 py-8 lg:flex-row lg:items-end lg:justify-between lg:rounded-[48px] lg:px-12 lg:py-14 print:bg-transparent print:p-0">
          <div className="flex flex-col gap-2">
            <Eyebrow>{t("legal.eyebrow")}</Eyebrow>
            <h1 className="text-[36px] leading-[1.05] font-semibold tracking-[-0.04em] lg:text-[64px]">
              {t(`${namespace}.title`)}
            </h1>
            <p className="text-sm text-ardoise">
              {t("legal.lastUpdated", { lastUpdated: formatDate(legalValues.lastUpdated) })}
            </p>
          </div>
          <div className="self-start lg:self-end">
            <PrintButton label={t("legal.print")} />
          </div>
        </header>
        <div className="mt-2 grid grid-cols-1 gap-8 lg:grid-cols-[264px_1fr] lg:gap-12">
          <aside className="flex min-w-0 flex-col gap-4 self-start lg:sticky lg:top-24 print:hidden">
            <nav
              aria-label={t("legal.eyebrow")}
              className="rounded-[24px] bg-blanc p-2 max-lg:overflow-x-auto"
            >
              <ul className="flex gap-1 lg:flex-col">
                {legalNavigation.map((link) => (
                  <li key={link.key} className="shrink-0">
                    <Link
                      href={link.href}
                      aria-current={link.href === current ? "page" : undefined}
                      className="flex items-center gap-2.5 rounded-[14px] px-3 py-2.5 text-sm font-medium hover:bg-papier aria-[current=page]:bg-sapin aria-[current=page]:text-blanc"
                    >
                      <span className="flex size-7 items-center justify-center rounded-full bg-papier text-sapin">
                        <Icon name={navIcons[link.key]} className="size-4" />
                      </span>
                      {t(`legal.nav.${link.key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            {contents.length > 2 && (
              <nav
                aria-label={t("legal.toc")}
                className="rounded-[20px] bg-blanc p-4 max-lg:hidden"
              >
                <p className="px-2 pb-2 text-[11px] font-semibold tracking-[0.12em] text-ardoise uppercase">
                  {t("legal.toc")}
                </p>
                <ul className="flex flex-col">
                  {contents.map((item) => (
                    <li key={item.key}>
                      <a
                        href={`#${item.key}`}
                        className={cx(
                          "block rounded-[10px] px-2 py-1.5 text-[13px] leading-[18px] hover:bg-papier",
                          item.part ? "mt-2 font-semibold" : "text-sapin/85",
                        )}
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </aside>
          <article className="flex min-w-0 flex-col gap-8">
            {blocks}
            <div className="flex flex-col gap-3 border-t border-brume pt-6 text-sm text-ardoise sm:flex-row sm:items-center sm:justify-between">
              <p>{t("legal.contactLine")}</p>
              <a
                href="#haut"
                className="flex shrink-0 items-center gap-1.5 font-semibold text-sapin print:hidden"
              >
                <Icon name="up" className="size-4" />
                {t("legal.backToTop")}
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/**
 * A legal text with its "[…]" placeholders marked (only visible outside production) and, for a
 * list item, the label before " : " in bold.
 */
function RichText({ text, labelled = false }: { text: string; labelled?: boolean }) {
  const colon = text.indexOf(" : ");
  const label = labelled && colon > 0 && colon <= 50 ? text.slice(0, colon) : null;
  const body = label ? text.slice(colon) : text;
  return (
    <>
      {label && <strong className="font-semibold">{label}</strong>}
      {body.split(/(\[[^\]]*\])/).map((part, index) =>
        hasPlaceholder(part) ? (
          <mark
            key={index}
            className="jm-light rounded bg-[#FFF1C9] px-1 font-semibold text-ambre-texte"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
