import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { feedWords } from "@/components/phone/fil/data";
import { FilProfile } from "@/components/phone/fil/profile";
import { FilTexts, sendTargetViews } from "@/components/phone/fil/server";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { authorFeed, personAuthor } from "@/server/services/feed";
import { isPhone } from "@/server/view";

export const metadata: Metadata = { robots: { index: false } };

/** A person reached from the Fil (lot B3, on the phone); their full profile comes with lot B4. */
export default async function PersonPage({ params }: PageProps<"/app/personnes/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/app/personnes/${id}`);
  if (!(await isPhone())) redirect("/app");
  if (id === user.id) redirect("/app/career");
  const [person, posts, words, targets] = await Promise.all([
    personAuthor(db, user.id, id),
    authorFeed(db, user.id, { userId: id }),
    feedWords(user.id),
    sendTargetViews(user.id),
  ]);
  if (!person) notFound();
  return (
    <FilTexts>
      <FilProfile
        author={words.author(person.author)}
        posts={posts.map(words.post)}
        offers={[]}
        message={person.conversationId}
        targets={targets}
      />
    </FilTexts>
  );
}
