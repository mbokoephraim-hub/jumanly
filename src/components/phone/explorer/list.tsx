import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { PhoneBack } from "../back";

/**
 * A full list of Explorer (planches Offres-tout, -entreprises, -personnes, -enregistrees): « ‹
 * Explorer » and the title on one line, a line that says how the list is made, then the rows.
 */
export async function ExplorerList({
  title,
  sub,
  empty,
  children,
}: {
  title: string;
  sub: string | null;
  /** When the list is empty: a title, a sentence and a way out. */
  empty?: { title: string; text: string; cta: string; href: string } | null;
  children: ReactNode;
}) {
  const t = await getTranslations("phoneExplorer");
  return (
    <div className="nb-page nb-ex nb-ex-liste">
      <header className="nb-barre nb-ex-barre">
        <PhoneBack fallback="/app/jobs" label={t("list.back")} text={t("list.back")} />
        <h1>{title}</h1>
      </header>
      {empty ? (
        <div className="nb-ex-vide-grand">
          <b>{empty.title}</b>
          <p>{empty.text}</p>
          <Link href={empty.href} className="nb-bouton" data-plein="">
            {empty.cta}
          </Link>
        </div>
      ) : (
        <>
          {sub ? <p className="nb-ex-sous">{sub}</p> : null}
          {children}
        </>
      )}
    </div>
  );
}
