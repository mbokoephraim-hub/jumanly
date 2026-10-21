import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { cx } from "@/lib/cx";
import {
  removeVerificationDocumentAction,
  requestVerificationAction,
} from "@/server/actions/organization";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { hirePermissions } from "@/server/services/hire";
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
 * Vérifier l'organisation (planche recruteur-3 `VERIF_O`, r3plus): the progress in three steps
 * (the legal information, an official document, Jumanly's review), the documents sent, the form
 * when something is missing, and what changes meanwhile: the offers go through validation.
 * Requests and documents stay those of the member's organization (`org.verified_profile`).
 */
export default async function OrganizationVerificationPage({
  searchParams,
}: PageProps<"/app/organisation/verification">) {
  const params = await searchParams;
  const { ctx } = await requireHire("/app/organisation/verification");
  const t = await getTranslations("org.verification");
  const tw = await getTranslations("hireWeb3.verification");
  const tr = await getTranslations("rhVerification");
  const admin = hirePermissions(ctx.role).administer;
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
  const steps: { key: string; icon: TalentIconName; done: boolean; line: string; tag?: string }[] =
    [
      {
        key: "legal",
        icon: "entreprise",
        done: verified || Boolean(previous.registration),
        line: verified
          ? tr("checked")
          : previous.registration
            ? tr("legal.done")
            : tr("legal.todo"),
      },
      {
        key: "document",
        icon: "document",
        done: verified || organization.documents.length > 0,
        line: verified
          ? tr("checked")
          : organization.documents.length > 0
            ? tr("document.done", { count: organization.documents.length })
            : tr("document.todo"),
      },
      {
        key: "review",
        icon: verified ? "valider" : "horloge",
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

  return (
    <div className="t-flux t-w4 t-large t-rw3-ver">
      <div className="t-w4-h">
        <FlowHead back="/app/organisation" backLabel={tr("back")} title={tr("title")} />
        <p className="t-w4-web t-w4-sub">{organization.name}</p>
      </div>
      {one(params.ok) === "1" && (
        <Notice tone="ok">{t("submitted", { days: VERIFICATION_DAYS })}</Notice>
      )}
      {one(params.ok) === "documentRetire" && <Notice tone="ok">{t("documents.removed")}</Notice>}
      {errorKey && <Notice tone="err">{errorText[errorKey] ?? t("invalid")}</Notice>}

      <div className="t-verre t-r5-verp">
        <span
          className="t-rc-ring"
          style={{ "--p": Math.round((done / 3) * 100) } as React.CSSProperties}
        >
          <b>{tr("progress", { done, total: 3 })}</b>
        </span>
        <span className="t-t">
          <b>
            {verified
              ? tr("head.verified")
              : status === "pending"
                ? tr("head.pending")
                : done === 2
                  ? tr("head.last")
                  : tr("head.start")}
          </b>
          <span>{t("subtitle")}</span>
        </span>
      </div>

      {status === "info_requested" && organization.verificationReason && (
        <Notice tone="err">
          {t("infoRequested", { reason: organization.verificationReason })}
        </Notice>
      )}
      {status === "rejected" && organization.verificationReason && (
        <Notice tone="err">
          {t("rejected.reason", { reason: organization.verificationReason })}
        </Notice>
      )}

      <ol className="t-verre t-liste t-lignes t-rw3-steps" aria-label={tr("steps")}>
        {steps.map((step) => (
          <li key={step.key} className="t-li">
            <span className={cx("t-cases", step.done ? "t-c3" : "t-c2")} aria-hidden>
              <TalentIcon name={step.done ? "valider" : step.icon} size="s" />
            </span>
            <span className="t-t">
              <b>{tr(`${step.key}.title` as "legal.title")}</b>
              <span>{step.line}</span>
            </span>
            {step.tag && (
              <span className={cx("t-tag", verified ? "t-vert" : "t-amb")}>{step.tag}</span>
            )}
          </li>
        ))}
      </ol>

      {/* Ordinateur et tablette (planche web recruteur-3 § 3) : le document et le formulaire à
          gauche, « En attendant » à droite. */}
      <div className="t-w4-g2e">
        <div className="t-w4-col">
          {organization.documents.length > 0 && (
            <section aria-labelledby="r5-ver-docs" className="t-flux t-serre">
              <h2 id="r5-ver-docs" className="t-ck-t">
                {t("documents.title")}
              </h2>
              <ul className="t-verre t-liste t-lignes">
                {organization.documents.map((document) => (
                  <li key={document.id} className="t-li">
                    <span className="t-cases" aria-hidden>
                      <TalentIcon name="document" size="s" />
                    </span>
                    <span className="t-t">
                      <b className="t-r5-coupe">{document.name}</b>
                      <span>
                        {t("documents.meta", {
                          size: fileSize(document.size),
                          date: document.createdAt,
                        })}
                      </span>
                    </span>
                    {admin && !verified && status !== "pending" && (
                      <form action={removeVerificationDocumentAction}>
                        <input type="hidden" name="id" value={document.id} />
                        <button
                          type="submit"
                          className="t-bi t-press"
                          aria-label={t("documents.remove", { name: document.name })}
                        >
                          <TalentIcon name="supprimer" size="s" />
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!entitled ? (
            <div className="t-verre t-carte">
              <b>{t("locked", { plan: orgPlanFor(plans, "org.verified_profile") })}</b>
              {admin && (
                <Link href="/app/abonnement/formules" className="t-bt t-p t-s t-press">
                  {tr("plans")}
                </Link>
              )}
            </div>
          ) : (
            admin &&
            open && (
              <section aria-labelledby="r5-ver-form" className="t-flux t-serre">
                <h2 id="r5-ver-form" className="t-ck-t">
                  {t("docs")}
                </h2>
                <form action={requestVerificationAction} className="t-flux">
                  <div className="t-champ">
                    <label htmlFor="r5-ver-registration">{t("form.registration")}</label>
                    <span className="t-verre t-saisie">
                      <input
                        id="r5-ver-registration"
                        name="registration"
                        required
                        minLength={3}
                        maxLength={200}
                        defaultValue={previous.registration ?? ""}
                      />
                    </span>
                  </div>
                  <div className="t-champ">
                    <label htmlFor="r5-ver-tax">{t("form.taxId")}</label>
                    <span className="t-verre t-saisie">
                      <input
                        id="r5-ver-tax"
                        name="taxId"
                        maxLength={120}
                        defaultValue={previous.taxId ?? ""}
                      />
                    </span>
                  </div>
                  <div className="t-champ">
                    <label htmlFor="r5-ver-domain">{t("form.domainEmail")}</label>
                    <span className="t-verre t-saisie">
                      <input
                        id="r5-ver-domain"
                        name="domainEmail"
                        type="email"
                        maxLength={200}
                        defaultValue={previous.domainEmail ?? ""}
                      />
                    </span>
                  </div>
                  <div className="t-champ">
                    <label htmlFor="r5-ver-mandate">{t("form.mandate")}</label>
                    <textarea
                      id="r5-ver-mandate"
                      name="mandate"
                      required
                      minLength={3}
                      maxLength={500}
                      rows={3}
                      defaultValue={previous.mandate ?? ""}
                      className="t-verre t-zone"
                      aria-describedby="r5-ver-mandate-h"
                    />
                    <p id="r5-ver-mandate-h" className="t-aide">
                      {t("form.mandateHint")}
                    </p>
                  </div>
                  <div className="t-champ">
                    <label htmlFor="r5-ver-documents">{t("form.documents")}</label>
                    <input
                      id="r5-ver-documents"
                      name="documents"
                      type="file"
                      multiple
                      accept="application/pdf,image/png,image/jpeg,image/webp"
                      className="t-r5-fichier"
                      aria-describedby="r5-ver-documents-h"
                    />
                    <p id="r5-ver-documents-h" className="t-aide">
                      {t("form.documentsHint")}
                    </p>
                  </div>
                  <button type="submit" className="t-bt t-p t-m t-pl t-press">
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
        <div className="t-w4-col">
          {!verified && <h2 className="t-ck-t t-w4-web">{tw("meanwhile")}</h2>}
          {!verified && (
            <p className="t-gar">
              <TalentIcon name="offre" size="s" />
              <span>{tr("meanwhile")}</span>
            </p>
          )}
          <p className="t-gar">
            <TalentIcon name="message" size="s" />
            <span>{tr("question")}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
