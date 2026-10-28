import "server-only";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/server/db";
import { publishingSpace } from "@/server/hire-context";
import { listFeed } from "@/server/services/feed";
import { unreadNotifications } from "@/server/services/notifications";
import { FilAvatar } from "../fil/avatar";
import { feedWords, initialsOf, shortName } from "../fil/data";
import { PhoneFil } from "../fil/feed";
import { FilTexts, meOf, sendTargetViews } from "../fil/server";

/**
 * The recruiter's Fil: the same as a talent's (Ephraïm, 27/10/2026), « Pour vous · Abonnements ·
 * Entreprises », then the line to publish in their own name, and « Publier au nom de… » when they
 * manage the company's offers. The head (bell, avatar) is the tab's.
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
  const compose = space?.canPublishAsOrg ? (
    <div className="nb-rh-fil-haut">
      <Link href="/app/fil/publier?nom=entreprise" className="nb-rh-fil-org">
        <FilAvatar
          initials={initialsOf(space.org.name)}
          image={space.org.logo}
          tone={0}
          org
          size={24}
        />
        {t("asOrg", { org: shortName(space.org.name) })}
      </Link>
    </div>
  ) : null;
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
