import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { OrbiDisc } from "@/components/phone/icon";
import { OrbiAskButton, OrbiOpenLink } from "./web-home-orbi";

/**
 * The right column of a page of the recruiter on a computer (Modèle B, captures 033 and 034):
 * Orbi first (a question to ask, a fact read in the data), then what the page adds below.
 * Orbi recommends, the recruiter decides; nothing here is a judgment on a person.
 */
export async function RecruiterAside({
  question,
  fact,
  children,
}: {
  question: string;
  fact: string;
  children?: ReactNode;
}) {
  const t = await getTranslations("rhWeb.aside");
  return (
    <aside className="rb-aside" aria-label={t("aria")}>
      <div className="rb-aside-orbi">
        <OrbiDisc size={30} />
        <span>
          <b>{t("orbi")}</b>
          <span className="rb-meta">{t("orbiLine")}</span>
        </span>
      </div>
      <OrbiAskButton question={question} />
      <div className="rb-orbi-r">
        <p>{fact}</p>
        <OrbiOpenLink label={t("open")} />
      </div>
      {children}
    </aside>
  );
}
