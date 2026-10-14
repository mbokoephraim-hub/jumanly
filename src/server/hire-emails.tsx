/**
 * Hire and Connect e-mails (textes, partie 07, keys `mail.*`), sent with the in-app notification.
 * Their contents live in emails/_components/hire-content.ts, previewed with `pnpm email:dev`.
 */
import "server-only";
import {
  applicationSentEmail,
  contactAcceptedEmail,
  contactRequestedEmail,
  interviewConfirmedEmail,
  interviewInviteEmail,
  orgVerificationEmail,
  documentRequestEmail,
  newApplicationEmail,
  newMessageEmail,
  notSelectedEmail,
  orgInviteEmail,
  statusChangeEmail,
  type HireEmail,
} from "../../emails/_components/hire-content";
import { send } from "./account-emails";

type Person = { email: string; firstName?: string | null };

// An e-mail that fails never blocks the action: the in-app notification is already stored.
const deliver = (to: string, email: HireEmail) =>
  send(to, email.subject, email.props).catch(() => undefined);

export const mailNewApplication = (to: Person, input: Parameters<typeof newApplicationEmail>[1]) =>
  deliver(to.email, newApplicationEmail(to.firstName, input));

export const mailApplicationSent = (
  to: Person,
  input: Parameters<typeof applicationSentEmail>[1],
) => deliver(to.email, applicationSentEmail(to.firstName, input));

export const mailStatusChange = (to: Person, input: Parameters<typeof statusChangeEmail>[1]) =>
  deliver(to.email, statusChangeEmail(to.firstName, input));

export const mailNotSelected = (to: Person, input: Parameters<typeof notSelectedEmail>[1]) =>
  deliver(to.email, notSelectedEmail(to.firstName, input));

export const mailDocumentRequest = (
  to: Person,
  input: Parameters<typeof documentRequestEmail>[1],
) => deliver(to.email, documentRequestEmail(to.firstName, input));

export const mailNewMessage = (to: Person, input: Parameters<typeof newMessageEmail>[1]) =>
  deliver(to.email, newMessageEmail(to.firstName, input));

export const mailOrgInvite = (to: string, input: Parameters<typeof orgInviteEmail>[0]) =>
  deliver(to, orgInviteEmail(input));

export const mailInterviewInvite = (
  to: Person,
  input: Parameters<typeof interviewInviteEmail>[1],
) => deliver(to.email, interviewInviteEmail(to.firstName, input));

export const mailInterviewConfirmed = (
  to: Person,
  input: Parameters<typeof interviewConfirmedEmail>[1],
) => deliver(to.email, interviewConfirmedEmail(to.firstName, input));

export const mailContactRequested = (
  to: Person,
  input: Parameters<typeof contactRequestedEmail>[1],
) => deliver(to.email, contactRequestedEmail(to.firstName, input));

export const mailContactAccepted = (
  to: Person,
  input: Parameters<typeof contactAcceptedEmail>[1],
) => deliver(to.email, contactAcceptedEmail(to.firstName, input));

export const mailOrgVerification = (
  to: Person,
  input: Parameters<typeof orgVerificationEmail>[1],
) => deliver(to.email, orgVerificationEmail(to.firstName, input));
