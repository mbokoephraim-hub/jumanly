import "server-only";
import { db } from "@/server/db";
import { audienceStats } from "@/server/services/audience";
import { careerHome } from "@/server/services/career-phone";
import { authorFeed } from "@/server/services/feed";
import { feedWords } from "../fil/data";
import { sendTargetViews } from "../fil/server";
import { careerView } from "./data";
import { PhoneMyProfile } from "./profile-space";
import { CareerTexts } from "./server";

/**
 * « Mon profil » on the phone (demande d'Ephraïm du 29/10/2026): the person's head and sections
 * read as Carrière reads them, their posts, and what their profile drew over the last weeks.
 */
export async function MyProfileScreen({ userId }: { userId: string }) {
  const now = new Date();
  const [home, posts, fil, targets, stats] = await Promise.all([
    careerHome(db, userId, now),
    authorFeed(db, userId, { userId }),
    feedWords(userId, now),
    sendTargetViews(userId),
    audienceStats(db, userId, now),
  ]);
  const view = await careerView(home, now);
  return (
    <CareerTexts>
      <PhoneMyProfile view={view} posts={posts.map(fil.post)} targets={targets} stats={stats} />
    </CareerTexts>
  );
}
