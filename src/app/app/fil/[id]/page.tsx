import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { feedWords } from "@/components/phone/fil/data";
import { PostDetail } from "@/components/phone/fil/detail";
import { FilTexts, meOf, sendTargetViews } from "@/components/phone/fil/server";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getPost } from "@/server/services/feed";
import { isPhone } from "@/server/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneFil.detail");
  return { title: t("title"), robots: { index: false } };
}

/**
 * A publication of the Fil and its answers (Modèle B, lot B3). The Fil lives on the phone for
 * now: on a computer the address leads to the space's home.
 */
export default async function FilPostPage({ params, searchParams }: PageProps<"/app/fil/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/app/fil/${id}`);
  if (!(await isPhone())) redirect("/app");
  const now = new Date();
  const [data, words, targets] = await Promise.all([
    getPost(db, user.id, id, now),
    feedWords(user.id, now),
    sendTargetViews(user.id),
  ]);
  if (!data) notFound();
  const fromNotifs = query.de === "notifs";
  return (
    <FilTexts>
      <PostDetail
        post={words.post(data.post)}
        replies={data.replies.map(words.reply)}
        me={meOf({ name: user.name, image: user.image ?? null })}
        back={{
          href: fromNotifs ? "/app/notifications" : "/app",
          label: words.t(fromNotifs ? "detail.backNotifs" : "detail.back"),
        }}
        targets={targets}
      />
    </FilTexts>
  );
}
