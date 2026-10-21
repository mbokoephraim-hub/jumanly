import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  phoneCoversApplication,
  PhoneApplicationScreen,
} from "@/components/phone/career/application-server";
import { ApplicationDetail } from "@/components/talent/suivi/application-detail";
import { requireUser } from "@/server/auth/session";
import { isPhone } from "@/server/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("candidature");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

/**
 * One application on its own page (planche talent-2 § 3; tablet of planche web talent-2 § 2,
 * « ouvert en page, mêmes blocs sur deux colonnes »). On a computer, Suivi shows it beside the
 * list (`/app/suivi?id=`); this address stays valid everywhere (notifications, e-mails, messages).
 * On the phone, Modèle B's screen (lot B5) unless there is an invitation or a document to answer.
 */
export default async function ApplicationPage({
  params,
  searchParams,
}: PageProps<"/app/suivi/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/app/suivi/${id}`);
  const plain = Object.keys(query).length === 0;
  if (plain && (await isPhone()) && (await phoneCoversApplication(user.id, id)))
    return <PhoneApplicationScreen userId={user.id} userName={user.name} id={id} />;
  return (
    <div className="t-large t-ca-page">
      <ApplicationDetail userId={user.id} id={id} query={query} />
    </div>
  );
}
