"use server";

import { getFormatter, getTranslations } from "next-intl/server";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { reportError } from "@/server/observability";
import {
  draftInput,
  draftMessage,
  type DraftInput,
  type DraftResult,
} from "@/server/services/message-drafts";

/**
 * Orbi's chips in a recruiter's conversation (planche recruteur-3 `CONV_R`): a draft for the
 * composer, never a message sent. Order of CLAUDE.md: validate → session → space → rights and
 * credits (`draftMessage` → `runAi`) → service. Never throws: a failure becomes `failed`.
 */
export async function draftMessageAction(
  raw: DraftInput,
): Promise<DraftResult | { ok: false; error: "failed" }> {
  const parsed = draftInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser(`/app/messages/${parsed.data.conversationId}`);
  const space = await getActiveSpace(user.id);
  if (!space) return { ok: false, error: "forbidden" };
  const ctx = { userId: user.id, organizationId: space.organizationId, role: space.role };
  const t = await getTranslations("rhThread.orbi.template");
  const format = await getFormatter();
  try {
    return await draftMessage(db, ctx, parsed.data, {
      reply: (values) => t("reply", values).replaceAll("\\n", "\n"),
      summary: ({ first, ...values }) =>
        t("summary", {
          ...values,
          first: format.dateTime(new Date(first), { day: "numeric", month: "long" }),
        }),
      greeting: (values) => t("greeting", values),
      closing: t("closing"),
      you: t("you"),
    });
  } catch (error) {
    void reportError(error, { message: "Brouillon Orbi (conversation recruteur)" });
    return { ok: false, error: "failed" };
  }
}
