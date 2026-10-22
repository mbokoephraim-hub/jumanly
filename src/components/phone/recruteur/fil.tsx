import "server-only";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/server/db";
import { publishingSpace } from "@/server/hire-context";
import { listFeed } from "@/server/services/feed";
import { unreadNotifications } from "@/server/services/notifications";
import { FilAvatar } from "../fil/avatar";
import { feedWords, initialsOf } from "../fil/data";
import { PhoneFil } from "../fil/feed";
import { FilTexts, meOf, sendTargetViews } from "../fil/server";

/**
 * The recruiter's Fil (Modèle B recruteur, M3, planches Recruteur-fil*): the line to publish in
 * their own name, « Publier au nom de… » when they manage the company's offers, then « Pour vous ·
 * Abonnements · Entreprises » as for a talent. The head (search, bell, avatar) is the tab's.
 */
export async function RhFil({
  user,
}: {
  user: { id: string; name: string; image: string | null };
}) {
  const now = new Date();
  const t = await getTranslations("phoneRhFil");
  const words = await feedWords(user.id, now);
  const [pourvous, abonnements, entreprises, unread, targets, space] = await Promise.all([
    listFeed(db, user.id, "pourvous", now),
    listFeed(db, user.id, "abonnements", now),
    listFeed(db, user.id, "entreprises", now),
    unreadNotifications(db, user.id),
    sendTargetViews(user.id),
    publishingSpace(user.id),
  ]);
  const me = meOf(user);
  const compose = (
    <div className="nb-rh-fil-haut">
      <div className="nb-rh-fil-publier">
        <Link href="/app/fil/publier" className="nb-rh-fil-publier-l">
          <FilAvatar initials={me.initials} image={me.image} tone={0} org={false} me size={40} />
          <span className="nb-meta">{t("prompt")}</span>
        </Link>
        <Link href="/app/fil/publier" className="nb-fil-publier-b">
          {t("publish")}
        </Link>
      </div>
      {space?.canPublishAsOrg ? (
        <Link href="/app/fil/publier?nom=entreprise" className="nb-rh-fil-org">
          <FilAvatar
            initials={initialsOf(space.org.name)}
            image={space.org.logo}
            tone={0}
            org
            size={24}
          />
          {t("asOrg", { org: space.org.name })}
        </Link>
      ) : null}
    </div>
  );
  return (
    <FilTexts recruiter>
      <PhoneFil
        me={me}
        unread={unread}
        lists={{
          pourvous: pourvous.map(words.post),
          abonnements: abonnements.map(words.post),
          entreprises: entreprises.map(words.post),
        }}
        offersToday={0}
        targets={targets}
        recruiter={{
          compose,
          end: { text: t("end"), link: t("endLink"), href: "/app/hire/talents" },
        }}
      />
    </FilTexts>
  );
}
