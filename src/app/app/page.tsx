import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import {
  ArcProgression,
  BoutonLien,
  Carte,
  EtatVide,
  TexteCarte,
  TitreCarte,
} from "@/components/ui";

/** Tableau de bord provisoire, pour montrer le gabarit de l'espace connecté. */
export default function TableauDeBord() {
  const t = useTranslations("espace.tableauDeBord");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-label font-medium tracking-wide text-feuille uppercase">
          {t("surtitre")}
        </p>
        <h1 className="mt-1 text-[28px] leading-9 font-semibold md:text-h1">{t("titre")}</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Carte className="flex items-center gap-5">
          <ArcProgression valeur={0} label={t("profilLabel")} taille={88} />
          <div>
            <TitreCarte>{t("profilTitre")}</TitreCarte>
            <TexteCarte>{t("profilTexte")}</TexteCarte>
          </div>
        </Carte>
        <EtatVide
          icone={<Sparkles aria-hidden className="size-6" />}
          titre={t("videTitre")}
          description={t("videTexte")}
          action={
            <BoutonLien href="/dev/composants" variante="contour" taille="sm">
              {t("voirComposants")}
            </BoutonLien>
          }
        />
      </div>
    </div>
  );
}
