import "server-only";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PhoneIcon } from "../icon";
import { CvFrame } from "./frame";
import { CvMark } from "./marks";

/**
 * « Nouveau CV · Comment voulez-vous commencer ? » (capture 06): Orbi prepares it (the fastest),
 * a template, or an import. The downloaded CV carries no Jumanly logo or colour.
 */
export async function CvStart({ percent, error }: { percent: number; error: string | null }) {
  const t = await getTranslations("phoneCv");
  const ways = [
    { key: "orbi", mark: "orbi", fast: true },
    { key: "modele", mark: "modele", fast: false },
    { key: "import", mark: "import", fast: false },
  ] as const;
  return (
    <CvFrame
      title={t("start.title")}
      sub={t("start.sub")}
      back={{ href: "/app/career/cv?onglet=cv", label: t("close"), close: true }}
    >
      {error ? (
        <p className="nb-cv-erreur" role="alert">
          {error}
        </p>
      ) : null}
      <div className="nb-cv-hero">
        <span className="nb-cv-hero-pages" aria-hidden>
          <span className="nb-cv-mini" data-fond="">
            <i data-titre="" />
            <i data-sous="" />
            <i />
            <i />
            <i data-w="70" />
            <i data-menthe="" />
            <i />
            <i data-w="80" />
          </span>
          <span className="nb-cv-mini">
            <i data-titre="" data-bleu="" />
            <i data-sous="" />
            <i />
            <i />
            <i data-w="70" />
            <i data-ambre="" />
            <i />
            <i data-w="80" />
          </span>
        </span>
        <b>{t("start.filled", { percent })}</b>
      </div>
      <ul className="nb-cv-departs">
        {ways.map((way, index) => (
          <li key={way.key} style={{ animationDelay: `${0.06 * index + 0.1}s` }}>
            <Link
              href={`/app/career/cv/nouveau?etape=${way.key}`}
              className="nb-cv-depart"
              data-cle={way.key}
            >
              <span className="nb-cv-depart-i" aria-hidden>
                <CvMark name={way.mark} size={24} />
              </span>
              <span className="nb-cv-depart-t">
                <b>
                  {t(`start.${way.key}`)}
                  {way.fast ? <em>{t("start.fastest")}</em> : null}
                </b>
                <small>{t(`start.${way.key}Text`)}</small>
              </span>
              <PhoneIcon name="chevron" size={18} />
            </Link>
          </li>
        ))}
      </ul>
      <p className="nb-cv-note" data-centre="">
        {t("start.noLogo")}
      </p>
    </CvFrame>
  );
}
