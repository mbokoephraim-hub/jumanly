import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { dynamic } from "@/i18n/dynamic";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { ImportDrop, ImportRow } from "@/components/talent/cv/import-file";
import { importGroups } from "@/components/talent/cv/import-groups";
import { applyCvImportAction, readCvFileAction } from "@/server/actions/cv-import";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { CV_FILE_MAX_BYTES } from "@/server/services/cv-file";
import { parseImport } from "@/server/services/cv-import";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("docs.import");
  return { title: t("seo"), robots: { index: false } };
}

const errors = ["format", "size", "empty", "unreadable"] as const;

/**
 * Importer un CV (planche talent-4 § 6): a PDF or a Word file (or the PDF LinkedIn makes of a
 * profile) is read on the server and never kept; what was found waits, group by group, for the
 * talent's tick before entering the profile.
 */
export default async function CvImportPage({ searchParams }: PageProps<"/app/profil/import">) {
  const query = await searchParams;
  const user = await requireUser("/app/profil/import");
  const t = await getTranslations();
  const pending = await db.aiSuggestion.findFirst({
    where: { userId: user.id, feature: "cv_parse", status: "pending" },
    orderBy: { createdAt: "desc" },
  });
  const read = pending ? parseImport(pending.payload) : null;
  const error = errors.find((code) => code === query.erreur);
  const megabytes = Math.round(CV_FILE_MAX_BYTES / (1024 * 1024));
  const groups = read ? importGroups(read, await getTranslations("docs.import")) : [];
  const undated = read?.experiences.filter((item) => !item.start).length ?? 0;

  return (
    <div className="t-flux t-od-bas">
      <FlowHead
        back="/app/career/cv"
        backLabel={t("docs.back")}
        title={t("docs.import.title")}
        end={
          <Link href="/app/career/cv" className="t-bi t-press" aria-label={t("offer.close")}>
            <TalentIcon name="fermer" size="s" />
          </Link>
        }
      />
      {error && (
        <Notice tone="err">{dynamic(t)(`docs.import.error.${error}`, { max: megabytes })}</Notice>
      )}

      <form action={readCvFileAction}>
        <ImportDrop
          id="import-fichier"
          label={t("docs.import.choose")}
          hint={t("docs.import.chooseHint", { max: megabytes })}
          reading={t("docs.import.reading")}
        />
      </form>
      <form action={readCvFileAction}>
        <ImportRow id="import-linkedin">
          <span className="t-cases t-ciel" aria-hidden>
            <TalentIcon name="connexion" size="s" />
          </span>
          <span className="t-t">
            <b>{t("docs.import.linkedin")}</b>
            <span>{t("docs.import.linkedinHint")}</span>
          </span>
          <TalentIcon name="suivant" size="s" />
        </ImportRow>
      </form>

      {read && (
        <form id="import-verifier" action={applyCvImportAction} className="t-flux">
          <input type="hidden" name="import" value={pending!.id} />
          <h2 className="t-ck-t">
            {read.file
              ? t("docs.import.readIn", { name: read.file.name })
              : t("docs.import.readTitle")}
          </h2>
          {groups.length === 0 ? (
            <div className="t-verre t-carte t-vide">
              <b>{t("docs.import.nothing.title")}</b>
              <p>{t("docs.import.nothing.text")}</p>
            </div>
          ) : (
            <div className="t-verre t-liste t-lignes">
              {groups.map((group) => (
                <label key={group.key} className="t-li">
                  <span className={`t-cases ${group.tone}`} aria-hidden>
                    <TalentIcon name={group.icon} size="s" />
                  </span>
                  <span className="t-t">
                    <b>{group.title}</b>
                    <span>{group.line}</span>
                  </span>
                  <input
                    type="checkbox"
                    role="switch"
                    name="groupe"
                    value={group.key}
                    defaultChecked
                    className="sr-only"
                  />
                  <span aria-hidden className="t-sw" />
                </label>
              ))}
            </div>
          )}
          {undated > 0 && (
            <p className="t-gar">
              <TalentIcon name="aide" size="s" />
              {t("docs.import.undated", { count: undated })}
            </p>
          )}
          {read.source === "rules" && (
            <p className="t-gar">
              <TalentIcon name="aide" size="s" />
              {t("docs.import.rulesOnly")}
            </p>
          )}
          <p className="t-gar">
            <TalentIcon name="cadenas" size="s" />
            {t("docs.import.note")}
          </p>
        </form>
      )}

      {read && groups.length > 0 && (
        <div className="t-verre t-fort t-bas-f">
          <button type="submit" form="import-verifier" className="t-bt t-p t-pl t-press">
            {t("docs.import.submit")}
          </button>
        </div>
      )}
    </div>
  );
}
