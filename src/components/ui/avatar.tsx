/* eslint-disable @next/next/no-img-element -- les avatars viendront du stockage S3 (taille connue, pas d'optimisation nécessaire) */
import { cx } from "@/lib/cx";

const tailles = { sm: "size-8 text-xs", md: "size-11 text-sm", lg: "size-16 text-lg" };

function initiales(nom: string) {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0]?.toUpperCase())
    .join("");
}

export function Avatar({
  nom,
  image,
  taille = "md",
}: {
  nom: string;
  image?: string;
  taille?: keyof typeof tailles;
}) {
  const classes = cx("inline-flex shrink-0 rounded-full", tailles[taille]);
  if (image) return <img src={image} alt={nom} className={cx(classes, "object-cover")} />;
  return (
    <span
      role="img"
      aria-label={nom}
      className={cx(classes, "items-center justify-center bg-sapin font-semibold text-lime")}
    >
      {initiales(nom)}
    </span>
  );
}
