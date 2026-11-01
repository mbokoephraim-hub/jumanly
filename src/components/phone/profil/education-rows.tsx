import "@/styles/phone-verification.css";
import Link from "next/link";
import { GoldSeal } from "../badge-or";
import { PhoneIcon } from "../icon";

/** A diploma or a certificate as the profiles show it. */
export type EducationRow = {
  id: string;
  title: string;
  line: string;
  /** Photo of the document the person joined. */
  image: string | null;
  /** Logo of the school or of the organization, shown instead of the icon (31/10/2026). */
  logo?: string | null;
  /** « Ce que j'ai appris »: 2 to 3 short points. */
  learnings?: string[];
  /** A certificate confirmed by a referent. */
  verified: boolean;
  /** The owner's view: the item opens its form. */
  href?: string;
  /** An attestation earned on Jumanly. */
  jumanly?: boolean;
};

/** « Vérifié »: the gold seal alone, at the end of the title line of an experience or a
 * certificate (Ephraïm, 01/11/2026: « juste le badge, sur la même ligne que le poste »). */
export function ItemVerifiedMark({ label, help }: { label: string; help: string }) {
  return (
    <span className="nb-or-sceau" title={help}>
      <GoldSeal size={18} label={label} />
      <span className="sr-only">{help}</span>
    </span>
  );
}

/**
 * « Diplômes » or « Certificats » (demande d'Ephraïm du 29/10/2026): the title, the school or the
 * organization and the year; « Vérifié » for a certificate a referent confirmed, « Justificatif
 * joint » for a document joined without confirmation; the photo opens full size.
 */
export function EducationList({
  rows,
  labels,
}: {
  rows: EducationRow[];
  labels: {
    verified: string;
    verifiedHelp: string;
    document: string;
    jumanly: string;
    openImage: (title: string) => string;
  };
}) {
  return (
    <>
      {rows.map((item) => {
        const body = (
          <>
            <span
              aria-hidden
              data-jumanly={item.jumanly ? "" : undefined}
              data-logo={item.logo ? "" : undefined}
            >
              {item.logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- a 160 px logo the person sent
                <img src={item.logo} alt="" width={36} height={36} loading="lazy" />
              ) : (
                <PhoneIcon name="formation" size={17} />
              )}
            </span>
            <span className="nb-vf-txt">
              <b>
                {item.title}
                {item.verified ? (
                  <ItemVerifiedMark label={labels.verified} help={labels.verifiedHelp} />
                ) : null}
              </b>
              <small>{item.line}</small>
              {item.verified ? null : item.image ? (
                <span className="nb-vf-doc">{labels.document}</span>
              ) : null}
              {item.learnings && item.learnings.length > 0 ? (
                <ul className="nb-pf-pts nb-ed-pts">
                  {item.learnings.map((point, n) => (
                    <li key={n}>
                      <i aria-hidden />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </span>
            {item.jumanly ? (
              <span className="nb-pf-tag nb-cr-jumanly">{labels.jumanly}</span>
            ) : null}
          </>
        );
        return (
          <div
            key={item.id}
            className="nb-vf-row"
            data-pts={item.learnings && item.learnings.length > 0 ? "" : undefined}
          >
            {item.href ? (
              <Link href={item.href} className="nb-pf-form nb-cr-form">
                {body}
              </Link>
            ) : (
              <div className="nb-pf-form">{body}</div>
            )}
            {item.image ? (
              <a
                href={item.image}
                target="_blank"
                rel="noopener"
                className="nb-vf-img"
                aria-label={labels.openImage(item.title)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- the person's own photo */}
                <img src={item.image} alt="" width={48} height={48} loading="lazy" />
              </a>
            ) : null}
          </div>
        );
      })}
    </>
  );
}
