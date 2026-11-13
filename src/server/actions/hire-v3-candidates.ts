"use server";

import { after } from "next/server";
import { z } from "zod";
import { deliverDueDecisionMails, onStageChanged } from "@/server/application-events";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { reportError } from "@/server/observability";
import { getOrgApplication, HireError, moveApplication } from "@/server/services/hire";

const moveInput = z.object({
  applicationId: z.string().trim().min(1).max(60),
  stageId: z.string().trim().min(1).max(60),
});

/**
 * A card dropped on a column, or « Étape suivante » (prototype v3, `kanban()` and `data-next`):
 * the move is the team's gesture, logged with who and when. The outcomes (« Recruté », « Non
 * retenu ») go through the decision screen and its message, never through a move alone.
 */
export async function moveCandidateV3Action(
  input: z.input<typeof moveInput>,
): Promise<{ ok: true } | { ok: false; error: "decision" | "invalid" }> {
  const parsed = moveInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { ctx } = await requireHire("/app/hire/candidats", "manage", "sort");
  try {
    const application = await getOrgApplication(db, ctx, parsed.data.applicationId);
    const stage = application.job.stages.find((item) => item.id === parsed.data.stageId);
    if (!stage) return { ok: false, error: "invalid" };
    if (stage.kind === "hired" || stage.kind === "rejected")
      return { ok: false, error: "decision" };
    const moved = await moveApplication(db, ctx, application.id, stage.id);
    if (moved) await onStageChanged(application.id, moved.to).catch((error) => reportError(error));
    after(() => deliverDueDecisionMails().catch((error) => reportError(error)));
    return { ok: true };
  } catch (error) {
    if (error instanceof HireError) return { ok: false, error: "invalid" };
    throw error;
  }
}
