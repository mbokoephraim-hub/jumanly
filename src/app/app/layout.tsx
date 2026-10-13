import { useTranslations } from "next-intl";
import { CoqueEspace } from "@/components/mise-en-page/coque-espace";

/** Gabarit de l'espace connecté. L'authentification arrive à l'étape E2. */
export default function GabaritEspace({ children }: LayoutProps<"/app">) {
  const t = useTranslations("espace");
  return <CoqueEspace nomUtilisateur={t("utilisateurExemple")}>{children}</CoqueEspace>;
}
