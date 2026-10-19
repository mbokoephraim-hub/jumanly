"use server";

import { refresh } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { reportError } from "@/server/observability";
import {
  askOrbi,
  clearOrbiHistory,
  deleteOrbiConversation,
  orbiInput,
  orbiTopics,
  type OrbiInput,
  type OrbiResult,
} from "@/server/services/orbi";

/**
 * One question to Orbi (talent lot 4 § 9). Order of CLAUDE.md: validate → session → rights and
 * credits (`askOrbi` → `runAi`) → service. Never throws: a failure becomes `failed`.
 */
export async function askOrbiAction(
  raw: OrbiInput,
): Promise<OrbiResult | { ok: false; error: "failed" }> {
  const parsed = orbiInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser("/app/orbi");
  const t = await getTranslations("talentOrbi.rules");
  const texts = {
    ...Object.fromEntries(orbiTopics.map((topic) => [topic, t(topic)])),
    declined: t("declined"),
    whyRules: t("whyRules"),
  } as Parameters<typeof askOrbi>[3];
  try {
    return await askOrbi(db, user.id, parsed.data, texts);
  } catch (error) {
    void reportError(error, { message: "Orbi" });
    return { ok: false, error: "failed" };
  }
}

const deleteInput = z.object({ id: z.string().trim().min(1).max(40) });

/** « Effacer cet échange » in the history. */
export async function deleteOrbiConversationAction(formData: FormData) {
  const parsed = deleteInput.safeParse({ id: formData.get("id") });
  const user = await requireUser("/app/orbi/historique");
  if (parsed.success) await deleteOrbiConversation(db, user.id, parsed.data.id);
  refresh();
}

/** « Effacer tout l'historique », after the confirmation. */
export async function clearOrbiHistoryAction() {
  const user = await requireUser("/app/orbi/historique");
  await clearOrbiHistory(db, user.id);
  refresh();
}
