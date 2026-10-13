import { useTranslations } from "next-intl";
import { Logo } from "@/components/ui";

export function PiedDePagePublic() {
  const t = useTranslations("commun");
  return (
    <footer className="bg-sapin text-blanc">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:justify-between">
        <div className="flex max-w-sm flex-col gap-3">
          <Logo version="negatif" hauteur={30} />
          <p className="text-lg font-medium text-lime">{t("marque.slogan")}</p>
          <p className="text-sm text-blanc/75">{t("marque.portePar")}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-label font-medium tracking-wide text-neon uppercase">
            {t("contact.titre")}
          </p>
          <a href={`mailto:${t("contact.emailPrincipal")}`} className="hover:text-lime">
            {t("contact.emailPrincipal")}
          </a>
          <a href={`mailto:${t("contact.emailSecondaire")}`} className="hover:text-lime">
            {t("contact.emailSecondaire")}
          </a>
        </div>
      </div>
      <div className="border-t border-blanc/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-legende text-blanc/60 sm:px-6">
          {t("piedDePage.droits")}
        </p>
      </div>
    </footer>
  );
}
