import { notFound, redirect } from "next/navigation";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { ensureApplicationConversation } from "@/server/services/connect";
import { getOrgApplication, HireError } from "@/server/services/hire";

/**
 * The former « Message » screen of a file: since the recruiter redesign (lot 5) the templates
 * open in the candidate's conversation (planche recruteur-3 `CONV_R`, « + » then « Modèles »).
 */
export default async function CandidateMessageRedirect({
  params,
}: PageProps<"/app/hire/candidats/[applicationId]/message">) {
  const { applicationId } = await params;
  const { ctx } = await requireHire(`/app/hire/candidats/${applicationId}/message`);
  try {
    await getOrgApplication(db, ctx, applicationId);
  } catch (error) {
    if (error instanceof HireError) notFound();
    throw error;
  }
  const conversation = await ensureApplicationConversation(db, applicationId);
  redirect(`/app/messages/${conversation.id}?modeles=1`);
}
