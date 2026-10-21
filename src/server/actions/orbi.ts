"use server";

import { refresh } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { AI_CREDITS_KEY } from "@/server/ai";
import { db } from "@/server/db";
import { usage } from "@/server/entitlements";
import { getActiveSpace } from "@/server/hire-context";
import { reportError } from "@/server/observability";
import {
  organizationCreditsLeft,
  recruiterOrbiActions,
  recruiterPersona,
  recruiterTopics,
} from "@/server/services/recruiter-orbi";
import {
  askOrbi,
  askOrbiAs,
  clearOrbiHistory,
  getOrbiConversation,
  deleteOrbiConversation,
  orbiInput,
  orbiTopics,
  type OrbiInput,
  type OrbiReply,
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
  // In an organization's space, the recruiting assistant (recruteur lot 5): the organization's
  // credits and history, the pages of the recruiter space.
  const space = await getActiveSpace(user.id);
  if (space) {
    const tr = await getTranslations("rhOrbi.rules");
    const ctx = { userId: user.id, organizationId: space.organizationId, role: space.role };
    const texts = {
      ...Object.fromEntries(recruiterTopics.map((topic) => [topic, tr(topic)])),
      whyRules: tr("whyRules"),
    } as Parameters<typeof recruiterPersona>[2];
    try {
      return await askOrbiAs(db, user.id, parsed.data, recruiterPersona(db, ctx, texts));
    } catch (error) {
      void reportError(error, { message: "Orbi recruteur" });
      return { ok: false, error: "failed" };
    }
  }
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
  const space = await getActiveSpace(user.id);
  await clearOrbiHistory(db, user.id, space?.organizationId ?? null);
  refresh();
}

const panelInput = z.object({ id: z.string().trim().min(1).max(40).nullable() });

/**
 * What the Orbi panel of the web frame needs when it opens (`?orbi=1` or `?orbi=<id>` on any page,
 * brief web § 2.4): the credits left this month (null when unlimited) and the exchange to reopen.
 * Read only; an unknown or erased exchange opens a new one.
 */
export async function orbiPanelAction(raw: { id: string | null }): Promise<{
  credits: number | null;
  conversationId: string | null;
  messages: OrbiReply[];
}> {
  const parsed = panelInput.safeParse(raw);
  const user = await requireUser("/app");
  const id = parsed.success ? parsed.data.id : null;
  // In an organization's space (web recruteur lot 3): the organization's credits and an exchange
  // of that space only, like the page (`RecruiterOrbi`).
  const space = await getActiveSpace(user.id);
  if (space) {
    const [left, conversation] = await Promise.all([
      organizationCreditsLeft(db, space.organizationId),
      id
        ? getOrbiConversation(db, user.id, id, {
            organizationId: space.organizationId,
            actions: recruiterOrbiActions,
          })
        : null,
    ]);
    return {
      credits: left,
      conversationId: conversation?.id ?? null,
      messages: conversation?.messages ?? [],
    };
  }
  const [credits, conversation] = await Promise.all([
    usage(db, { type: "user", id: user.id }, AI_CREDITS_KEY),
    id ? getOrbiConversation(db, user.id, id) : null,
  ]);
  return {
    credits: credits.limit < 0 ? null : Math.max(0, credits.limit - credits.used),
    conversationId: conversation?.id ?? null,
    messages: conversation?.messages ?? [],
  };
}
