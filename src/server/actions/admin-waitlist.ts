"use server";

import { notFound, redirect } from "next/navigation";
import { refresh } from "next/cache";
import { canWriteArea } from "@/server/auth/roles";
import { requireAdminArea } from "@/server/auth/session";
import { emailDeliveryAvailable } from "@/server/adapters/email";
import { db } from "@/server/db";
import { reportError } from "@/server/observability";
import { sendWaitlistConfirmation } from "@/server/waitlist-email";

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
