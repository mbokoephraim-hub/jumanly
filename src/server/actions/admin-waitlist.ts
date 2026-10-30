"use server";

import { notFound, redirect } from "next/navigation";
import { refresh } from "next/cache";
import { canWriteArea } from "@/server/auth/roles";
import { requireAdminArea } from "@/server/auth/session";
import { emailDeliveryAvailable } from "@/server/adapters/email";
import { db } from "@/server/db";
import { reportError } from "@/server/observability";
import { sendWaitlistConfirmation } from "@/server/waitlist-email";
import { defaultTestDays, inviteTesters, testDurations } from "@/server/services/waitlist-test";
import { deliverTestSurvey, sendTestInvitation } from "@/server/waitlist-test-email";

/** At most this many people per click, so one request stays short. */
const BATCH = 200;

/**
 * « Envoyer les e-mails en attente » (/admin/liste-attente): the people who joined while e-mail was
 * not set up get their confirmation now. At most 200 per click; audited.
 */
export async function sendPendingWaitlistEmailsAction() {
  const admin = await requireAdminArea("users");
  if (!admin) notFound();
  if (!canWriteArea(admin.platformRole, "users")) redirect("/admin?erreur=lecture");
  if (!emailDeliveryAvailable()) redirect("/admin/liste-attente?envoi=indisponible");
  const pending = await db.waitlistEntry.findMany({
    where: { emailSentAt: null },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  let sent = 0;
  for (const entry of pending) {
    try {
      await sendWaitlistConfirmation({
        locale: entry.locale === "en" ? "en" : "fr",
        firstName: entry.firstName,
        email: entry.email,
        profile: entry.profile,
        country: entry.country,
      });
      await db.waitlistEntry.update({ where: { id: entry.id }, data: { emailSentAt: new Date() } });
      sent += 1;
    } catch (error) {
      void reportError(error, { message: "Liste d'attente : e-mail de confirmation non envoyé" });
    }
  }
  await db.auditLog.create({
    data: {
      actorId: admin.id,
      action: "waitlist.emails.send",
      targetType: "platform",
      targetId: "waitlist",
      metadata: { pending: pending.length, sent },
    },
  });
  refresh();
  redirect(`/admin/liste-attente?envoyes=${sent}`);
}

/** Checked rows of the list, and where to come back to (the same filters). */
function selection(formData: FormData) {
  const ids = [
    ...new Set(formData.getAll("ids").filter((id): id is string => typeof id === "string")),
  ].slice(0, BATCH);
  const back = String(formData.get("retour") ?? "");
  const query = back.startsWith("?") ? new URLSearchParams(back) : new URLSearchParams();
  return { ids, query };
}

async function guard() {
  const admin = await requireAdminArea("users");
  if (!admin) notFound();
  if (!canWriteArea(admin.platformRole, "users")) redirect("/admin?erreur=lecture");
  return admin;
}

/**
 * « Inviter à tester »: the chosen people get the hidden sign-up link and a test period; the
 * questionnaire leaves on its own when it ends. Audited.
 */
export async function inviteTestersAction(formData: FormData) {
  const admin = await guard();
  const { ids, query } = selection(formData);
  query.delete("invites");
  query.delete("questionnaires");
  query.delete("aucun");
  if (ids.length === 0) redirect(`/admin/liste-attente?${query}&aucun=1`);
  if (!emailDeliveryAvailable()) redirect("/admin/liste-attente?envoi=indisponible");
  const asked = Number(formData.get("jours"));
  const days = (testDurations as readonly number[]).includes(asked) ? asked : defaultTestDays;
  const invited = await inviteTesters(db, ids, days);
  let sent = 0;
  for (const entry of invited) {
    try {
      await sendTestInvitation(entry);
      sent += 1;
    } catch (error) {
      void reportError(error, { message: "Test de la plateforme : invitation non envoyée" });
    }
  }
  await db.auditLog.create({
    data: {
      actorId: admin.id,
      action: "waitlist.test.invite",
      targetType: "platform",
      targetId: "waitlist",
      metadata: { selected: ids.length, sent, days },
    },
  });
  refresh();
  query.set("invites", String(sent));
  redirect(`/admin/liste-attente?${query}`);
}

/** « Envoyer le questionnaire maintenant », without waiting for the end of the test period. */
export async function sendTestSurveysAction(formData: FormData) {
  const admin = await guard();
  const { ids, query } = selection(formData);
  query.delete("invites");
  query.delete("questionnaires");
  query.delete("aucun");
  if (ids.length === 0) redirect(`/admin/liste-attente?${query}&aucun=1`);
  if (!emailDeliveryAvailable()) redirect("/admin/liste-attente?envoi=indisponible");
  // Only invited people who have not answered yet.
  const entries = await db.waitlistEntry.findMany({
    where: { id: { in: ids }, surveyToken: { not: null }, feedback: null },
  });
  let sent = 0;
  for (const entry of entries) if (await deliverTestSurvey(entry)) sent += 1;
  await db.auditLog.create({
    data: {
      actorId: admin.id,
      action: "waitlist.test.survey",
      targetType: "platform",
      targetId: "waitlist",
      metadata: { selected: ids.length, sent },
    },
  });
  refresh();
  query.set("questionnaires", String(sent));
  redirect(`/admin/liste-attente?${query}`);
}
