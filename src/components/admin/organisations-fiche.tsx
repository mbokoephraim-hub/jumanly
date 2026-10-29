import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { adminLabel, OrgMark, ReasonField, Tag, type TagTone } from "@/components/admin/kit";
import { rightLabel } from "@/components/admin/user-rights";
import { Button } from "@/components/ui";
import { formatShortDate } from "@/lib/dates";
import { cx } from "@/lib/cx";
import { decideVerificationAction } from "@/server/actions/admin";
import { requestMoreAction } from "@/server/actions/admin-orgs";
import type { ResolvedPlan } from "@/server/entitlements";
import type { organizationDetail } from "@/server/services/admin-orgs";

type VerificationStatus = "none" | "pending" | "verified" | "rejected" | "info_requested";

export const orgStatusTone: Record<VerificationStatus, TagTone> = {
  none: "neutral",
  pending: "warning",
  verified: "success",
  rejected: "error",
  info_requested: "warning",
};

const requestFields = ["registration", "taxId", "domainEmail", "mandate"] as const;
const fieldIcon: Record<(typeof requestFields)[number] | "website", IconName> = {
  registration: "doc",
  taxId: "doc",
  domainEmail: "message",
  mandate: "profil",
  website: "lien",
};
const checks = ["registration", "domain", "mandate", "website"] as const;

/** « 1,2 Mo », « 840 Ko ». */
function fileSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`
    : `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-t border-brume pt-3.5">
      <h3 className={adminLabel}>{title}</h3>
      {children}
    </section>
  );
}

/**
 * Organization card of /admin/organisations (mockup 07-03, Admin v2 étape 4): what the
 * organization declared and the documents it sent, the verification decision (approve, refuse,
 * ask for more), then members, plan and quotas, live jobs, and suspension.
 */
export async function OrgCard({
  organization,
  detail,
  plan,
  closeHref,
  actionHref,
  back,
  canAct,
  className,
}: {
  organization: {
    id: string;
    name: string;
    type: "recruiter" | "company" | "partner";
    city: string | null;
    country: string | null;
    website: string | null;
    legalName: string | null;
    verificationStatus: VerificationStatus;
    verificationRequest: unknown;
    verificationRequestedAt: Date | null;
    verificationReason: string | null;
    suspendedAt: Date | null;
    suspensionReason: string | null;
    memberships: { user: { name: string; email: string } }[];
  };
  detail: Awaited<ReturnType<typeof organizationDetail>>;
  plan: ResolvedPlan | null;
  closeHref: string;
  /** Link opening a panel of the page (`retirer`, `suspendre`, `reactiver`). */
  actionHref: (action: string) => string;
  back: string;
  canAct: boolean;
  className?: string;
}) {
  const [t, tov] = await Promise.all([
    getTranslations("admin"),
    getTranslations("org.verification"),
  ]);
  const request = (
    organization.verificationRequest && typeof organization.verificationRequest === "object"
      ? organization.verificationRequest
      : {}
  ) as Record<string, unknown>;
  const declared = [
    ...requestFields.flatMap((field) =>
      typeof request[field] === "string" && request[field]
        ? [{ field, value: request[field] as string }]
        : [],
    ),
    ...(organization.website ? [{ field: "website" as const, value: organization.website }] : []),
  ];
  const status = organization.verificationStatus;
  const pending = status === "pending";
  const recruiting = organization.type !== "partner";
  const owner = organization.memberships[0]?.user;
  const subline = [
    organization.verificationRequestedAt
      ? t("orgs.col.requestedAt", { date: organization.verificationRequestedAt })
      : null,
    [organization.city, organization.country].filter(Boolean).join(", "),
    t(`orgs.type.${organization.type}`),
  ]
    .filter(Boolean)
    .join(" · ");
  const quotas = detail.quotas.filter((quota) => quota.limit !== 0 || quota.used > 0);
  const jobCount = (status: string) => detail.jobCounts[status] ?? 0;

  return (
    <aside
      id="organisations-fiche"
      aria-labelledby="organisations-fiche-title"
      className={cx(
        "jm-admin-fiche jm-admin-card flex scroll-mt-4 flex-col gap-3.5 rounded-[24px] bg-blanc px-5 py-5 lg:w-[400px] lg:shrink-0 lg:px-[22px]",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <OrgMark name={organization.name} size={46} />
        <div className="flex min-w-0 flex-1 flex-col">
          <h2
            id="organisations-fiche-title"
            className="text-[18px] leading-6 font-semibold tracking-[-0.015em] lg:text-[20px] lg:leading-[26px]"
          >
            {pending ? t("orgs.verify.title", { org: organization.name }) : organization.name}
          </h2>
          <p className="text-[11px] leading-[15px] text-ardoise">{subline}</p>
          <p className="mt-1.5 flex flex-wrap gap-1.5">
            {recruiting && <Tag tone={orgStatusTone[status]}>{t(`orgs.status.${status}`)}</Tag>}
            {organization.suspendedAt && <Tag tone="error">{t("orgs.suspendedTag")}</Tag>}
          </p>
        </div>
        <Link
          href={closeHref}
          scroll={false}
          aria-label={t("sensitive.close")}
          className="grid size-8 shrink-0 place-items-center rounded-full bg-creme hover:bg-brume"
        >
          <Icon name="fermer" className="size-4" />
        </Link>
      </div>

      {organization.suspendedAt && (
        <p className="rounded-[14px] bg-down-fond px-3 py-2.5 text-[12px] leading-[17px] text-down-texte">
          {t("orgs.suspendedSince", {
            date: organization.suspendedAt,
            reason: organization.suspensionReason ?? "",
          })}
        </p>
      )}

      {owner && (
        <p className="text-[12px] leading-[17px]">
          <span className="text-ardoise">{[t("orgs.col.owner"), ""].join(" : ")}</span>
          <span className="font-medium">{[owner.name, `(${owner.email})`].join(" ")}</span>
        </p>
      )}

      {recruiting && (
        <section className="flex flex-col gap-2">
          <h3 className={adminLabel}>{t("orgs.verify.documents")}</h3>
          {declared.length === 0 ? (
            <p className="text-[12px] text-ardoise">{t("orgs.verify.noDocuments")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {declared.map(({ field, value }) => (
                <li
                  key={field}
                  className="flex items-center gap-3 rounded-[14px] bg-creme px-3 py-2.5"
                >
                  <span
                    aria-hidden
                    className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-blanc"
                  >
                    <Icon name={fieldIcon[field]} className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[13px] leading-[18px] font-semibold break-words">
                      {value}
                    </span>
                    <span className="text-[11px] leading-[15px] text-ardoise">
                      {t(`orgs.doc.${field}`)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {recruiting && (
        <section className="flex flex-col gap-2">
          <h3 className={adminLabel}>{t("orgs.verify.files")}</h3>
          {detail.documents.length === 0 ? (
            <p className="text-[12px] text-ardoise">{t("orgs.verify.noFiles")}</p>
          ) : (
            <>
              <ul className="flex flex-col gap-2">
                {detail.documents.map((document) => (
                  <li key={document.id}>
                    <a
                      href={`/admin/organisations/document?id=${encodeURIComponent(document.id)}`}
                      target="_blank"
                      rel="noopener"
                      aria-label={t("orgs.verify.fileOpen", { name: document.name })}
                      className="flex items-center gap-3 rounded-[14px] bg-creme px-3 py-2.5 hover:bg-brume"
                    >
                      <span
                        aria-hidden
                        className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-blanc"
                      >
                        <Icon name="clip" className="size-4" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[13px] leading-[18px] font-semibold underline underline-offset-2">
                          {document.name}
                        </span>
                        <span className="text-[11px] leading-[15px] text-ardoise">
                          {t("orgs.verify.fileMeta", {
                            size: fileSize(document.size),
                            date: document.createdAt,
                          })}
                        </span>
                      </span>
                      <Icon name="expand" className="size-4 shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
              <p className="flex items-center gap-1.5 text-[11px] leading-4 text-ardoise">
                <Icon name="doc" className="size-3 shrink-0" />
                {t("orgs.verify.fileHint")}
              </p>
            </>
          )}
        </section>
      )}

      {organization.verificationReason && status === "rejected" && (
        <p className="rounded-[14px] bg-down-fond px-3 py-2.5 text-[12px] leading-[17px] text-down-texte">
          {tov("rejected.reason", { reason: organization.verificationReason })}
        </p>
      )}
      {organization.verificationReason && status === "info_requested" && (
        <p className="rounded-[14px] bg-ambre-fond px-3 py-2.5 text-[12px] leading-[17px] text-ambre-texte">
          {t("orgs.verify.infoPending", { reason: organization.verificationReason })}
        </p>
      )}

      {canAct && pending && recruiting && (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className={cx(adminLabel, "mb-2")}>{t("orgs.verify.checklist")}</legend>
            {checks.map((check) => (
              <label
                key={check}
                className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-5"
              >
                <input
                  type="checkbox"
                  id={`organisations-check-${check}`}
                  className="mt-px size-5 shrink-0 accent-sapin"
                />
                {t(`orgs.verify.check.${check}`)}
              </label>
            ))}
          </fieldset>
          <form action={decideVerificationAction}>
            <input type="hidden" name="organization" value={organization.id} />
            <input type="hidden" name="decision" value="verify" />
            <Button type="submit" fullWidth icon={<Icon name="check" />}>
              {t("orgs.verify.approve")}
            </Button>
          </form>
          <details className="group rounded-[16px] bg-creme px-3.5 py-2.5">
            <summary className="cursor-pointer text-[13px] font-semibold">
              {t("orgs.verify.requestMore")}
            </summary>
            <form action={requestMoreAction} className="mt-3 flex flex-col gap-3">
              <input type="hidden" name="organizationId" value={organization.id} />
              <input type="hidden" name="back" value={back} />
              <ReasonField id="organisations-more-reason" label={t("orgs.verify.moreReason")} />
              <Button type="submit" variant="secondary" fullWidth>
                {t("orgs.verify.moreSubmit")}
              </Button>
            </form>
          </details>
          <form action={decideVerificationAction} className="flex flex-col gap-3">
            <input type="hidden" name="organization" value={organization.id} />
            <input type="hidden" name="decision" value="reject" />
            <ReasonField id="organisations-reject-reason" label={t("orgs.verify.reject.reason")} />
            <Button type="submit" variant="tertiary" fullWidth className="text-corail-fonce!">
              {t("orgs.verify.reject.text")}
            </Button>
          </form>
        </>
      )}

      <Block title={t("orgs.detail.members")}>
        {detail.members.length === 0 ? (
          <p className="text-[12px] text-ardoise">{t("orgs.detail.noMember")}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {detail.members.map((member) => (
              <li
                key={member.id}
                className="flex items-baseline gap-3 text-[12.5px] leading-[17px]"
              >
                <Link
                  href={`/admin/utilisateurs?fiche=${member.user.id}`}
                  className="block min-h-6 min-w-0 flex-1 truncate py-[3.5px] font-medium underline-offset-2 hover:underline"
                >
                  {member.user.name}
                </Link>
                <span className="text-right text-ardoise">
                  {t(`memberRole.${member.role}`)}
                  {member.status === "suspended" && ` · ${t("orgs.detail.memberSuspended")}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Block>

      {plan && (
        <Block title={t("orgs.detail.plan")}>
          <p className="flex items-center justify-between gap-3 text-[13px]">
            <span className="font-semibold">{plan.planName}</span>
            <Link
              href={`/admin/abonnements?q=${encodeURIComponent(organization.name)}`}
              className="text-[12px] font-semibold underline underline-offset-2"
            >
              {t("orgs.detail.subscriptions")}
            </Link>
          </p>
          {quotas.length > 0 && (
            <dl className="flex flex-col gap-1.5">
              {quotas.map((quota) => (
                <div
                  key={quota.key}
                  className="flex items-baseline justify-between gap-3 text-[12px] leading-[17px]"
                >
                  <dt className="text-ardoise">{rightLabel(t, quota.key)}</dt>
                  <dd className="font-medium">
                    {quota.limit < 0
                      ? t("orgs.detail.quotaUnlimited", { used: quota.used })
                      : t("orgs.detail.quotaLine", { used: quota.used, limit: quota.limit })}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Block>
      )}

      {recruiting && (
        <Block title={t("orgs.detail.jobs")}>
          <p className="text-[11.5px] text-ardoise">
            {t("orgs.detail.jobsSummary", {
              published: jobCount("published"),
              closed: jobCount("closed"),
              total: Object.values(detail.jobCounts).reduce((sum, count) => sum + count, 0),
            })}
          </p>
          {detail.jobs.length === 0 ? (
            <p className="text-[12px] text-ardoise">{t("orgs.detail.noJob")}</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {detail.jobs.map((job) => (
                <li key={job.id} className="flex items-baseline gap-3 text-[12.5px] leading-[17px]">
                  <Link
                    href={`/admin/offres?onglet=toutes&id=${job.id}`}
                    className="min-w-0 flex-1 truncate font-medium underline-offset-2 hover:underline"
                  >
                    {job.title}
                  </Link>
                  <span className="shrink-0 text-ardoise">
                    {job.publishedAt ? `${formatShortDate(job.publishedAt)} · ` : ""}
                    {t("orgs.detail.jobApplications", { count: job._count.applications })}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/admin/offres?onglet=toutes&q=${encodeURIComponent(organization.name)}`}
            className="text-[12px] font-semibold underline underline-offset-2"
          >
            {t("orgs.detail.allJobs")}
          </Link>
        </Block>
      )}

      {canAct && (
        <nav
          aria-label={t("users.detail.actions")}
          className="flex flex-col gap-2 border-t border-brume pt-3.5"
        >
          {recruiting && status === "verified" && (
            <Link
              href={actionHref("retirer")}
              scroll={false}
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-corail-fonce hover:underline"
            >
              <Icon name="certificat" className="size-4" />
              {t("orgs.revoke.text")}
            </Link>
          )}
          {organization.type !== "partner" && (
            <Link
              href={actionHref("offrir")}
              scroll={false}
              className="inline-flex items-center gap-2 text-[13px] font-semibold hover:underline"
            >
              <Icon name="portefeuille" className="size-4" />
              {t("orgs.grant.text")}
            </Link>
          )}
          {organization.suspendedAt ? (
            <Link
              href={actionHref("reactiver")}
              scroll={false}
              className="inline-flex items-center gap-2 text-[13px] font-semibold hover:underline"
            >
              <Icon name="valider" className="size-4" />
              {t("orgs.reactivate.text")}
            </Link>
          ) : (
            <Link
              href={actionHref("suspendre")}
              scroll={false}
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-corail-fonce hover:underline"
            >
              <Icon name="securite" className="size-4" />
              {t("orgs.suspend.text")}
            </Link>
          )}
          {organization.type !== "partner" && (
            <Link
              href={actionHref("supprimer")}
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-corail-fonce hover:underline"
            >
              <Icon name="fermer" className="size-4" />
              {t("orgs.delete.text")}
            </Link>
          )}
        </nav>
      )}
    </aside>
  );
}
