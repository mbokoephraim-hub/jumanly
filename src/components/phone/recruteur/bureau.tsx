import "server-only";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import type { DeskCounts } from "@/server/services/hire-desk";
import type { OfferRow } from "@/server/services/hire-offers";
import { MenuArt } from "@/components/site/menu-art";
import { FilAvatar } from "../fil/avatar";
import { Verified } from "../explorer/cards";
import type { RhOffersOrg } from "./offres";

/** The offers whose candidates the recruiter works on: open or paused, not drafts. */
export const deskOffer = (offer: Pick<OfferRow, "status">) =>
  offer.status === "published" || offer.status === "paused" || offer.status === "closed";

const initialsOfName = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

/** Where an offer of the desk opens: its « Candidatures » tab, directly. */
export const deskHref = (id: string) => `/app/hire/offres/${id}?vue=candidatures`;

/**
 * « Candidatures » of the bottom bar (Ephraïm, 03/11/2026, step 1): first choose the offer. The
 * same notched cards as « Offres », with what is waiting: À trier · À compléter · Entretiens. The
 * offers with work waiting come first. Each opens the offer's own « Candidatures » tab: one page,
 * never a second list beside the offer.
 */
export async function RhOfferChooser({
  offers,
  counts,
  org,
  now,
}: {
  offers: OfferRow[];
  counts: Map<string, DeskCounts>;
  org: RhOffersOrg;
  now: Date;
}) {
  const t = await getTranslations("phoneRhBureau");
  const ts = await getTranslations("phoneRhOffres");
  const format = await getFormatter();
  const waiting = (id: string) => {
    const count = counts.get(id);
    return count ? count.trier + count.completer + count.entretiens : 0;
  };
  const sorted = [...offers].sort(
    (a, b) =>
      Number(b.status === "published") - Number(a.status === "published") ||
      waiting(b.id) - waiting(a.id) ||
      b.updatedAt.getTime() - a.updatedAt.getTime(),
  );
  if (sorted.length === 0)
    return (
      <div className="nb-rh-bureau-vide">
        <MenuArt name="jobs" size="md" />
        <p>{t("empty")}</p>
        <Link href="/app/hire/offres" className="nb-rh-oc-plusbt">
          {t("emptyCta")}
        </Link>
      </div>
    );
  return (
    <div className="nb-rh-offres nb-rh-bureau">
      <p className="nb-rh-bureau-intro">{t("intro")}</p>
      <ul className="nb-rh-cartes">
        {sorted.map((offer) => {
          const count = counts.get(offer.id);
          const expired = offer.status === "published" && offer.closesAt && offer.closesAt <= now;
          const status = expired ? "expired" : offer.status;
          const ended = status === "closed" || status === "expired";
          const href = deskHref(offer.id);
          const figures = [
            { key: "trier", value: count?.trier ?? 0 },
            { key: "completer", value: count?.completer ?? 0 },
            { key: "entretiens", value: count?.entretiens ?? 0 },
          ] as const;
          const total = offer.figures.applications;
          return (
            <li key={offer.id}>
              <article className="nb-rh-oc" data-fin={ended ? "" : undefined}>
                <div className="nb-rh-oc-corps">
                  <span className="nb-rh-oc-org">
                    <FilAvatar
                      initials={initialsOfName(org.name)}
                      image={org.logo}
                      tone={0}
                      org
                      square
                      size={44}
                    />
                    <span>{org.name}</span>
                    {org.verified ? <Verified label={ts("list.card.verified")} size={16} /> : null}
                  </span>
                  <h3 className="nb-rh-oc-t">
                    <Link href={href}>{offer.title}</Link>
                  </h3>
                  <dl className="nb-rh-oc-stats nb-rh-bureau-stats">
                    {figures.map((figure) => (
                      <div key={figure.key}>
                        <dt>{t(`count.${figure.key}`)}</dt>
                        <dd data-plein={figure.value > 0 ? "" : undefined}>
                          {format.number(figure.value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="nb-rh-oc-pied">
                  <span className="nb-rh-oc-aucune">
                    {total > 0 ? t("total", { count: total }) : t("none")}
                  </span>
                  <Link href={href} className="nb-rh-oc-plusbt">
                    <span aria-hidden>{t("open")}</span>
                    <span className="sr-only">{t("openLabel", { title: offer.title })}</span>
                  </Link>
                </div>
                <span className="nb-rh-oc-encoche">
                  <i className="nb-rh-oc-k1" aria-hidden />
                  <i className="nb-rh-oc-k2" aria-hidden />
                  <span className="nb-rh-statut nb-rh-oc-etat" data-statut={status}>
                    {status === "published" ? <i className="nb-rh-pouls" aria-hidden /> : null}
                    {ts(`status.${status}`)}
                  </span>
                </span>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
