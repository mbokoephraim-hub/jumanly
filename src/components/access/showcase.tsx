import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { TalentIcon } from "@/components/talent/icon";
import { AccessMark } from "./frame";

/**
 * The brand panel left of the form on a computer (refonte-web talent-4 `VIT`): the promise, three
 * pills and two cards that illustrate the app (the same for everyone, never an account's data).
 * Hidden below 1200 px, where the form is alone.
 */
export async function AccessShowcase() {
  const t = await getTranslations("access");
  return (
    <aside className="t-vit" aria-labelledby="acces-promesse">
      <Link href="/" aria-label={t("home")} className="t-lgo">
        <AccessMark tone="glass" />
        <span aria-hidden>{t("brand")}</span>
      </Link>
      <h2 id="acces-promesse">{t.rich("showcase.title", { em: (words) => <em>{words}</em> })}</h2>
      <p>{t("showcase.text")}</p>
      <ul className="t-pls">
        {(["pill1", "pill2", "pill3"] as const).map((key) => (
          <li key={key}>
            <TalentIcon name="valider" size="xs" />
            {t(`showcase.${key}`)}
          </li>
        ))}
      </ul>
      <div className="t-flot" aria-hidden>
        <span className="t-lg-e t-sap">{t("showcase.jobInitials")}</span>
        <span className="t-t">
          <b>{t("showcase.jobTitle")}</b>
          <span>{t("showcase.jobPlace")}</span>
        </span>
        <span className="t-anneau">
          <b>{t("showcase.jobMatch")}</b>
        </span>
      </div>
      <div className="t-flot t-f2" aria-hidden>
        <OrbiMark size={40} />
        <span className="t-t">
          <b>{t("showcase.orbi")}</b>
          <span>{t("showcase.orbiText")}</span>
        </span>
      </div>
    </aside>
  );
}
