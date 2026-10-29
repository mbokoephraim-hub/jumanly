import "@/styles/phone-verification.css";
import Link from "next/link";
import { PhoneIcon } from "../icon";

/** A diploma or a certificate as the profiles show it. */
export type EducationRow = {
  id: string;
  title: string;
  line: string;
  /** Photo of the document the person joined. */
  image: string | null;
  /** A certificate confirmed by a referent. */
  verified: boolean;
  /** The owner's view: the item opens its form. */
  href?: string;
  /** An attestation earned on Jumanly. */
  jumanly?: boolean;
};

/** « Vérifié »: a lime check and the word, beside an experience or a certificate. */
export function ItemVerifiedMark({ label, help }: { label: string; help: string }) {
  return (
    <span className="nb-vf-ok" title={help}>
      <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        <path
          d="m7.5 12.5 3 3 6-6.5"
          fill="none"
          stroke="#0B1A1F"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
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
            <span aria-hidden data-jumanly={item.jumanly ? "" : undefined}>
              <PhoneIcon name="formation" size={17} />
            </span>
            <span className="nb-vf-txt">
              <b>{item.title}</b>
              <small>{item.line}</small>
              {item.verified ? (
                <ItemVerifiedMark label={labels.verified} help={labels.verifiedHelp} />
              ) : item.image ? (
                <span className="nb-vf-doc">{labels.document}</span>
              ) : null}
            </span>
            {item.jumanly ? (
              <span className="nb-pf-tag nb-cr-jumanly">{labels.jumanly}</span>
            ) : null}
          </>
        );
        return (
          <div key={item.id} className="nb-vf-row">
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
