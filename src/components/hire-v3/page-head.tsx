import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { HireIcon } from "./icon";
import { HireTabs, type HireTab } from "./tabs";

/**
 * A page of the recruiter's web app v3: the prototype's `#content` (`.content`, its entry
 * animation and bottom space) under `.hv3`, so the screen takes the style sheet of the prototype.
 */
export function HirePage({ children, view }: { children: ReactNode; view?: string }) {
  return (
    <div className="hv3 hv3-page">
      <div className="content" data-view={view}>
        {children}
      </div>
    </div>
  );
}

/**
 * The head of a page (`.ph` of the prototype, completed by `render()`): title and subtitle on the
 * left, with « Retour » before the title when the view has a parent; on the right, in this order,
 * « Télécharger » when the view exports, the other buttons of the page head (`extra`), the tabs in
 * a pill, then the page's own actions.
 */
export async function HirePageHead({
  title,
  sub,
  back,
  tabs,
  download,
  extra,
  actions,
  crumb,
  below,
}: {
  /** The path above the title (`.meta` « Offres / … »). */
  crumb?: ReactNode;
  /** What sits under the title and subtitle (the chips of an offer). */
  below?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  back?: { href: string; label?: string };
  tabs?: HireTab[];
  /** Opens the download of the view (the window comes with lot V3-5). */
  download?: { href: string };
  extra?: ReactNode;
  actions?: ReactNode;
}) {
  const t = await getTranslations("hireV3.page");
  return (
    <div className="ph">
      <div>
        {back ? (
          <Link
            className="backb"
            href={back.href}
            aria-label={back.label ? t("backTo", { label: back.label }) : t("back")}
          >
            <HireIcon name="chev" size="s" style={{ transform: "rotate(180deg)" }} />
            <span>{t("back")}</span>
          </Link>
        ) : null}
        {crumb}
        <h1>{title}</h1>
        {sub ? <p>{sub}</p> : null}
        {below}
      </div>
      {download || extra || (tabs && tabs.length > 1) || actions ? (
        <div className="act">
          {download ? <HireDownloadButton href={download.href} label={t("download")} /> : null}
          {extra}
          {tabs && tabs.length > 1 ? <HireTabs tabs={tabs} /> : null}
          {actions}
        </div>
      ) : null}
    </div>
  );
}

/** « Télécharger » of a view that exports (`.btn.ghost.xpbtn` of the prototype). */
export function HireDownloadButton({ href, label }: { href: string; label: string }) {
  return (
    <Link className="btn ghost xpbtn" href={href} scroll={false}>
      <HireIcon name="dl" />
      {label}
    </Link>
  );
}
