import { useTranslations } from "next-intl";
import { NotFoundContent } from "@/components/site/not-found-content";
import { AppSystemCard } from "@/components/site/system-page";

/** Page 404 in the signed-in space: same message, kept in the application template. */
export default function AppNotFound() {
  const t = useTranslations();
  return (
    <AppSystemCard eyebrow={t("common.brand")} title={t("system.404.pageTitle")}>
      <NotFoundContent space="app" />
    </AppSystemCard>
  );
}
