import Image from "next/image";
import { useTranslations } from "next-intl";

const fichiers = {
  principal: { src: "/marque/jumanly-logo-principal.svg", largeur: 578, hauteur: 120 },
  negatif: { src: "/marque/jumanly-logo-negatif.svg", largeur: 578, hauteur: 120 },
  pictogramme: { src: "/marque/jumanly-pictogramme-sapin.svg", largeur: 120, hauteur: 120 },
};

/** Logo Jumanly. Hauteur en pixels ; la largeur suit les proportions. */
export function Logo({
  version = "principal",
  hauteur = 32,
}: {
  version?: keyof typeof fichiers;
  hauteur?: number;
}) {
  const t = useTranslations("commun.marque");
  const fichier = fichiers[version];
  return (
    <Image
      src={fichier.src}
      alt={t("nom")}
      width={Math.round((fichier.largeur / fichier.hauteur) * hauteur)}
      height={hauteur}
      priority
      unoptimized
    />
  );
}
