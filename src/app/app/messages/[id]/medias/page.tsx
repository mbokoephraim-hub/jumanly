import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessagesTexts, loadThread } from "@/components/phone/messages/server";
import { PhoneMedias, type MediaTab } from "@/components/phone/messages/medias";
import { requireUser } from "@/server/auth/session";
import { getActiveSpace } from "@/server/hire-context";
import { isPhone } from "@/server/view";

export const metadata: Metadata = { robots: { index: false } };

const TABS: MediaTab[] = ["medias", "liens", "docs"];

/** « Médias, liens et documents » on the phone (Modèle B, lot B8). On a computer, the conversation. */
export default async function MediasPage({
  params,
  searchParams,
}: PageProps<"/app/messages/[id]/medias">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/app/messages/${id}/medias`);
  if (!(await isPhone()) || (await getActiveSpace(user.id))) redirect(`/app/messages/${id}`);
  const { view } = await loadThread(user, id);
  const tab = TABS.find((key) => key === query.onglet) ?? "medias";
  return (
    <MessagesTexts>
      <PhoneMedias view={view} tab={tab} />
    </MessagesTexts>
  );
}
