import { getTranslations } from "next-intl/server";
import { CONTACT_EMAIL } from "@/components/recruiter/avatar-menu";
import type { LegalTexts } from "./auth";

/**
 * Texts of « En continuant, vous acceptez… » and of its two sheets; a recruiter reads its own three
 * points (Modèle B recruteur, « Conditions pour les recruteurs »).
 */
export async function legalTexts(recruiter = false): Promise<LegalTexts> {
  const t = await getTranslations("phoneAccueil");
  const tr = await getTranslations("phoneRhAccueil.legal");
  const [before = "", rest = ""] = t("signup.legal", { terms: "\u0000", privacy: "\u0001" }).split(
    "\u0000",
  );
  const [between = "", after = ""] = rest.split("\u0001");
  return {
    sentence: { before, between, after },
    terms: {
      link: t("signup.terms"),
      title: recruiter ? tr("terms.title") : t("legal.terms.title"),
      points: recruiter
        ? [tr("terms.p1"), tr("terms.p2"), tr("terms.p3")]
        : [t("legal.terms.p1"), t("legal.terms.p2"), t("legal.terms.p3")],
    },
    privacy: {
      link: t("signup.privacy"),
      title: t("legal.privacy.title"),
      points: recruiter
        ? [tr("privacy.p1"), tr("privacy.p2"), tr("privacy.p3")]
        : [t("legal.privacy.p1"), t("legal.privacy.p2"), t("legal.privacy.p3")],
    },
    subtitle: t("legal.subtitle"),
    questions: t("legal.questions", { email: CONTACT_EMAIL }),
    full: t("legal.full"),
    ok: t("legal.ok"),
    close: t("close"),
  };
}
