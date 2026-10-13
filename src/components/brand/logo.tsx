import Image from "next/image";
import { useTranslations } from "next-intl";

const files = {
  primary: { src: "/marque/jumanly-logo-principal.svg", width: 578, height: 120 },
  negative: { src: "/marque/jumanly-logo-negatif.svg", width: 578, height: 120 },
  symbol: { src: "/marque/jumanly-pictogramme-sapin.svg", width: 120, height: 120 },
  symbolLight: { src: "/marque/jumanly-pictogramme-blanc.svg", width: 120, height: 120 },
};

/** Jumanly logo. `height` in pixels; the width follows the proportions. */
export function Logo({
  variant = "primary",
  height = 32,
}: {
  variant?: keyof typeof files;
  height?: number;
}) {
  const t = useTranslations("common");
  const file = files[variant];
  return (
    <Image
      src={file.src}
      alt={t("brand")}
      width={Math.round((file.width / file.height) * height)}
      height={height}
      priority
      unoptimized
    />
  );
}
