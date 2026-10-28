import "server-only";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { PhoneIcon } from "../icon";

/**
 * An interview on the recruiter's phone (Modèle B recruteur M5, planche Recruteur-planifie): how,
 * when, with whom and where; « Invitation envoyée » right after sending it. The candidate receives
 * it in Messages and by e-mail.
 */
export async function RhInterviewSent({
  interview,
  sent,
  document,
}: {
  interview: {
    id: string;
    mode: "video" | "onsite" | "audio";
    at: Date | null;
    confirmed: boolean;
    link: string | null;
    address: string | null;
    timeZone: string;
    applicationId: string;
    name: string;
    with: string[];
  };
  sent: boolean;
  /** Past and confirmed: « Documenter l'entretien ». */
  document: boolean;
}) {
  const t = await getTranslations("phoneRhCandidatures.sent");
  const tm = await getTranslations("phoneRhCandidatures.interviews");
  const format = await getFormatter();
  const file = `/app/hire/candidats/${interview.applicationId}`;
  const when = interview.at
    ? t("when", {
        date: format.dateTime(interview.at, {
          weekday: "long",
          day: "numeric",
          month: "short",
          timeZone: interview.timeZone,
        }),
        time: format.dateTime(interview.at, {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: interview.timeZone,
        }),
      })
    : null;
  return (
    <div className="nb-page nb-rh-publiee nb-rh-envoye">
      {sent ? (
        <>
          <span className="nb-rh-ok" aria-hidden>
            <PhoneIcon name="coche" size={40} stroke={2.6} />
          </span>
          <h1>{t("title")}</h1>
          <p>{t("line", { name: interview.name })}</p>
        </>
      ) : (
        <>
          <h1>{t("titleWith", { name: interview.name })}</h1>
          <p>{interview.confirmed ? t("confirmed") : t("pending")}</p>
        </>
      )}
      <div className="nb-rh-rdv">
        <span className="nb-rh-rdv-m">{tm(`mode.${interview.mode}`)}</span>
        {when ? <b>{when}</b> : null}
        <span>
          {[
            interview.with.length ? tm("with", { names: interview.with.join(", ") }) : null,
            interview.mode === "onsite" ? interview.address : interview.link,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </div>
      {document ? (
        <Link href={`${file}/evaluation`} className="nb-bp">
          {tm("document")}
        </Link>
      ) : interview.at ? (
        <a href={`/app/hire/entretiens/${interview.id}/agenda`} className="nb-bp" download>
          {t("calendar")}
        </a>
      ) : null}
      <Link href={file} className="nb-bs">
        {t("file")}
      </Link>
      <Link href="/app/hire/candidats?vue=entretiens" className="nb-rh-lien-l">
        {t("all")}
      </Link>
    </div>
  );
}
