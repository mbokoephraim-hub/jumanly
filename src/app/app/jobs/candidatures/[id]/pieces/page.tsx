import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { MenuArt } from "@/components/site/menu-art";
import { submitPieceAction } from "@/server/actions/hire-verification";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { myVerification, received } from "@/server/services/hire-verification";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("talentPieces");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/**
 * « Déposer mes pièces » (« Logique du recrutement », la vérification des retenus): the pieces a
 * company asks the candidate, with the deadline. A file, an attestation of the Skills Passport in
 * one gesture, a referent (contacted only with the person's agreement) or a link. Nothing here
 * changes the application: applying stays free and nobody is rejected for a missing piece.
 */
export default async function PiecesPage({
  params,
  searchParams,
}: PageProps<"/app/jobs/candidatures/[id]/pieces">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/app/jobs/candidatures/${id}/pieces`);
  const t = await getTranslations("talentPieces");
  const tp = await getTranslations("phoneRhPieces");
  const format = await getFormatter();
  const data = await myVerification(db, user.id, id.slice(0, 60));
  if (!data) notFound();
  const { request, certificates, educations } = data;
  const { job } = request.application;
  const open = request.application.status === "active";
  const error = one(query.erreur);
  const done = request.items.filter(received).length;

  return (
    <div className="nb-page jm-pieces">
      {one(query.ok) ? <ToastOnLoad message={t("ok")} tone="success" /> : null}
      <header className="jm-pieces-h">
        <Link href="/app/jobs/candidatures" className="jm-pieces-retour">
          {t("back")}
        </Link>
        <h1>
          <MenuArt name="letter" size="sm" />
          {t("title")}
        </h1>
        <p>{t("lead", { company: job.organization.name, jobTitle: job.title })}</p>
        <p className="jm-pieces-compte">
          {t("progress", { done, total: request.items.length, date: request.dueAt })}
        </p>
      </header>
      {error ? (
        <p className="jm-pieces-erreur" role="alert">
          {error === "size"
            ? t("error.size")
            : error === "type"
              ? t("error.type")
              : t("error.other")}
        </p>
      ) : null}
      <section className="jm-pieces-s">
        <p className="jm-pieces-message">{request.message}</p>
        <p className="jm-pieces-meta">{t("privacy")}</p>
      </section>
      <ul className="jm-pieces-depots">
        {request.items.map((item) => (
          <li key={item.id} className="jm-pieces-s" data-recu={received(item) ? "" : undefined}>
            <h2>
              {tp(`piece.${item.kind}`)}
              <span>
                {received(item)
                  ? t("state.received", {
                      date: format.dateTime(item.receivedAt!, { day: "numeric", month: "long" }),
                    })
                  : item.required
                    ? t("state.required")
                    : t("state.optional")}
              </span>
            </h2>
            {open ? (
              <form
                action={submitPieceAction}
                className="jm-pieces-form"
                id={`piece-${item.id}`}
                encType="multipart/form-data"
              >
                <input type="hidden" name="application" value={request.application.id} />
                <input type="hidden" name="item" value={item.id} />
                {item.kind === "referent" ? (
                  <>
                    <label className="jm-pieces-champ">
                      {t("referent.name")}
                      <input
                        name="referentName"
                        maxLength={120}
                        defaultValue={item.referentName ?? ""}
                        required
                      />
                    </label>
                    <label className="jm-pieces-champ">
                      {t("referent.email")}
                      <input
                        type="email"
                        name="referentEmail"
                        maxLength={200}
                        defaultValue={item.referentEmail ?? ""}
                        required
                      />
                    </label>
                    <p className="jm-pieces-meta">{t("referent.consent")}</p>
                  </>
                ) : (
                  <>
                    {(item.kind === "certificate" || item.kind === "diploma") &&
                    certificates.length > 0 ? (
                      <label className="jm-pieces-champ">
                        {t("reuse")}
                        <select name="certificate" defaultValue={item.certificateCode ?? ""}>
                          <option value="">{t("reuseNone")}</option>
                          {certificates.map((certificate) => (
                            <option key={certificate.code} value={certificate.code}>
                              {certificate.courseTitle}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    {(item.kind === "diploma" || item.kind === "transcript") &&
                    educations.length > 0 ? (
                      <label className="jm-pieces-champ">
                        {t("education")}
                        <select name="education" defaultValue={item.educationId ?? ""}>
                          <option value="">{t("educationNone")}</option>
                          {educations.map((education) => (
                            <option key={education.id} value={education.id}>
                              {[education.degree, education.school, education.endYear]
                                .filter(Boolean)
                                .join(" · ")}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    <label className="jm-pieces-champ">
                      {item.fileName ? t("fileReplace", { name: item.fileName }) : t("file")}
                      <input
                        type="file"
                        name="file"
                        accept="application/pdf,image/png,image/jpeg,image/webp"
                      />
                    </label>
                    {item.kind === "portfolio" || item.kind === "test" || item.kind === "thesis" ? (
                      <label className="jm-pieces-champ">
                        {t(`note.${item.kind}`)}
                        <input name="note" maxLength={500} defaultValue={item.note ?? ""} />
                      </label>
                    ) : null}
                  </>
                )}
                <button type="submit" className="jm-pieces-envoyer">
                  {received(item) ? t("update") : t("send")}
                </button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
