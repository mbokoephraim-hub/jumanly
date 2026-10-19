import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TalentIcon } from "@/components/talent/icon";
import { Sheet } from "@/components/talent/sheet";
import { deleteDocumentAction } from "@/server/actions/career-documents";

/** The « … » sheet of a letter: open, PDF, delete (also on « Préparer LinkedIn »). */
export async function LetterMenu({
  letter,
  prefix = "lettre-menu-",
}: {
  letter: { id: string; title: string };
  /** Ids stay unique across the pages kept hidden by the router. */
  prefix?: string;
}) {
  const t = await getTranslations();
  return (
    <Sheet id={`${prefix}${letter.id}`} title={letter.title} closeLabel={t("offer.close")}>
      <div className="t-verre t-liste t-lignes">
        <div className="t-li">
          <span className="t-cases t-c2">
            <TalentIcon name="modifier" size="s" />
          </span>
          <span className="t-t">
            <Link href={`/app/career/documents/${letter.id}`} className="t-lien">
              <b>{t("docs.menu.openLetter")}</b>
            </Link>
          </span>
          <TalentIcon name="suivant" />
        </div>
        <div className="t-li">
          <span className="t-cases t-c1">
            <TalentIcon name="telecharger" size="s" />
          </span>
          <span className="t-t">
            <a href={`/app/career/documents/${letter.id}/pdf`} className="t-lien">
              <b>{t("docs.menu.pdf")}</b>
            </a>
          </span>
        </div>
        <form action={deleteDocumentAction} className="t-li t-danger">
          <input type="hidden" name="id" value={letter.id} />
          <span className="t-cases">
            <TalentIcon name="supprimer" size="s" />
          </span>
          <span className="t-t">
            <button type="submit" className="t-lien">
              <b>{t("docs.menu.delete")}</b>
            </button>
          </span>
        </form>
      </div>
    </Sheet>
  );
}
