import { useTranslations } from "next-intl";
import { Logo } from "@/components/ui";

export function PublicFooter() {
  const t = useTranslations("common");
  return (
    <footer className="bg-sapin text-blanc">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:justify-between">
        <div className="flex max-w-sm flex-col gap-3">
          <Logo variant="negative" height={30} />
          <p className="text-lg font-medium text-lime">{t("brand.slogan")}</p>
          <p className="text-sm text-blanc/75">{t("brand.byline")}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="tracking-wide text-neon uppercase text-label">{t("contact.title")}</p>
          <a href={`mailto:${t("contact.primaryEmail")}`} className="hover:text-lime">
            {t("contact.primaryEmail")}
          </a>
          <a href={`mailto:${t("contact.secondaryEmail")}`} className="hover:text-lime">
            {t("contact.secondaryEmail")}
          </a>
        </div>
      </div>
      <div className="border-t border-blanc/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-blanc/70 text-caption sm:px-6">
          {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
