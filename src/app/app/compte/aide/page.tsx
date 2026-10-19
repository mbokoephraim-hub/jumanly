import type { Metadata } from "next";
import Link from "next/link";
import { getMessages, getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { cx } from "@/lib/cx";
import { requireUser } from "@/server/auth/session";
import { getContentOverrides } from "@/server/queries/public";
import { faqItems } from "@/server/services/contents";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("aide");
  return { title: t("seo"), robots: { index: false } };
}

/** The only contact of Jumanly (CLAUDE.md § 8): by e-mail, never by phone. */
const CONTACT_EMAIL = "assistant@jumanly.io";

/** The themes of the FAQ that concern a talent, in the order of the planche talent-4 § 8. */
const themes = [
  { theme: "talents", icon: "candidature", tone: "t-c3" },
  { theme: "learn", icon: "former", tone: "t-c1" },
  { theme: "billing", icon: "portefeuille", tone: "t-c2" },
  { theme: "privacy", icon: "confidentialite" },
  { theme: "ai", icon: "orbi", tone: "t-c1" },
  { theme: "partners", icon: "certificat", tone: "t-c3" },
  { theme: "general", icon: "aide" },
] as const satisfies { theme: string; icon: TalentIconName; tone?: string }[];

type Theme = (typeof themes)[number]["theme"];
const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/**
 * Aide (planche talent-4 § 8): the questions of the FAQ (as /admin/contenus left them) by theme, a
 * search over them, and the team's address. No phone number, anywhere.
 */
export default async function HelpPage({ searchParams }: PageProps<"/app/compte/aide">) {
  const params = await searchParams;
  await requireUser("/app/compte/aide");
  const t = await getTranslations();
  const [messages, overrides] = await Promise.all([getMessages(), getContentOverrides()]);
  const groups = themes.map((entry) => ({
    ...entry,
    items: faqItems(messages, overrides, `faq.${entry.theme}`).map((item) => ({
      id: `${entry.theme}-${item.n}`,
      question: item.question,
      answer: item.answer,
    })),
  }));
  const query = one(params.q)?.trim().slice(0, 80) ?? "";
  const chosen = groups.find((group) => group.theme === (one(params.theme) as Theme | undefined));
  const found = query
    ? groups.flatMap((group) =>
        group.items.filter((item) => fold(`${item.question} ${item.answer}`).includes(fold(query))),
      )
    : null;
  const shown = found ?? chosen?.items ?? null;
  // The first questions of each theme, beside « Nous écrire » on a tablet or a computer (planche
  // web talent-4 § 8).
  const frequent = shown ? [] : groups.flatMap((group) => group.items.slice(0, 1)).slice(0, 5);

  return (
    <div className="t-flux t-w4 t-large">
      <div className={shown ? "t-w4-h" : "t-w4-tel"}>
        <FlowHead
          back={chosen || query ? "/app/compte/aide" : "/app/compte"}
          backLabel={t("aide.back")}
          title={chosen && !query ? t(`aide.theme.${chosen.theme}`) : t("aide.title")}
        />
      </div>

      <div className={shown ? "t-w4-col" : "t-w4-aide-h"}>
        {!shown && <h1 className="t-w4-web">{t("talentW4.help.hero")}</h1>}
        <form action="/app/compte/aide" className="t-verre t-rech" role="search">
          <TalentIcon name="recherche" size="s" />
          <label htmlFor="aide-q" className="sr-only">
            {t("aide.search")}
          </label>
          <input
            id="aide-q"
            name="q"
            type="search"
            defaultValue={query}
            maxLength={80}
            placeholder={t("aide.search")}
            autoComplete="off"
          />
        </form>
      </div>

      {shown ? (
        <>
          {query && <span className="t-ck-t">{t("aide.results", { query })}</span>}
          {shown.length === 0 ? (
            <p className="t-aide-c">{t("aide.noResult")}</p>
          ) : (
            <div className="t-verre t-liste t-lignes t-faq">
              {shown.map((item) => (
                <details key={item.id} className="t-li">
                  <summary>
                    <b>{item.question}</b>
                    <TalentIcon name="suivant" size="s" />
                  </summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          )}
        </>
      ) : (
        <ul aria-label={t("aide.themes")} className="t-verre t-liste t-lignes t-w4-aide-g">
          {groups
            .filter((group) => group.items.length > 0)
            .map((group) => (
              <li key={group.theme}>
                <Link href={`/app/compte/aide?theme=${group.theme}`} className="t-li t-press">
                  <span className={cx("t-cases", "tone" in group && group.tone)} aria-hidden>
                    <TalentIcon name={group.icon} size="s" />
                  </span>
                  <span className="t-t">
                    <b>{t(`aide.theme.${group.theme}`)}</b>
                    <span>{t("aide.count", { count: group.items.length })}</span>
                  </span>
                  <TalentIcon name="suivant" />
                </Link>
              </li>
            ))}
        </ul>
      )}

      <div className={shown ? "t-w4-col" : "t-w4-g2"}>
        {frequent.length > 0 && (
          <section aria-labelledby="aide-frequentes" className="t-w4-col t-w4-web">
            <h2 id="aide-frequentes" className="t-ck-t t-w4-sech">
              {t("talentW4.help.faq")}
            </h2>
            <div className="t-verre t-liste t-lignes t-faq">
              {frequent.map((item) => (
                <details key={item.id} className="t-li">
                  <summary>
                    <b>{item.question}</b>
                    <TalentIcon name="suivant" size="s" />
                  </summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}
        <section aria-labelledby="aide-ecrire" className="t-w4-col">
          <h2 id="aide-ecrire" className="t-ck-t t-w4-sech t-w4-web">
            {t("talentW4.help.write")}
          </h2>
          <div className="t-verre t-contact">
            <b>{t("aide.contact.title")}</b>
            <span>{t("aide.contact.text", { email: CONTACT_EMAIL })}</span>
            <a href={`mailto:${CONTACT_EMAIL}`} className="t-bt t-p t-s t-press">
              <TalentIcon name="message" size="xs" />
              {t("aide.contact.cta")}
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
