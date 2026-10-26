import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { feedWords } from "@/components/phone/fil/data";
import { sendTargetViews } from "@/components/phone/fil/server";
import { ConnectionActions, PersonProfile } from "@/components/phone/profil/profile";
import { profileView, ProfileTexts } from "@/components/phone/profil/server";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { authorFeed } from "@/server/services/feed";
import { personProfile } from "@/server/services/person-profile";
import { isPhone } from "@/server/view";

export const metadata: Metadata = { robots: { index: false } };

/**
 * A person's profile on the phone (docs/profil-personne, validated 26/10/2026, vue connexion):
 * the compact head, « Se connecter » then « Chat », and « Publications · À propos · Réalisations
 * · Portfolio ». Only a profile visible under its name, or a connection, opens; a private or
 * anonymous one is not found. On a computer, the space's home.
 */
export default async function PersonPage({ params }: PageProps<"/app/personnes/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/app/personnes/${id}`);
  if (!(await isPhone())) redirect("/app");
  if (id === user.id) redirect("/app/career/cv");
  const now = new Date();
  const [person, posts, fil, targets, t] = await Promise.all([
    personProfile(db, user.id, id, "connection"),
    authorFeed(db, user.id, { userId: id }),
    feedWords(user.id, now),
    sendTargetViews(user.id),
    getTranslations("phoneProfile"),
  ]);
  if (!person) notFound();
  const view = await profileView(person, { now });
  return (
    <ProfileTexts>
      <PersonProfile
        person={view}
        posts={posts.map(fil.post)}
        targets={targets}
        title={t("titleProfile")}
        back="/app/jobs"
        actions={<ConnectionActions person={view} />}
      />
    </ProfileTexts>
  );
}
