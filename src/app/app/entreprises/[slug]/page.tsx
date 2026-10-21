import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { feedWords } from "@/components/phone/fil/data";
import { FilProfile } from "@/components/phone/fil/profile";
import { FilTexts, sendTargetViews } from "@/components/phone/fil/server";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { authorFeed, organizationAuthor } from "@/server/services/feed";
import { isPhone } from "@/server/view";

export const metadata: Metadata = { robots: { index: false } };

/**
 * An organization reached from the Fil (lot B3, on the phone): its offers and its posts. Its
 * full page (Publications, À propos, Offres, Membres) comes with lot B4; on a computer, the
 * public page of the organization.
 */
export default async function OrganizationPage({ params }: PageProps<"/app/entreprises/[slug]">) {
  const { slug } = await params;
  const user = await requireUser(`/app/entreprises/${slug}`);
  if (!(await isPhone())) redirect(`/entreprises/${slug}`);
  const [org, words, targets] = await Promise.all([
    organizationAuthor(db, slug),
    feedWords(user.id),
    sendTargetViews(user.id),
  ]);
  if (!org) notFound();
  const posts = await authorFeed(db, user.id, { organizationId: org.id });
  const contract = (value: string) =>
    words.t.has(`contract.${value}` as "contract.cdi")
      ? words.t(`contract.${value}` as "contract.cdi")
      : value;
  const remote = (value: string) =>
    words.t.has(`remote.${value}` as "remote.hybrid")
      ? words.t(`remote.${value}` as "remote.hybrid")
      : value;
  return (
    <FilTexts>
      <FilProfile
        author={words.author(org.author)}
        posts={posts.map(words.post)}
        offers={org.jobs.map((job) => ({
          href: `/app/jobs/${job.slug}`,
          title: job.title,
          line: words.t("offerLine", {
            city: job.city,
            contract: contract(job.contractType),
            remote: remote(job.remote),
          }),
        }))}
        message={null}
        targets={targets}
      />
    </FilTexts>
  );
}
