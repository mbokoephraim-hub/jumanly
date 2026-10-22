import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessagesTexts, loadThread } from "@/components/phone/messages/server";
import { PhoneInfos } from "@/components/phone/messages/infos";
import { requireUser } from "@/server/auth/session";
import { getActiveSpace } from "@/server/hire-context";
import { isPhone } from "@/server/view";

export const metadata: Metadata = { robots: { index: false } };

/** « Infos » of a conversation on the phone (Modèle B, lot B8). On a computer, the conversation. */
export default async function InfosPage({ params }: PageProps<"/app/messages/[id]/infos">) {
  const { id } = await params;
  const user = await requireUser(`/app/messages/${id}/infos`);
  if (!(await isPhone()) || (await getActiveSpace(user.id))) redirect(`/app/messages/${id}`);
  const { view } = await loadThread(user, id);
  return (
    <MessagesTexts>
      <PhoneInfos view={view} />
    </MessagesTexts>
  );
}
