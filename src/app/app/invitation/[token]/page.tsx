import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Alert, Button, ButtonLink } from "@/components/ui";
import { acceptInvitationAction } from "@/server/actions/organization";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { findInvitation } from "@/server/services/organization";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("org.invite");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

/** Invitation to join an organization: the signed-in person accepts it with the invited address. */
export default async function InvitationPage({
  params,
  searchParams,
}: PageProps<"/app/invitation/[token]">) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  await requireUser(`/app/invitation/${token}`);
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
          <h1 className="text-h1">
            {t("invite.accept.title", { org: invitation.organization.name })}
          </h1>
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
          {typeof query.erreur === "string" && (
            <Alert tone="error" title={errors[query.erreur] ?? errors.expired!} />
          )}
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
