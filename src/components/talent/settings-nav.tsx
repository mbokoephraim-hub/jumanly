import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { cx } from "@/lib/cx";

export type SettingsSection = "affichage" | "securite" | "confidentialite" | "notifications";

/**
 * The rubrics of « Paramètres » on a tablet or a computer (planche web talent-4 § 8, `.snav`):
 * at the left on a computer, as chips on a tablet. On a phone, the list of the page leads to them.
 */
export async function SettingsNav({ on }: { on: SettingsSection }) {
  const t = await getTranslations();
  const item = (section: SettingsSection, href: string, icon: TalentIconName, label: string) => (
    <Link
      href={href}
      aria-current={on === section ? "page" : undefined}
      className={cx("t-press", on === section && "t-on")}
    >
      <span className="t-cases" aria-hidden>
        <TalentIcon name={icon} size="s" />
      </span>
      {label}
    </Link>
  );
  return (
    <nav aria-label={t("parametres.title")} className="t-verre t-w4-snav t-w4-web">
      {item("securite", "/app/parametres/securite", "cadenas", t("parametres.security.title"))}
      {item(
        "confidentialite",
        "/app/parametres/confidentialite",
        "confidentialite",
        t("parametres.privacy.title"),
      )}
      {item(
        "notifications",
        "/app/parametres/notifications",
        "notification",
        t("parametres.notifications.title"),
      )}
      <span className="t-w4-sp" aria-hidden />
      {item("affichage", "/app/parametres", "orbi", t("parametres.group.device"))}
      <a href="/app/parametres/export" download className="t-press">
        <span className="t-cases" aria-hidden>
          <TalentIcon name="telecharger" size="s" />
        </span>
        {t("parametres.group.data")}
      </a>
      <span className="t-w4-sp" aria-hidden />
      <Link href="/app/parametres?supprimer=1" className="t-press t-w4-dg">
        <span className="t-cases" aria-hidden>
          <TalentIcon name="supprimer" size="s" />
        </span>
        {t("parametres.delete.title")}
      </Link>
    </nav>
  );
}
