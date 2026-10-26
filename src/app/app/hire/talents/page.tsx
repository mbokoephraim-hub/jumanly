import { getTranslations } from "next-intl/server";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { RhBell, RhTab } from "@/components/phone/recruteur/head";
import { RhTalents, RhTalentsTexts } from "@/components/phone/recruteur/talents";
import { requireHire } from "@/server/hire-context";
import { isPhone } from "@/server/view";

const TOASTS = [
  "masque",
  "liste",
  "relation",
  "ignoree",
  "invitation",
  "relance",
  "supprime",
] as const;

/**
 * Talents (Modèle B): on a phone the first screen of the Talents tab (lots M1 and M6); on a
 * computer and a tablet, the entry « Talents » of the sidebar (lot N1).
 */
export default async function TalentsRedirect({ searchParams }: PageProps<"/app/hire/talents">) {
  const query = await searchParams;
  // On a phone, Talents is a tab of its own (Modèle B recruteur, lots M1 and M6).
  if (await isPhone()) {
    const { ctx } = await requireHire("/app/hire/talents", "readApplications");
    const t = await getTranslations("phoneRhTalents");
    const ok = TOASTS.find((key) => key === query.ok);
    return (
      <RhTab tab="talents" legacy={false} actions={<RhBell />}>
        {ok ? <ToastOnLoad message={t(`ok.${ok}`)} tone="success" /> : null}
        {typeof query.erreur === "string" ? (
          <p className="nb-erreur nb-rh-marge" role="alert">
            {t("error.other")}
          </p>
        ) : null}
        <RhTalentsTexts>
          <RhTalents ctx={ctx} query={query} />
        </RhTalentsTexts>
      </RhTab>
    );
  }
  // On a computer and a tablet, the same search in the frame of the recruiter (lot N1); its
  // columns come with lot N5.
  const { ctx } = await requireHire("/app/hire/talents", "readApplications");
  return (
    <div className="rb-fil">
      <RhTalentsTexts>
        <RhTalents ctx={ctx} query={query} />
      </RhTalentsTexts>
    </div>
  );
}
