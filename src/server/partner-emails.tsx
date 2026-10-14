/**
 * Jumanly Partners e-mails: licence invitations, activation, partner manager invitation.
 * Their contents live in emails/_components/partner-content.ts.
 */
import "server-only";
import type { HireEmail } from "../../emails/_components/hire-content";
import {
  licenseActivatedEmail,
  licenseInviteEmail,
  partnerInviteEmail,
} from "../../emails/_components/partner-content";
import { send } from "./account-emails";

// A failed e-mail never blocks the action; the licence or invitation already exists.
const deliver = (to: string, email: HireEmail) =>
  send(to, email.subject, email.props).catch(() => undefined);

export const mailLicenseInvite = (to: string, input: Parameters<typeof licenseInviteEmail>[0]) =>
  deliver(to, licenseInviteEmail(input));

export const mailLicenseActivated = (
  to: { email: string; firstName?: string | null },
  input: Parameters<typeof licenseActivatedEmail>[1],
) => deliver(to.email, licenseActivatedEmail(to.firstName, input));

export const mailPartnerInvite = (to: string, input: Parameters<typeof partnerInviteEmail>[0]) =>
  deliver(to, partnerInviteEmail(input));
