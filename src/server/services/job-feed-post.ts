import type { PrismaClient } from "@/generated/prisma/client";
import { FEED_BODY_MAX, FEED_TITLE_MAX } from "./feed-limits";

/**
 * The Fil post of an offer that goes live (« Publier aussi dans le Fil »): the title and the text
 * the recruiter wrote, in the company's name, with the offer's card. Once per offer; nothing when
 * the offer is not live yet (it is posted when Jumanly approves it) or has no title.
 */
export async function postOfferToFeed(db: PrismaClient, jobId: string) {
  const job = await db.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      feedTitle: true,
      feedText: true,
      createdById: true,
      organizationId: true,
    },
  });
  if (!job || job.status !== "published" || !job.feedTitle || !job.createdById) return null;
  const already = await db.feedPost.findFirst({
    where: { jobId: job.id, organizationId: job.organizationId, parentId: null },
    select: { id: true },
  });
  if (already) return already.id;
  const post = await db.feedPost.create({
    data: {
      authorId: job.createdById,
      organizationId: job.organizationId,
      kind: "post",
      jobId: job.id,
      title: job.feedTitle.slice(0, FEED_TITLE_MAX),
      body: (job.feedText ?? "").slice(0, FEED_BODY_MAX),
    },
    select: { id: true },
  });
  return post.id;
}
