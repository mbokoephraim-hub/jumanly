import { getTranslations } from "next-intl/server";

/**
 * Waiting screen of a whole space (signed-in space, admin) while its frame loads: only the thin
 * bar of the navigation runs along the top, on the space's own background. No grey block
 * (demande d'Ephraïm du 27/10/2026 : « un aperçu gris qui s'affiche » après un enregistrement).
 */
export async function ShellLoading() {
  const t = await getTranslations("common");
  return (
    <div role="status" className="min-h-dvh">
      <div aria-hidden className="jm-nav-progress" data-active />
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
}
