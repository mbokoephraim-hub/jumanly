import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { sheetDataOf } from "@/components/phone/career/letter-data";
import { LetterModelPicker } from "@/components/phone/career/letter-models";
import { OrbiDisc, PhoneIcon } from "@/components/phone/icon";
import { chooseLetterDesignAction } from "@/server/actions/career-documents";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { TEMPLATES_ACCESS_KEY } from "@/server/services/cv";
import {
  getLetterWithDesign,
  letterFacts,
  letterTemplateAccess,
} from "@/server/services/letter-design";
import { listPublicPlans, talentPlanFor } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("letterModel");
  return { title: t("pick.title"), robots: { index: false } };
}

/**
 * Step 2 of a letter (Ephraïm, 31/10/2026): after « Retenir cette lettre », the person defines the
 * visual template: six templates, a colour, the photo or none, then « Valider le modèle ».
 */
export default async function LetterModelPage({
  params,
  searchParams,
}: PageProps<"/app/career/documents/[id]/modele">) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireUser(`/app/career/documents/${id}/modele`);
  const letter = await getLetterWithDesign(db, user.id, id);
  if (!letter) notFound();
  const [t, facts, access, plans, photo] = await Promise.all([
    getTranslations("letterModel"),
    letterFacts(db, user.id, letter.data.jobId),
    letterTemplateAccess(db, user.id),
    listPublicPlans(db),
    db.profilePhoto.findUnique({ where: { userId: user.id }, select: { userId: true } }),
  ]);
  const data = await sheetDataOf(facts, letter);
  const error =
    query.erreur === "locked"
      ? t("error.locked")
      : query.erreur === "input"
        ? t("error.input")
        : null;

  return (
    <div className="t-flux nb-lt-page lm-flux">
      <header className="nb-cv-tete nb-lt-tete">
        <Link href={`/app/career/documents/${id}`} className="nb-cv-retour" aria-label={t("back")}>
          <PhoneIcon name="retour" size={20} stroke={2} />
        </Link>
        <div className="nb-cv-titre">
          <h1>{t("pick.title")}</h1>
        </div>
      </header>
      <p className="nb-lt-bulle">
        <OrbiDisc size={28} />
        <span>{t("pick.lead")}</span>
      </p>
      <LetterModelPicker
        documentId={id}
        data={data}
        initial={letter.design}
        access={access}
        lockedPlan={talentPlanFor(plans, TEMPLATES_ACCESS_KEY, ["starter", "pro"])}
        hasPhoto={Boolean(photo) || Boolean(facts.photoUrl)}
        action={chooseLetterDesignAction}
        error={error}
      />
    </div>
  );
}
