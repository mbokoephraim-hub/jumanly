import { useTranslations } from "next-intl";
import { BoutonLien, Pastille } from "@/components/ui";

/** Accueil provisoire : la vraie page d'accueil arrive à l'étape E1. */
export default function Accueil() {
  const t = useTranslations("accueil");
  return (
    <section className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-16 sm:px-6 md:py-28">
      <Pastille ton="lime">{t("pastille")}</Pastille>
      <h1 className="max-w-3xl text-[40px] leading-[46px] font-semibold tracking-tight md:text-display md:leading-[64px]">
        {t("titre")}
      </h1>
      <p className="max-w-xl text-lg leading-8 text-ardoise">{t("sousTitre")}</p>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <BoutonLien href="/inscription" taille="lg">
          {t("creerCompte")}
        </BoutonLien>
        <BoutonLien href="/connexion" variante="contour" taille="lg">
          {t("seConnecter")}
        </BoutonLien>
      </div>
    </section>
  );
}
