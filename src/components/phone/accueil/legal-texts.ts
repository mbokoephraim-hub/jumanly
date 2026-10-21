import { getTranslations } from "next-intl/server";
import { CONTACT_EMAIL } from "@/components/recruiter/avatar-menu";
import type { LegalTexts } from "./auth";

/** Texts of « En continuant, vous acceptez… » and of its two sheets. */
export async function legalTexts(): Promise<LegalTexts> {
  const t = await getTranslations("phoneAccueil");
  const [before = "", rest = ""] = t("signup.legal", { terms: "\u0000", privacy: "\u0001" }).split(
    "\u0000",
  );
  const [between = "", after = ""] = rest.split("\u0001");
  return {
    sentence: { before, between, after },
    terms: {
      link: t("signup.terms"),
      title: t("legal.terms.title"),
      points: [t("legal.terms.p1"), t("legal.terms.p2"), t("legal.terms.p3")],
    },
    privacy: {
      link: t("signup.privacy"),
      title: t("legal.privacy.title"),
      points: [t("legal.privacy.p1"), t("legal.privacy.p2"), t("legal.privacy.p3")],
    },
    subtitle: t("legal.subtitle"),
    questions: t("legal.questions", { email: CONTACT_EMAIL }),
    full: t("legal.full"),
    ok: t("legal.ok"),
    close: t("close"),
  };
}
