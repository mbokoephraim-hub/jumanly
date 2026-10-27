import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { feedWords } from "@/components/phone/fil/data";
import { MyPosts } from "@/components/phone/fil/my-posts";
import { FilTexts, sendTargetViews } from "@/components/phone/fil/server";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { ownPosts } from "@/server/services/feed";
import { isPhone } from "@/server/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneFil.mine");
  return { title: t("title"), robots: { index: false } };
}

/**
 * « Mes publications » (Ephraïm, 27/10/2026): every post of the person, however old, so that
 * each one can still be changed or deleted once the Fil no longer shows it.
 */
export default async function MyPostsPage() {
  const user = await requireUser("/app/fil/mes-publications");
  if (!(await isPhone())) redirect("/app");
  const now = new Date();
  const [posts, words, targets] = await Promise.all([
    ownPosts(db, user.id, now),
    feedWords(user.id, now),
    sendTargetViews(user.id),
  ]);
  return (
    <FilTexts>
      <MyPosts posts={posts.map(words.post)} targets={targets} />
    </FilTexts>
  );
}
