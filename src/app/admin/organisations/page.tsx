import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Alert, Badge, Button, EmptyState, TextArea } from "@/components/ui";
import { cx } from "@/lib/cx";
import { decideVerificationAction } from "@/server/actions/admin";
import { canWriteAdmin, requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import { listOrganizationsForAdmin, verificationFilters } from "@/server/services/verification";

const tabParam = {
  "en-attente": "pending",
  verifiees: "verified",
  refusees: "rejected",
  "non-verifiees": "none",
} as const;
type TabParam = keyof typeof tabParam;
const requestFields = ["registration", "taxId", "domainEmail", "mandate"] as const;

/** Organizations and their verification (partie 10): documents, checklist, decision. */
export default async function AdminOrganizations({
  searchParams,
}: PageProps<"/admin/organisations">) {
  const params = await searchParams;
  const admin = await requireAdmin();
  if (!admin) notFound();
  const t = await getTranslations("admin.orgs");
  const tov = await getTranslations("org.verification");
  const writable = canWriteAdmin(admin);
  const param: TabParam =
    typeof params.onglet === "string" && params.onglet in tabParam
      ? (params.onglet as TabParam)
      : "en-attente";
  const status = tabParam[param];
  const [organizations, pending] = await Promise.all([
    listOrganizationsForAdmin(db, status),
    db.organization.count({ where: { verificationStatus: "pending" } }),
  ]);
  const label: Record<(typeof verificationFilters)[number], string> = {
    pending: t("tab.pending", { count: pending }),
    verified: t("tab.verified"),
    rejected: t("tab.rejected"),
    none: t("tab.none"),
  };

  return (
    <>
      <h1 className="text-h1">{t("title")}</h1>
      {params.ok === "verifiee" && (
        <Alert
          tone="success"
          title={t("verify.approved", { org: typeof params.org === "string" ? params.org : "" })}
        />
      )}
      {params.ok === "refusee" && <Alert tone="success" title={t("verify.rejected")} />}
      {params.erreur === "motif" && <Alert tone="error" title={t("verify.reasonRequired")} />}
      <nav aria-label={t("title")} className="flex flex-wrap gap-2">
        {(Object.keys(tabParam) as TabParam[]).map((id) => (
          <Link
            key={id}
            href={`/admin/organisations?onglet=${id}`}
            aria-current={param === id ? "page" : undefined}
            className={cx(
              "rounded-pill px-4 py-2 text-[15px] font-medium",
              param === id ? "bg-sapin text-blanc" : "bg-blanc",
            )}
          >
            {label[tabParam[id]]}
          </Link>
        ))}
      </nav>
      {organizations.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <ul className="flex flex-col gap-4">
          {organizations.map((organization) => {
            const request = (organization.verificationRequest ?? {}) as Record<string, string>;
            const owner = organization.memberships[0]?.user;
            return (
              <li
                key={organization.id}
                id={`org-${organization.id}`}
                className="flex flex-col gap-3 rounded-card bg-blanc p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-h3 font-semibold">{organization.name}</h2>
                    <p className="text-sm text-ardoise">
                      {[
                        organization.legalName,
                        owner ? `${t("col.owner")} : ${owner.name} (${owner.email})` : null,
                        organization.verificationRequestedAt
                          ? t("col.requestedAt", { date: organization.verificationRequestedAt })
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <Badge
                    tone={organization.verificationStatus === "verified" ? "success" : "neutral"}
                  >
                    {tov(`status.${organization.verificationStatus}`)}
                  </Badge>
                </div>
                {Object.keys(request).length > 0 && (
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">{t("verify.documents")}</p>
                    <ul className="flex flex-col gap-1 text-sm">
                      {requestFields
                        .filter((field) => request[field])
                        .map((field) => (
                          <li key={field}>
                            {t(`verify.field.${field}`, { value: request[field]! })}
                          </li>
                        ))}
                      {organization.website && (
                        <li>{t("verify.field.website", { value: organization.website })}</li>
                      )}
                    </ul>
                  </div>
                )}
                {organization.verificationReason && (
                  <p className="text-sm">
                    {tov("rejected.reason", { reason: organization.verificationReason })}
                  </p>
                )}
                {writable && status === "pending" && (
                  <div className="flex flex-col gap-3">
                    <p className="font-medium">{t("verify.checklist")}</p>
                    <ul className="list-disc pl-5 text-sm">
                      {(["registration", "domain", "mandate", "website"] as const).map((check) => (
                        <li key={check}>{t(`verify.check.${check}`)}</li>
                      ))}
                    </ul>
                    <form action={decideVerificationAction}>
                      <input type="hidden" name="organization" value={organization.id} />
                      <input type="hidden" name="decision" value="verify" />
                      <Button type="submit" size="sm">
                        {t("verify.approve")}
                      </Button>
                    </form>
                  </div>
                )}
                {writable && (status === "pending" || status === "verified") && (
                  <details>
                    <summary className="cursor-pointer text-sm font-medium underline">
                      {status === "verified" ? t("revoke.text") : t("verify.reject.text")}
                    </summary>
                    <form
                      action={decideVerificationAction}
                      className="mt-3 flex flex-col items-start gap-3 rounded-md bg-creme p-4"
                    >
                      <input type="hidden" name="organization" value={organization.id} />
                      <input type="hidden" name="decision" value="reject" />
                      {status === "verified" && (
                        <p className="text-sm">{t("revoke.confirm", { org: organization.name })}</p>
                      )}
                      <TextArea
                        id={`reason-${organization.id}`}
                        name="reason"
                        required
                        minLength={3}
                        maxLength={500}
                        rows={3}
                        label={t("verify.reject.reason")}
                      />
                      <Button type="submit" variant="danger" size="sm">
                        {status === "verified" ? t("revoke.text") : t("verify.reject.text")}
                      </Button>
                    </form>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
