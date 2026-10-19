import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";

/** An interview is answered on the page of its application (planche talent-2 § 3). */
export default async function InterviewPage({
  params,
  searchParams,
}: PageProps<"/app/suivi/entretiens/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/app/suivi/entretiens/${id}`);
  const interview = await db.interview.findFirst({
    where: { id, application: { profile: { userId: user.id } } },
    select: { applicationId: true },
  });
  if (!interview) notFound();
  redirect(
    `/app/suivi/${interview.applicationId}${query.proposer === "1" ? "?proposer=1" : ""}#entretien`,
  );
}
