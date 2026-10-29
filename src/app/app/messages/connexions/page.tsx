import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PhoneConnexions } from "@/components/phone/messages/connexions";
import { connexionsView, MessagesTexts } from "@/components/phone/messages/server";
import { requireUser } from "@/server/auth/session";
import { getActiveSpace } from "@/server/hire-context";
import { isPhone } from "@/server/view";

export const metadata: Metadata = { robots: { index: false } };

/**
 * « Connexions » of the Chat on the phone (Ephraïm 29/10/2026), opened by the icon beside the
 * pencil: the requests received and sent, the people I may know, my connections. On a computer,
 * or in a recruiting team's space, « Mes connexions » of the account.
 */
export default async function ConnexionsPage({
  searchParams,
}: PageProps<"/app/messages/connexions">) {
  const user = await requireUser("/app/messages/connexions");
  const { onglet } = await searchParams;
  if (!(await isPhone()) || (await getActiveSpace(user.id)))
    redirect(`/app/compte/connexions${onglet === "demandes" ? "?onglet=demandes" : ""}`);
  const view = await connexionsView(user);
  return (
    <MessagesTexts>
      <PhoneConnexions view={view} asked={typeof onglet === "string" ? onglet : null} />
    </MessagesTexts>
  );
}
