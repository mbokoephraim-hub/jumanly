import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { cx } from "@/lib/cx";
import {
  removeVerificationDocumentAction,
  requestVerificationAction,
} from "@/server/actions/organization";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { listPublicPlans, orgPlanFor } from "@/server/services/plans";
import { VERIFICATION_DAYS } from "@/server/services/verification";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("org.verification");
  return { title: t("title"), robots: { index: false } };
}

/** « 1,2 Mo », « 840 Ko ». */
function fileSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`
    : `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

/**
 * Vérifier l'entreprise (étape 3, A6), reached from Page entreprise: the progress in three steps
 * (the legal information, an official document, Jumanly's review), the documents sent, the form
 * when something is missing, and what changes meanwhile. For the owner and the administrators
 * only, on the Modèle B; requests and documents stay those of the active organization
 * (`org.verified_profile`). The form posts to the server, so the page needs no script.
 */
export default async function OrganizationVerificationPage({
  searchParams,
}: PageProps<"/app/organisation/verification">) {
  const params = await searchParams;
  const { ctx } = await requireHire("/app/organisation/verification", "administer");
  const t = await getTranslations("org.verification");
  const tw = await getTranslations("hireWeb3.verification");
  const tr = await getTranslations("rhVerification");
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [organization, entitled, plans] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: {
        name: true,
        verificationStatus: true,
        verifiedAt: true,
        verificationReason: true,
        verificationRequest: true,
        verificationRequestedAt: true,
        documents: {
          orderBy: { createdAt: "asc" },
          select: { id: true, name: true, size: true, createdAt: true },
        },
      },
    }),
    can(db, subject, "org.verified_profile"),
    listPublicPlans(db),
  ]);
  const status = organization.verificationStatus;
  const previous = (organization.verificationRequest ?? {}) as Record<string, string>;
  const verified = status === "verified";
  const open = status === "none" || status === "rejected" || status === "info_requested";
  const steps: {
    key: "legal" | "document" | "review";
    done: boolean;
    line: string;
    tag?: string;
  }[] = [
    {
      key: "legal",
      done: verified || Boolean(previous.registration),
      line: verified ? tr("checked") : previous.registration ? tr("legal.done") : tr("legal.todo"),
    },
    {
      key: "document",
      done: verified || organization.documents.length > 0,
      line: verified
        ? tr("checked")
        : organization.documents.length > 0
          ? tr("document.done", { count: organization.documents.length })
          : tr("document.todo"),
    },
    {
      key: "review",
      done: verified,
      line: verified
        ? tr("review.done", { date: organization.verifiedAt ?? new Date() })
        : status === "pending"
          ? tr("review.pending", { days: VERIFICATION_DAYS })
          : tr("review.todo"),
      tag: status === "none" || verified ? undefined : t(`status.${status}`),
    },
  ];
  const done = steps.filter((step) => step.done).length;
  const errorKey = one(params.erreur);
  const errorText: Record<string, string> = {
    verification: t("invalid"),
    fileType: t("fileError.fileType"),
    fileSize: t("fileError.fileSize"),
    fileCount: t("fileError.fileCount"),
    status: t("fileError.status"),
  };
  const notice =
    one(params.ok) === "1"
      ? t("submitted", { days: VERIFICATION_DAYS })
      : one(params.ok) === "documentRetire"
        ? t("documents.removed")
        : null;
  const problem =
    status === "info_requested" && organization.verificationReason
      ? t("infoRequested", { reason: organization.verificationReason })
      : status === "rejected" && organization.verificationReason
        ? t("rejected.reason", { reason: organization.verificationReason })
        : null;

  return (
    <div className="ae-app ae-page">
      <Link href="/app/organisation" className="ae-lien-doux ae-st-retour">
        {tr("back")}
      </Link>
      <h1 className="ae-h1">{tr("title")}</h1>
      <p className="ae-meta ae-jr-intro">{organization.name}</p>
      {notice && (
        <p role="status" className="ae-encadre ae-encadre-lime ae-st-avis">
          {notice}
        </p>
      )}
      {errorKey && (
        <p role="alert" className="ae-encadre ae-st-avis ae-st-erreur">
          {errorText[errorKey] ?? t("invalid")}
        </p>
      )}

      <div className="ae-carte ae-vf-tete">
        <span
          className="ae-vf-anneau"
          style={{ "--p": Math.round((done / 3) * 100) } as React.CSSProperties}
        >
          {tr("progress", { done, total: 3 })}
        </span>
        <span>
          <b>
            {verified
              ? tr("head.verified")
              : status === "pending"
                ? tr("head.pending")
                : done === 2
                  ? tr("head.last")
                  : tr("head.start")}
          </b>
          <span className="ae-meta ae-st-meta">{t("subtitle")}</span>
        </span>
      </div>

      {problem && (
        <p role="alert" className="ae-encadre ae-st-avis ae-st-erreur">
          {problem}
        </p>
      )}

      <div className="ae-st-grille">
        <div>
          <ol className="ae-carte ae-rg-carte ae-rg-liste" aria-label={tr("steps")}>
            {steps.map((step, index) => (
              <li key={step.key} className="ae-vf-etape">
                <span className={cx("ae-vf-puce", step.done && "ae-vf-puce-ok")} aria-hidden="true">
                  {step.done ? "✓" : index + 1}
                </span>
                <span className="ae-grandit">
                  <b>{tr(`${step.key}.title`)}</b>
                  <span className="ae-meta ae-st-meta">{step.line}</span>
                </span>
                {step.tag && <span className="ae-tag">{step.tag}</span>}
              </li>
            ))}
          </ol>

          {organization.documents.length > 0 && (
            <section className="ae-carte ae-rg-carte ae-vf-bloc" aria-labelledby="vf-envoyes">
              <h2 id="vf-envoyes" className="ae-h2">
                {t("documents.title")}
              </h2>
              <ul className="ae-rg-liste">
                {organization.documents.map((document) => (
                  <li key={document.id} className="ae-st-ligne">
                    <span className="ae-grandit">
                      <b>{document.name}</b>
                      <span className="ae-meta ae-st-meta">
                        {t("documents.meta", {
                          size: fileSize(document.size),
                          date: document.createdAt,
                        })}
                      </span>
                    </span>
                    {!verified && status !== "pending" && (
                      <form action={removeVerificationDocumentAction}>
                        <input type="hidden" name="id" value={document.id} />
                        <button
                          type="submit"
                          className="ae-btn2 ae-btn-s"
                          aria-label={t("documents.remove", { name: document.name })}
                        >
                          {t("documents.removeShort")}
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!entitled ? (
            <section className="ae-carte ae-rg-carte ae-vf-bloc">
              <p>{t("locked", { plan: orgPlanFor(plans, "org.verified_profile") })}</p>
              <Link href="/app/organisation/facturation" className="ae-btn2 ae-btn-m ae-rg-lien">
                {tr("plans")}
              </Link>
            </section>
          ) : (
            open && (
              <section className="ae-carte ae-rg-carte ae-vf-bloc" aria-labelledby="vf-form">
                <h2 id="vf-form" className="ae-h2">
                  {t("docs")}
                </h2>
                <form action={requestVerificationAction}>
                  <label htmlFor="vf-registration" className="ae-lab">
                    {t("form.registration")}
                  </label>
                  <input
                    id="vf-registration"
                    name="registration"
                    required
                    minLength={3}
                    maxLength={200}
                    defaultValue={previous.registration ?? ""}
                    className="ae-in"
                  />
                  <label htmlFor="vf-tax" className="ae-lab">
                    {t("form.taxId")}
                  </label>
                  <input
                    id="vf-tax"
                    name="taxId"
                    maxLength={120}
                    defaultValue={previous.taxId ?? ""}
                    className="ae-in"
                  />
                  <label htmlFor="vf-domain" className="ae-lab">
                    {t("form.domainEmail")}
                  </label>
                  <input
                    id="vf-domain"
                    name="domainEmail"
                    type="email"
                    maxLength={200}
                    defaultValue={previous.domainEmail ?? ""}
                    className="ae-in"
                  />
                  <label htmlFor="vf-mandate" className="ae-lab">
                    {t("form.mandate")}
                  </label>
                  <textarea
                    id="vf-mandate"
                    name="mandate"
                    required
                    minLength={3}
                    maxLength={500}
                    rows={3}
                    defaultValue={previous.mandate ?? ""}
                    className="ae-ta"
                    aria-describedby="vf-mandate-h"
                  />
                  <p id="vf-mandate-h" className="ae-meta ae-note">
                    {t("form.mandateHint")}
                  </p>
                  <label htmlFor="vf-documents" className="ae-lab">
                    {t("form.documents")}
                  </label>
                  <input
                    id="vf-documents"
                    name="documents"
                    type="file"
                    multiple
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    className="ae-vf-fichier"
                    aria-describedby="vf-documents-h"
                  />
                  <p id="vf-documents-h" className="ae-meta ae-note">
                    {t("form.documentsHint")}
                  </p>
                  <button type="submit" className="ae-btn ae-btn-m ae-st-creer">
                    {status === "info_requested"
                      ? t("answer")
                      : status === "rejected"
                        ? t("resubmit")
                        : t("submit")}
                  </button>
                </form>
              </section>
            )
          )}
        </div>
        <aside className="ae-carte ae-rg-carte" aria-labelledby="vf-attente">
          <h2 id="vf-attente" className="ae-h2">
            {verified ? tr("head.verified") : tw("meanwhile")}
          </h2>
          {!verified && <p className="ae-meta ae-vf-texte">{tr("meanwhile")}</p>}
          <p className="ae-meta ae-vf-texte">{tr("question")}</p>
        </aside>
      </div>
    </div>
  );
}
