import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessagesTexts, inboxView } from "@/components/phone/messages/server";
import { PhoneRequests } from "@/components/phone/messages/requests";
import { requireUser } from "@/server/auth/session";
import { getActiveSpace } from "@/server/hire-context";
import { isPhone } from "@/server/view";

export const metadata: Metadata = { robots: { index: false } };

/**
 * « Demandes de connexion » on the phone (Modèle B, lot B8). On a computer, the requests stay in
 * « Mes connexions ».
 */
export default async function RequestsPage() {
  const user = await requireUser("/app/messages/demandes");
  if (!(await isPhone()) || (await getActiveSpace(user.id)))
    redirect("/app/compte/connexions?onglet=demandes");
  const view = await inboxView(user);
  return (
    <MessagesTexts>
      <PhoneRequests requests={view.requests} orgRequests={view.orgRequests} />
    </MessagesTexts>
  );
}
