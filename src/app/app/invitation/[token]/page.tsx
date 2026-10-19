import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Alert, Button, ButtonLink } from "@/components/ui";
import { acceptInvitationAction } from "@/server/actions/organization";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { findInvitation } from "@/server/services/organization";
import { AppPageHeader } from "@/components/app/page-header";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { inOrganizationSpace } from "@/server/talent-space";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("org.invite");
  return { title: t("title"), robots: { index: false } };
}

/** Invitation to join an organization: the signed-in person accepts it with the invited address. */
export default async function InvitationPage({
  params,
  searchParams,
}: PageProps<"/app/invitation/[token]">) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/app/invitation/${token}`);
  const t = await getTranslations("org");
  const invitation = await findInvitation(db, token.slice(0, 100));
  const inviter = invitation?.invitedById
    ? await db.user.findUnique({ where: { id: invitation.invitedById }, select: { name: true } })
    : null;
  const valid =
    invitation &&
    !invitation.revokedAt &&
    !invitation.acceptedAt &&
    invitation.expiresAt > new Date();
  const role = invitation ? t(`roles.${invitation.role}.text`) : "";
  const errors: Record<string, string> = {
    otherEmail: t("invite.error.otherEmail"),
    seats: t("members.seats.full"),
    expired: t("invite.accept.expired", { inviterName: inviter?.name ?? "" }),
  };

  const error = typeof query.erreur === "string" ? (errors[query.erreur] ?? errors.expired!) : null;

  // Personal space (lot 7): the talent components, readable in dark mode. An organization's space
  // keeps the former card until its step.
  if (!(await inOrganizationSpace(user.id))) {
    return (
      <div className="t-flux">
        <FlowHead
          back="/app"
          backLabel={t("invite.accept.decline")}
          title={t("invite.accept.pageTitle")}
        />
        {!invitation || !valid ? (
          <>
            <p className="t-gar t-err">
              <TalentIcon name="horloge" size="s" />
              <span>{t("invite.accept.expired", { inviterName: inviter?.name ?? "" })}</span>
            </p>
            <Link href="/app" className="t-bt t-sec t-pl t-press">
              {t("invite.accept.decline")}
            </Link>
          </>
        ) : (
          <>
            <div className="t-verre t-contact">
              <b>{t("invite.accept.title", { org: invitation.organization.name })}</b>
              <span>
                {t("invite.accept.body", {
                  inviterName: inviter?.name ?? "",
                  org: invitation.organization.name,
                  role,
                })}
              </span>
            </div>
            {invitation.message && (
              <p className="t-gar">
                <TalentIcon name="message" size="s" />
                <span className="whitespace-pre-line">{invitation.message}</span>
              </p>
            )}
            {error && <Notice tone="err">{error}</Notice>}
            <form action={acceptInvitationAction}>
              <input type="hidden" name="token" value={token} />
              <button type="submit" className="t-bt t-p t-pl t-press">
                {t("invite.accept.cta")}
              </button>
            </form>
            <Link href="/app" className="t-bt t-txt t-pl t-press">
              {t("invite.accept.decline")}
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 rounded-card bg-blanc p-6">
      {!invitation || !valid ? (
        <>
          <Alert
            tone="warning"
            title={t("invite.accept.expired", { inviterName: inviter?.name ?? "" })}
          />
          <ButtonLink href="/app" variant="tertiary" className="self-start">
            {t("invite.accept.decline")}
          </ButtonLink>
        </>
      ) : (
        <>
          <AppPageHeader
            module="hire"
            title={t("invite.accept.title", { org: invitation.organization.name })}
          />
          <p>
            {t("invite.accept.body", {
              inviterName: inviter?.name ?? "",
              org: invitation.organization.name,
              role,
            })}
          </p>
          {invitation.message && (
            <p className="rounded-md bg-creme p-4 whitespace-pre-line">{invitation.message}</p>
          )}
          {error && <Alert tone="error" title={error} />}
          <div className="flex flex-wrap gap-3">
            <form action={acceptInvitationAction}>
              <input type="hidden" name="token" value={token} />
              <Button type="submit">{t("invite.accept.cta")}</Button>
            </form>
            <ButtonLink href="/app" variant="tertiary">
              {t("invite.accept.decline")}
            </ButtonLink>
          </div>
        </>
      )}
    </div>
  );
}
