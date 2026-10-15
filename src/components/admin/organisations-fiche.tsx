import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { adminLabel, OrgMark, ReasonField, type TagTone } from "@/components/admin/kit";
import { Button } from "@/components/ui";
import { cx } from "@/lib/cx";
import { decideVerificationAction } from "@/server/actions/admin";

export const orgStatusTone: Record<"none" | "pending" | "verified" | "rejected", TagTone> = {
  none: "neutral",
  pending: "warning",
  verified: "success",
  rejected: "error",
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

/**
 * Verification card of /admin/organisations (mockup 07-03, « Vérifier Nyota Telecom »): what the
 * organization declared, the points to check, approve or refuse with a reason.
 */
export async function OrgCard({
  organization,
  closeHref,
  revokeHref,
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
    verificationStatus: "none" | "pending" | "verified" | "rejected";
    verificationRequest: unknown;
    verificationRequestedAt: Date | null;
    verificationReason: string | null;
    memberships: { user: { name: string; email: string } }[];
  };
  closeHref: string;
  revokeHref: string;
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
  const pending = organization.verificationStatus === "pending";
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

  return (
    <aside
      id="organisations-fiche"
      aria-labelledby="organisations-fiche-title"
      className={cx(
        "flex scroll-mt-4 flex-col gap-3.5 rounded-[24px] bg-blanc px-5 py-5 lg:w-[400px] lg:shrink-0 lg:px-[22px]",
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

      {owner && (
        <p className="text-[12px] leading-[17px]">
          <span className="text-ardoise">{[t("orgs.col.owner"), ""].join(" : ")}</span>
          <span className="font-medium">{[owner.name, `(${owner.email})`].join(" ")}</span>
        </p>
      )}

      {organization.type !== "partner" && (
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

      {organization.verificationReason && (
        <p className="rounded-[14px] bg-down-fond px-3 py-2.5 text-[12px] leading-[17px] text-down-texte">
          {tov("rejected.reason", { reason: organization.verificationReason })}
        </p>
      )}

      {canAct && pending && (
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

      {canAct && organization.verificationStatus === "verified" && (
        <div className="border-t border-brume pt-3.5">
          <Link
            href={revokeHref}
            scroll={false}
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-corail-fonce hover:underline"
          >
            <Icon name="certificat" className="size-4" />
            {t("orgs.revoke.text")}
          </Link>
        </div>
      )}
    </aside>
  );
}
