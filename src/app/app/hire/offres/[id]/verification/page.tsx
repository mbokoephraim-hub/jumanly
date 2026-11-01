import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { MenuArt } from "@/components/site/menu-art";
import { requestPiecesAction } from "@/server/actions/hire-verification";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { HireError, hirePermissions } from "@/server/services/hire";
import { effectiveRights } from "@/server/services/org-team";
import {
  complete,
  defaultDueAt,
  received,
  retainedWithoutPieces,
  verificationBoard,
  verificationLevel,
  verificationPieces,
  type VerificationCheck,
} from "@/server/services/hire-verification";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneRhPieces");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/** Pieces asked by default: the diploma and two referents' worth of proof, all required. */
const DEFAULT_PIECES = new Set(["diploma", "referent"]);

/**
 * « Dossier de vérification » of an offer (« Logique du recrutement », la vérification des
 * retenus): ask the retained for pieces with a deadline, then follow who sent what (« 3 sur 4 ont
 * tout envoyé »), with Orbi's points « à vérifier ». The files open for the team only, logged.
 */
export default async function VerificationPage({
  params,
  searchParams,
}: PageProps<"/app/hire/offres/[id]/verification">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { ctx, space } = await requireHire(
    `/app/hire/offres/${id}/verification`,
    "readApplications",
  );
  const t = await getTranslations("phoneRhPieces");
  const format = await getFormatter();
  const board = await verificationBoard(db, ctx, id).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const { job } = board;
  const allowed = await verificationLevel(db, ctx.organizationId);
  const canAsk =
    allowed !== "none" &&
    hirePermissions(ctx.role).manage &&
    effectiveRights(space.role, space.rights).sort;
  const waiting = canAsk ? await retainedWithoutPieces(db, ctx, job.id) : [];
  const company = await db.organization.findUnique({
    where: { id: ctx.organizationId },
    select: { name: true },
  });
  const due = defaultDueAt().toISOString().slice(0, 10);
  const sent = Number(one(query.envoye) ?? "");
  const error = one(query.erreur);
  const checkText = (check: VerificationCheck) =>
    check.key === "school_not_in_cv"
      ? t("check.school", check.values)
      : t("check.year", check.values);

  return (
    <div className="nb-page jm-pieces">
      {sent > 0 ? <ToastOnLoad message={t("sent", { count: sent })} tone="success" /> : null}
      <header className="jm-pieces-h">
        <Link href={`/app/hire/offres/${job.id}?vue=candidats`} className="jm-pieces-retour">
          {t("back")}
        </Link>
        <h1>
          <MenuArt name="privacy" size="sm" />
          {t("title")}
        </h1>
        <p>{job.title}</p>
      </header>

      {error ? (
        <p className="jm-pieces-erreur" role="alert">
          {t("error")}
        </p>
      ) : null}

      <section className="jm-pieces-s" aria-labelledby="pieces-suivi">
        <h2 id="pieces-suivi">{t("follow.title")}</h2>
        {board.total === 0 ? (
          <p className="jm-pieces-meta">{t("follow.none")}</p>
        ) : (
          <>
            <p className="jm-pieces-compte">
              {t("follow.count", { done: board.done, total: board.total })}
            </p>
            <div className="jm-pieces-barre" aria-hidden>
              <i style={{ width: `${Math.round((board.done / board.total) * 100)}%` }} />
            </div>
            <ul className="jm-pieces-liste">
              {board.requests.map((request) => {
                const late = !complete(request.items) && request.dueAt < new Date();
                return (
                  <li key={request.id}>
                    <div className="jm-pieces-qui">
                      <Link href={`/app/hire/candidats/${request.application.id}`}>
                        {request.application.profile.user.name}
                      </Link>
                      <span
                        data-etat={complete(request.items) ? "ok" : late ? "retard" : "attente"}
                      >
                        {complete(request.items)
                          ? t("follow.complete")
                          : late
                            ? t("follow.late")
                            : t("follow.due", { date: request.dueAt })}
                      </span>
                    </div>
                    <ul>
                      {request.items.map((item) => {
                        const checks = (Array.isArray(item.checks)
                          ? item.checks
                          : []) as unknown as VerificationCheck[];
                        return (
                          <li key={item.id} data-recu={received(item) ? "" : undefined}>
                            <span>
                              {t(`piece.${item.kind}`)}
                              {item.required ? null : ` ${t("optional")}`}
                            </span>
                            {!received(item) ? (
                              <b>{t("state.pending")}</b>
                            ) : (
                              <span className="jm-pieces-recu">
                                {item.fileKey ? (
                                  <a href={`/api/hire/pieces/${item.id}`} target="_blank">
                                    {item.fileName ?? t("state.file")}
                                  </a>
                                ) : null}
                                {item.certificateCode ? (
                                  <Link href={`/attestations/${item.certificateCode}`}>
                                    {t("state.certificate")}
                                  </Link>
                                ) : null}
                                {item.referentEmail ? (
                                  <span>
                                    {t("state.referent", {
                                      name: item.referentName ?? "",
                                      email: item.referentEmail,
                                    })}
                                  </span>
                                ) : null}
                                {item.note ? <span>{item.note}</span> : null}
                                {checks.map((check) => (
                                  <em key={check.key}>{checkText(check)}</em>
                                ))}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>
            <p className="jm-pieces-meta">{t("follow.rule")}</p>
          </>
        )}
      </section>

      {allowed === "none" ? (
        <section className="jm-pieces-s jm-pieces-lock" aria-labelledby="pieces-formule">
          <h2 id="pieces-formule">
            <MenuArt name="pricing" size="xs" />
            {t("lock.title")}
          </h2>
          <p className="jm-pieces-meta">{t("lock.text")}</p>
          <Link href="/app/abonnement/formules" className="jm-pieces-envoyer">
            {t("lock.see")}
          </Link>
        </section>
      ) : null}
      {canAsk ? (
        <section className="jm-pieces-s" aria-labelledby="pieces-demander">
          <h2 id="pieces-demander">{t("ask.title")}</h2>
          {waiting.length === 0 ? (
            <p className="jm-pieces-meta">{t("ask.none")}</p>
          ) : (
            <form action={requestPiecesAction} className="jm-pieces-form" id={`pieces-${job.id}`}>
              <input type="hidden" name="job" value={job.id} />
              <fieldset>
                <legend>{t("ask.who")}</legend>
                {waiting.map((application) => (
                  <label key={application.id}>
                    <input type="checkbox" name="ids" value={application.id} defaultChecked />
                    {application.profile.user.name}
                  </label>
                ))}
              </fieldset>
              <fieldset>
                <legend>{t("ask.what")}</legend>
                {verificationPieces.map((kind) => (
                  <div key={kind} className="jm-pieces-piece">
                    <label>
                      <input
                        type="checkbox"
                        name={`piece-${kind}`}
                        defaultChecked={DEFAULT_PIECES.has(kind)}
                      />
                      {t(`piece.${kind}`)}
                    </label>
                    <label className="jm-pieces-oblig">
                      <input type="checkbox" name={`required-${kind}`} defaultChecked />
                      {t("ask.required")}
                    </label>
                  </div>
                ))}
              </fieldset>
              <label className="jm-pieces-champ">
                {t("ask.due")}
                <input type="date" name="due" defaultValue={due} required />
              </label>
              <label className="jm-pieces-champ">
                {t("ask.message")}
                <textarea
                  name="message"
                  rows={6}
                  maxLength={2000}
                  readOnly={allowed !== "custom"}
                  defaultValue={t("ask.template", {
                    company: company?.name ?? "",
                    jobTitle: job.title,
                    date: format.dateTime(new Date(`${due}T12:00:00Z`), {
                      day: "numeric",
                      month: "long",
                    }),
                  })}
                />
              </label>
              {allowed !== "custom" ? (
                <p className="jm-pieces-meta">{t("ask.standardOnly")}</p>
              ) : null}
              <p className="jm-pieces-meta">{t("ask.rule")}</p>
              <button type="submit" className="jm-pieces-envoyer">
                {t("ask.send")}
              </button>
            </form>
          )}
        </section>
      ) : null}
    </div>
  );
}
