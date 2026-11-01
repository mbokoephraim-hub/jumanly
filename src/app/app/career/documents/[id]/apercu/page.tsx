import type { Metadata } from "next";
// Loaded with the page, so an app opened before an update still gets it (Ephraïm, 31/10/2026).
import "@/styles/letter-models.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { sheetDataOf } from "@/components/phone/career/letter-data";
import { LetterSave } from "@/components/phone/career/letter-save";
import { PhoneIcon } from "@/components/phone/icon";
import { LetterSheet } from "@/features/letter/LetterSheet";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getLetterWithDesign, letterFacts } from "@/server/services/letter-design";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("letterModel");
  return { title: t("preview.title"), robots: { index: false } };
}

/**
 * Step 3 of a letter (Ephraïm, 31/10/2026): the letter as it will be printed, in its template.
 * « Choisir un autre modèle » goes back to step 2; « Enregistrer cette lettre » downloads the PDF
 * and confirms that the letter is in Mes documents.
 */
export default async function LetterPreviewPage({
  params,
}: PageProps<"/app/career/documents/[id]/apercu">) {
  const { id } = await params;
  const user = await requireUser(`/app/career/documents/${id}/apercu`);
  const letter = await getLetterWithDesign(db, user.id, id);
  if (!letter) notFound();
  const [t, facts] = await Promise.all([
    getTranslations("letterModel"),
    letterFacts(db, user.id, letter.data.jobId),
  ]);
  const data = await sheetDataOf(facts, { text: letter.data.text, updatedAt: letter.updatedAt });
  const models = `/app/career/documents/${id}/modele`;

  return (
    <div className="t-flux nb-lt-page lm-flux">
      <header className="nb-cv-tete nb-lt-tete">
        <Link href={models} className="nb-cv-retour" aria-label={t("back")}>
          <PhoneIcon name="retour" size={20} stroke={2} />
        </Link>
        <div className="nb-cv-titre">
          <h1>{t("preview.title")}</h1>
        </div>
        <Link href={`/app/career/documents/${id}`} className="lm-haut-lien">
          <PhoneIcon name="modifier" size={16} />
          {t("preview.editText")}
        </Link>
      </header>
      <div className="lm-apercu">
        <LetterSheet data={data} design={letter.design} />
      </div>
      <div className="lm-bas lm-bas-2">
        <Link href={models} className="nb-lt-annuler">
          {t("preview.other")}
        </Link>
        <LetterSave
          pdf={`/app/career/documents/${id}/pdf`}
          back="/app/career/cv?onglet=documents"
          texts={{
            save: t("preview.save"),
            saving: t("preview.saving"),
            error: t("preview.error"),
            title: t("saved.title"),
            text: t("saved.text"),
            backLabel: t("saved.back"),
          }}
        />
      </div>
    </div>
  );
}
